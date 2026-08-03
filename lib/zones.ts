import zonesJson from "@/data/seed-zones.json";

/**
 * Mejor epoca para visitar, por zona de la region de Arequipa.
 *
 * El criterio NO es solo meteorologico. Arequipa casi no tiene fenomenos
 * extremos, asi que "buen clima" no distingue nada: lo que cambia entre un mes
 * y otro es la EXPERIENCIA — si se ven los volcanes, si el condor remonta, si
 * el sendero esta firme, cuanta gente hay.
 *
 * Por eso cada zona separa cuatro cosas que suelen ir mezcladas:
 * best_months (cuando la experiencia es buena), sweet_spot (cuando ademas hay
 * poca gente), avoid_months (cuando se degrada) y crowd_months (cuando es
 * bueno pero caro y lleno). Un mes puede ser bueno Y estar lleno; decir solo
 * "la mejor epoca es julio" esconde la mitad del dato.
 */

export interface TourismZone {
  id: string;
  name: string;
  kind: "provincia" | "region";
  summary: string;
  altitude_label: string;
  best_months: number[];
  sweet_spot_months: number[];
  sweet_spot_reason: string;
  why: string;
  avoid_months: number[];
  avoid_reason: string;
  crowd_months: number[];
  crowd_reason: string;
  accessibility_note: string;
  /** Sitios de la app que caen en esta zona. Vacio = todavia no hay ninguno. */
  site_ids: string[];
  sources: string;
}

export type MonthStatus = "optimo" | "bueno" | "lleno" | "evitar" | "regular";

export interface ZoneWithStatus extends TourismZone {
  /** Estado de los 12 meses, indice 0 = enero. Para pintar la tira. */
  months: MonthStatus[];
  /** Estado del mes en curso. */
  current: MonthStatus;
  /** true si el mes en curso es de los buenos. */
  good_now: boolean;
}

const ZONES = zonesJson as TourismZone[];

export const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const MONTH_SHORT = [
  "E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D",
];

/**
 * El orden de precedencia importa y no es arbitrario:
 * evitar > optimo > lleno > bueno.
 *
 * "Lleno" gana sobre "bueno" porque es informacion que el usuario necesita
 * antes de reservar, pero pierde contra "optimo" porque un mes marcado como
 * punto dulce ya se eligio a pesar de la gente.
 */
function statusFor(zone: TourismZone, month: number): MonthStatus {
  if (zone.avoid_months.includes(month)) return "evitar";
  if (zone.sweet_spot_months.includes(month)) return "optimo";
  if (zone.crowd_months.includes(month)) return "lleno";
  if (zone.best_months.includes(month)) return "bueno";
  return "regular";
}

export function getZones(today: Date = new Date()): ZoneWithStatus[] {
  const currentMonth = today.getMonth() + 1;

  return ZONES.map((zone) => {
    const months = Array.from({ length: 12 }, (_, i) => statusFor(zone, i + 1));
    const current = months[currentMonth - 1];
    return {
      ...zone,
      months,
      current,
      good_now: current === "optimo" || current === "bueno" || current === "lleno",
    };
  });
}

export function getZone(
  id: string,
  today: Date = new Date(),
): ZoneWithStatus | null {
  return getZones(today).find((z) => z.id === id) ?? null;
}

/** Zona a la que pertenece un sitio. null si el sitio no esta mapeado. */
export function getZoneForSite(
  siteId: string,
  today: Date = new Date(),
): ZoneWithStatus | null {
  return getZones(today).find((z) => z.site_ids.includes(siteId)) ?? null;
}

/** Texto listo para mostrar: "de mayo a septiembre", "enero y febrero". */
export function monthRangeLabel(months: number[]): string {
  if (months.length === 0) return "";
  if (months.length === 1) return MONTH_NAMES[months[0] - 1];

  const sorted = [...months].sort((a, b) => a - b);
  const consecutive = sorted.every((m, i) => i === 0 || m === sorted[i - 1] + 1);

  if (consecutive) {
    return `de ${MONTH_NAMES[sorted[0] - 1]} a ${MONTH_NAMES[sorted[sorted.length - 1] - 1]}`;
  }
  const names = sorted.map((m) => MONTH_NAMES[m - 1]);
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}
