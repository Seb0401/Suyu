import type { CrowdLevel } from "@/lib/types";

/**
 * Lectura del perfil horario de aforo (CLAUDE.md §6.3).
 *
 * La regla que mas se malinterpreta: una ocupacion de 0 significa CERRADO, no
 * "poca gente". Por eso `crowdLevelAt` devuelve null y no "bajo" en ese caso —
 * quien consuma esto tiene que decidir explicitamente que mostrar.
 */

export const CROWD_THRESHOLDS = {
  alto: 70,
  medio: 40,
} as const;

export const HOURS_IN_DAY = 24;

/** Arequipa es UTC-5 todo el ano, sin horario de verano. */
const AREQUIPA_UTC_OFFSET_HOURS = -5;

export function currentHourInArequipa(now: Date = new Date()): number {
  const shifted = new Date(
    now.getTime() + AREQUIPA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
  return shifted.getUTCHours();
}

/** Normaliza cualquier entrada a una hora valida 0-23. */
export function normalizeHour(hour: unknown): number | null {
  const n = typeof hour === "string" ? Number(hour) : hour;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 23) {
    return null;
  }
  return n;
}

export function occupancyAt(profile: number[], hour: number): number {
  return profile[hour] ?? 0;
}

export function isClosedAt(profile: number[], hour: number): boolean {
  return occupancyAt(profile, hour) === 0;
}

export function crowdLevelFromOccupancy(occupancy: number): CrowdLevel | null {
  if (occupancy === 0) return null; // cerrado
  if (occupancy >= CROWD_THRESHOLDS.alto) return "alto";
  if (occupancy >= CROWD_THRESHOLDS.medio) return "medio";
  return "bajo";
}

export function crowdLevelAt(
  profile: number[],
  hour: number,
): CrowdLevel | null {
  return crowdLevelFromOccupancy(occupancyAt(profile, hour));
}

export interface HourSuggestion {
  hour: number;
  occupancy: number;
  level: CrowdLevel;
}

/**
 * Proxima hora abierta con aforo bajo, buscando hacia adelante dentro del mismo
 * dia. No cruza a manana: "vuelve manana a las 9" no le sirve a alguien que ya
 * esta parado en la puerta.
 */
export function nextQuietHour(
  profile: number[],
  fromHour: number,
): HourSuggestion | null {
  for (let hour = fromHour + 1; hour < HOURS_IN_DAY; hour++) {
    const occupancy = occupancyAt(profile, hour);
    const level = crowdLevelFromOccupancy(occupancy);
    if (level === "bajo") return { hour, occupancy, level };
  }
  return null;
}

/** Hora abierta con menos gente de todo el dia. */
export function bestHour(profile: number[]): HourSuggestion | null {
  let best: HourSuggestion | null = null;
  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    const occupancy = occupancyAt(profile, hour);
    const level = crowdLevelFromOccupancy(occupancy);
    if (level === null) continue; // cerrado
    if (best === null || occupancy < best.occupancy) {
      best = { hour, occupancy, level };
    }
  }
  return best;
}

/** Horas del dia en las que el sitio esta abierto. */
export function openHours(profile: number[]): number[] {
  const hours: number[] = [];
  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    if (!isClosedAt(profile, hour)) hours.push(hour);
  }
  return hours;
}

/** "09:00" a partir de 9. Formato unico para toda la app. */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Rango de apertura como texto ("09:00 a 18:00"). Devuelve null si el sitio
 * nunca cierra (la Plaza de Armas) o si nunca abre.
 */
export function openingRangeLabel(profile: number[]): string | null {
  const hours = openHours(profile);
  if (hours.length === 0 || hours.length === HOURS_IN_DAY) return null;
  const first = hours[0];
  const last = hours[hours.length - 1];
  return `${formatHour(first)} a ${formatHour(last + 1)}`;
}
