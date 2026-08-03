import type { Site, SiteWithCrowd } from "@/lib/types";

/**
 * Filtros y puntaje de accesibilidad.
 *
 * El puntaje NO es una medicion: es cuantos de los cuatro rasgos que sabemos
 * comprobar estan presentes. Se muestra siempre junto a la procedencia del dato
 * (§2.1) para que nadie lo lea como una certificacion.
 */

export interface AccessibilityFilters {
  wheelchair?: boolean;
  ramps?: boolean;
  bathroom?: boolean;
  restAreas?: boolean;
}

const FEATURES = [
  "wheelchair_accessible",
  "has_ramps",
  "has_accessible_bathroom",
  "has_rest_areas",
] as const satisfies readonly (keyof Site)[];

/** 0-100 segun cuantos de los cuatro rasgos comprobables estan presentes. */
export function accessibilityScore(site: Site): number {
  const present = FEATURES.filter((feature) => site[feature] === true).length;
  return Math.round((present / FEATURES.length) * 100);
}

/**
 * Accesibilidad de un tramo: el eslabon mas debil manda. Promediar seria
 * enganoso — una ruta con un extremo inaccesible no es "medio accesible",
 * es inaccesible para quien la necesita.
 */
export function routeAccessibilityScore(from: Site, to: Site): number {
  return Math.min(accessibilityScore(from), accessibilityScore(to));
}

export interface AccessibilityMilestone {
  site_id: string;
  site_name: string;
  label: string;
  ok: boolean;
}

/**
 * Hitos de accesibilidad del tramo. Se superponen sobre la ruta, no se calculan
 * a partir de ella (§6.5): no tenemos datos de la acera, solo de los extremos.
 */
export function accessibilityMilestones(
  from: SiteWithCrowd,
  to: SiteWithCrowd,
): AccessibilityMilestone[] {
  const perSite = (site: SiteWithCrowd): AccessibilityMilestone[] => [
    {
      site_id: site.id,
      site_name: site.name,
      label: site.wheelchair_accessible
        ? "Acceso en silla de ruedas"
        : "Sin acceso en silla de ruedas",
      ok: site.wheelchair_accessible,
    },
    {
      site_id: site.id,
      site_name: site.name,
      label: site.has_ramps ? "Rampa disponible" : "Sin rampa",
      ok: site.has_ramps,
    },
    {
      site_id: site.id,
      site_name: site.name,
      label: site.has_accessible_bathroom
        ? "Bano accesible"
        : "Sin bano accesible confirmado",
      ok: site.has_accessible_bathroom,
    },
    {
      site_id: site.id,
      site_name: site.name,
      label: site.has_rest_areas
        ? "Zona de descanso"
        : "Sin zona de descanso confirmada",
      ok: site.has_rest_areas,
    },
  ];

  return [...perSite(from), ...perSite(to)];
}

export function matchesFilters(
  site: Site,
  filters: AccessibilityFilters,
): boolean {
  if (filters.wheelchair && !site.wheelchair_accessible) return false;
  if (filters.ramps && !site.has_ramps) return false;
  if (filters.bathroom && !site.has_accessible_bathroom) return false;
  if (filters.restAreas && !site.has_rest_areas) return false;
  return true;
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): AccessibilityFilters {
  return {
    wheelchair: params.get("accessible") === "true",
    ramps: params.get("ramps") === "true",
    bathroom: params.get("bathroom") === "true",
    restAreas: params.get("rest") === "true",
  };
}
