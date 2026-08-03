import { crowdLevelAt, isClosedAt, formatHour } from "@/lib/crowdProfile";
import { haversineMeters, isWalkable, walkingMinutes } from "@/lib/geo";
import { getSiteDetail } from "@/lib/siteDetails";
import type { SiteWithCrowd } from "@/lib/types";

/**
 * Planificador de itinerario (CLAUDE.md §6.7 del plan, A7).
 *
 * Es voraz a proposito: en cada paso elige el siguiente sitio con el mejor
 * balance entre cercania y aforo. Un optimo global no aporta nada aqui — con
 * seis sitios la diferencia es de minutos, y el turista reordena el plan igual
 * en cuanto le llueve o se le antoja un almuerzo largo.
 */

/** Minutos de visita por categoria. Curados a mano, no medidos. */
const VISIT_MINUTES: Record<string, number> = {
  museo: 90,
  iglesia: 40,
  mirador: 30,
  plaza: 25,
};

const DEFAULT_VISIT_MINUTES = 45;

/**
 * La ficha tecnica del sitio manda sobre la categoria: es un dato curado para
 * ese sitio en concreto, no un promedio de su tipo. La categoria queda como
 * fallback para sitios sin ficha.
 */
export function visitMinutesFor(site: SiteWithCrowd): number {
  const curated = getSiteDetail(site.id)?.recommended_visit_minutes;
  if (typeof curated === "number" && curated > 0) return curated;
  return VISIT_MINUTES[site.category] ?? DEFAULT_VISIT_MINUTES;
}

export interface ItineraryStop {
  site: SiteWithCrowd;
  /** Hora de llegada, 0-23. */
  arrive_hour: number;
  arrive_label: string;
  visit_minutes: number;
  /** Traslado desde la parada anterior. null en la primera. */
  travel_from_previous_min: number | null;
  travel_from_previous_m: number | null;
  /** false = el tramo es demasiado largo para hacerlo a pie. */
  walkable: boolean;
  crowd_at_arrival: ReturnType<typeof crowdLevelAt>;
}

export interface Itinerary {
  stops: ItineraryStop[];
  total_minutes: number;
  /** Sitios que quedaron fuera y por que. Nunca se descartan en silencio. */
  skipped: { site: SiteWithCrowd; reason: string }[];
  /** true si algun tramo no es caminable: la UI sugiere taxi. */
  needs_transport: boolean;
}

export interface ItineraryOptions {
  startHour: number;
  availableMinutes: number;
  accessibleOnly?: boolean;
  /** Si se indica, el recorrido arranca en este sitio. */
  startSiteId?: string;
}

/**
 * Puntaje del siguiente candidato: menos es mejor. Suma el tiempo de traslado
 * y una penalizacion por aforo, para que un sitio saturado a diez minutos
 * pierda contra uno tranquilo a veinte.
 */
function stepCost(
  from: SiteWithCrowd | null,
  candidate: SiteWithCrowd,
  hour: number,
): number {
  const meters = from ? haversineMeters(from, candidate) : 0;
  const travel = walkingMinutes(meters);
  const level = crowdLevelAt(candidate.crowd_profile, hour);
  const crowdPenalty = level === "alto" ? 45 : level === "medio" ? 15 : 0;
  return travel + crowdPenalty;
}

export function buildItinerary(
  sites: SiteWithCrowd[],
  options: ItineraryOptions,
): Itinerary {
  const { startHour, availableMinutes, accessibleOnly, startSiteId } = options;

  const skipped: Itinerary["skipped"] = [];
  let pool = [...sites];

  if (accessibleOnly) {
    for (const site of pool.filter((s) => !s.wheelchair_accessible)) {
      skipped.push({ site, reason: "No tiene acceso en silla de ruedas." });
    }
    pool = pool.filter((s) => s.wheelchair_accessible);
  }

  const stops: ItineraryStop[] = [];
  let current: SiteWithCrowd | null = null;
  /** El sitio con el que el usuario pidio arrancar; manda solo en la primera vuelta. */
  let forced = pool.find((s) => s.id === startSiteId) ?? null;
  let elapsed = 0;
  let hour = startHour;

  while (pool.length > 0) {
    const candidates = pool.filter((s) => !isClosedAt(s.crowd_profile, hour));

    if (candidates.length === 0) break;

    const next: SiteWithCrowd =
      forced && candidates.includes(forced)
        ? forced
        : candidates.reduce((best, candidate) =>
            stepCost(current, candidate, hour) < stepCost(current, best, hour)
              ? candidate
              : best,
          );
    forced = null;

    const meters = current ? Math.round(haversineMeters(current, next)) : null;
    const travel = meters === null ? null : walkingMinutes(meters);
    const visit = visitMinutesFor(next);
    const cost = (travel ?? 0) + visit;

    if (elapsed + cost > availableMinutes) {
      skipped.push({ site: next, reason: "No entra en el tiempo disponible." });
      pool = pool.filter((s) => s.id !== next.id);
      continue;
    }

    // Se llega DESPUES del traslado pero ANTES de la visita. Sumar tambien la
    // visita daria la hora de salida, no la de llegada.
    const arriveHour = (startHour + Math.floor((elapsed + (travel ?? 0)) / 60)) % 24;

    elapsed += cost;
    hour = (startHour + Math.floor(elapsed / 60)) % 24;

    stops.push({
      site: next,
      arrive_hour: arriveHour,
      arrive_label: formatHour(arriveHour),
      visit_minutes: visit,
      travel_from_previous_min: travel,
      travel_from_previous_m: meters,
      walkable: meters === null ? true : isWalkable(meters),
      crowd_at_arrival: crowdLevelAt(next.crowd_profile, arriveHour),
    });

    current = next;
    pool = pool.filter((s) => s.id !== next.id);
  }

  // Lo que quedo en el pool no cabia o estaba cerrado: se declara, no se calla.
  for (const site of pool) {
    if (skipped.some((s) => s.site.id === site.id)) continue;
    skipped.push({
      site,
      reason: isClosedAt(site.crowd_profile, hour)
        ? `Cerrado a las ${formatHour(hour)}.`
        : "No entra en el tiempo disponible.",
    });
  }

  return {
    stops,
    total_minutes: elapsed,
    skipped,
    needs_transport: stops.some((stop) => !stop.walkable),
  };
}
