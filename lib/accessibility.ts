import raw from "@/data/site-accessibility.json";
import type {
  AccessibilityGrade,
  AccessibilityRating,
  SiteAccessibilityDetail,
} from "@/lib/types";

/**
 * Estado de los servicios de accesibilidad, sitio por sitio.
 *
 * Los booleanos `has_*` de Site siguen diciendo si el rasgo EXISTE. Esto dice
 * COMO esta. Son preguntas distintas y la diferencia importa: el Museo
 * Santuarios Andinos declara baño adaptado (`has_accessible_bathroom: true`),
 * pero la puerta mide menos de 78 cm y no hay barras de apoyo — o sea, existe y
 * no sirve. Con solo el booleano, un usuario de silla de ruedas llegaria
 * creyendo que puede usarlo.
 *
 * Sin tabla en Supabase por ahora, igual que site_details/stories/agencies
 * (§6.2): es contenido curado a partir de fichas publicas, no un dato
 * operativo que cambie solo.
 */

const DETAILS = raw as SiteAccessibilityDetail[];
const BY_ID = new Map(DETAILS.map((d) => [d.site_id, d]));

export const RATING_LABEL: Record<AccessibilityRating, string> = {
  1: "Deficiente",
  2: "Utilizable con apoyo",
  3: "En buen estado",
};

export const NO_RATING_LABEL = "Sin dato";

/**
 * Perro guia. NO es una politica del sitio sino un derecho: la Ley 29830,
 * modificada por la Ley 30433, garantiza el acceso libre de personas con
 * discapacidad visual acompañadas de su perro guia a lugares publicos y
 * privados de uso publico, sin pago adicional y sin limite de permanencia. La
 * unica excepcion son las areas exclusivas de atencion de salud.
 *
 * Por eso va aparte de `pet_policy`: si un sitio dice "no se admiten mascotas",
 * eso no alcanza al perro guia, y mezclarlos desinformaria justo a quien mas
 * necesita el dato.
 */
export const GUIDE_DOG_NOTICE =
  "Los perros guía tienen acceso garantizado por la Ley 29830, aunque el lugar no admita mascotas.";

export const GUIDE_DOG_LAW_URL =
  "https://busquedas.elperuano.pe/normaslegales/ley-que-promueve-y-regula-el-uso-de-perros-guia-por-personas-ley-n-29830-738396-2";

export function getAccessibilityDetail(siteId: string): SiteAccessibilityDetail | null {
  return BY_ID.get(siteId) ?? null;
}

export function getAllAccessibilityDetails(): SiteAccessibilityDetail[] {
  return DETAILS;
}

/**
 * Promedio de lo que SI pudimos calificar. Devuelve null si no hay ni una nota:
 * un sitio sin datos no puede quedar con la misma cifra que uno evaluado.
 */
export function averageRating(detail: SiteAccessibilityDetail): number | null {
  const grades: AccessibilityGrade[] = [
    detail.ramps,
    detail.steps,
    detail.accessible_bathroom,
    detail.rest_areas,
    detail.wheelchair_circulation,
  ];
  const rated = grades.map((g) => g.rating).filter((r): r is AccessibilityRating => r !== null);
  if (rated.length === 0) return null;
  return rated.reduce((sum, r) => sum + r, 0) / rated.length;
}

/** Cuantos de los 4 rasgos tienen calificacion. La UI lo muestra junto al promedio. */
export function ratedCount(detail: SiteAccessibilityDetail): number {
  return [
    detail.ramps,
    detail.steps,
    detail.accessible_bathroom,
    detail.rest_areas,
    detail.wheelchair_circulation,
  ].filter((g) => g.rating !== null).length;
}
