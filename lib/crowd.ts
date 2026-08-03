import { nextQuietHour, occupancyAt } from "@/lib/crowdProfile";
import type { HourSuggestion } from "@/lib/crowdProfile";
import { haversineMeters, walkingMinutes } from "@/lib/geo";
import type { SiteWithCrowd } from "@/lib/types";

/**
 * Recomendador anti-aforo (CLAUDE.md §6.4).
 *
 * Se dispara solo cuando el sitio esta en "alto": desviar a alguien de un sitio
 * medio vacio es ruido, y le quita credibilidad al aviso cuando de verdad hace
 * falta.
 */

export type AlternativeReason = "misma_categoria" | "mas_cercano";

export interface Alternative {
  site: SiteWithCrowd;
  reason: AlternativeReason;
  distance_m: number;
  walking_min: number;
  /** Texto listo para mostrar; el copiloto usa el mismo. */
  message: string;
}

export interface AntiCrowdAdvice {
  /** null si el sitio no esta saturado: no hay nada que recomendar. */
  alternative: Alternative | null;
  /** Cuando baja la gente en el MISMO sitio, si es que baja hoy. */
  quiet_hour: HourSuggestion | null;
  saturated: boolean;
}

interface Options {
  /** Si el usuario pidio accesibilidad, la alternativa tambien la respeta. */
  accessibleOnly?: boolean;
}

function isOpenAndCalmer(candidate: SiteWithCrowd): boolean {
  if (candidate.crowd_closed) return false;
  return candidate.crowd_level === "bajo" || candidate.crowd_level === "medio";
}

function buildAlternative(
  site: SiteWithCrowd,
  candidate: SiteWithCrowd,
  reason: AlternativeReason,
): Alternative {
  const distance_m = Math.round(haversineMeters(site, candidate));
  const walking_min = walkingMinutes(distance_m);
  const closeness =
    distance_m <= 1500
      ? `a ${walking_min} min a pie`
      : `a ${(distance_m / 1000).toFixed(1)} km`;

  const message =
    reason === "misma_categoria"
      ? `${site.name} esta muy congestionado. ${candidate.name} es del mismo tipo, esta ${closeness} y ahora tiene menos gente.`
      : `${site.name} esta muy congestionado. Lo mas cercano con menos gente es ${candidate.name}, ${closeness}.`;

  return { site: candidate, reason, distance_m, walking_min, message };
}

/**
 * Alternativa a un sitio saturado. Primero busca misma categoria; si no hay,
 * cae al mas cercano menos congestionado.
 *
 * Sin ese fallback la funcion casi nunca se dispararia en el demo: cuatro de
 * las cinco categorias del dataset tienen un solo sitio.
 */
export function suggestAlternative(
  site: SiteWithCrowd,
  all: SiteWithCrowd[],
  hour: number,
  options: Options = {},
): Alternative | null {
  if (site.crowd_level !== "alto") return null;

  let candidates = all.filter(
    (candidate) => candidate.id !== site.id && isOpenAndCalmer(candidate),
  );

  if (options.accessibleOnly) {
    candidates = candidates.filter((c) => c.wheelchair_accessible);
  }

  if (candidates.length === 0) return null;

  const byOccupancyThenDistance = (a: SiteWithCrowd, b: SiteWithCrowd) => {
    const diff =
      occupancyAt(a.crowd_profile, hour) - occupancyAt(b.crowd_profile, hour);
    if (diff !== 0) return diff;
    return haversineMeters(site, a) - haversineMeters(site, b);
  };

  const sameCategory = candidates
    .filter((c) => c.category === site.category)
    .sort(byOccupancyThenDistance);

  if (sameCategory.length > 0) {
    return buildAlternative(site, sameCategory[0], "misma_categoria");
  }

  const nearest = [...candidates].sort(
    (a, b) => haversineMeters(site, a) - haversineMeters(site, b),
  );

  return buildAlternative(site, nearest[0], "mas_cercano");
}

/**
 * Consejo completo. La hora tranquila se calcula aunque haya alternativa:
 * "esta saturado ahora, a las 17:00 baja" suele ser mas util que mandar al
 * turista a otro lado.
 */
export function antiCrowdAdvice(
  site: SiteWithCrowd,
  all: SiteWithCrowd[],
  hour: number,
  options: Options = {},
): AntiCrowdAdvice {
  const saturated = site.crowd_level === "alto";
  return {
    saturated,
    alternative: suggestAlternative(site, all, hour, options),
    quiet_hour: saturated ? nextQuietHour(site.crowd_profile, hour) : null,
  };
}
