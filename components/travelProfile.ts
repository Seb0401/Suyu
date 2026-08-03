"use client";

/**
 * Perfil de viaje del usuario.
 *
 * Vive en localStorage y NO requiere cuenta: §2.1 manda que la app funcione
 * completa sin red y sin keys, asi que la personalizacion no puede depender de
 * un login. La cuenta (AccountSection) es un extra opcional que sincroniza
 * esto mismo entre dispositivos.
 */

import type { AccessNeedId } from "@/components/accessNeeds";
import type { TravelerPersonality } from "@/components/travelerPersonalities";

export const PROFILE_KEY = "suyu:travel-profile";

export type Companions = "solo" | "pareja" | "ninos" | "adultos-mayores";
export type Pace = "evitar-multitudes" | "sin-preferencia";
export type Interest = "cultura" | "gastronomia" | "naturaleza";

export interface TravelProfile {
  /**
   * Necesidades de accesibilidad. Las cuatro primeras claves coinciden con las
   * de Site y sirven para filtrar directo; el resto (definidas en
   * components/accessNeeds.ts) alimentan avisos.
   */
  needs: Partial<Record<AccessNeedId, boolean>>;
  companions: Companions[];
  interests: Interest[];
  /** Horas disponibles para el itinerario. */
  hours: number;
  pace: Pace;
  /** Personalidad de viaje. null = no eligio ninguna, que es valido. */
  personality: TravelerPersonality | null;
  /**
   * true si el usuario abrio las necesidades sensibles desde Perfil.
   *
   * Se guarda aparte del contenido: sirve para no volver a mostrar la
   * invitacion a alguien que ya la vio y decidio que no le aplica.
   */
  sensitive_needs_enabled: boolean;
  /** ISO de cuando se completo. null = nunca respondio el onboarding. */
  completed_at: string | null;
}

export const EMPTY_PROFILE: TravelProfile = {
  needs: {},
  companions: [],
  interests: [],
  hours: 4,
  pace: "sin-preferencia",
  personality: null,
  sensitive_needs_enabled: false,
  completed_at: null,
};

export function readProfile(): TravelProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<TravelProfile>;
    // Merge sobre EMPTY_PROFILE: un perfil guardado por una version anterior
    // puede no tener todos los campos y no debe romper la pantalla.
    return {
      ...EMPTY_PROFILE,
      ...parsed,
      needs: { ...EMPTY_PROFILE.needs, ...(parsed.needs ?? {}) },
      companions: parsed.companions ?? [],
      interests: parsed.interests ?? [],
      // Un perfil guardado antes de las personalidades trae estos en
      // undefined, y `...parsed` los propagaria pisando el valor por defecto.
      personality: parsed.personality ?? null,
      sensitive_needs_enabled: parsed.sensitive_needs_enabled ?? false,
    };
  } catch {
    /* localStorage bloqueado (modo privado) o JSON corrupto. El perfil es
       comodidad, no requisito: se sigue con el vacio. */
    return EMPTY_PROFILE;
  }
}

export function writeProfile(profile: TravelProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ver readProfile */
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ver readProfile */
  }
}

/** true si el usuario viaja con niños — activa el aviso de aptitud infantil. */
export function travelsWithKids(profile: TravelProfile): boolean {
  return profile.companions.includes("ninos") || profile.personality === "familiar";
}

export function hasAccessibilityNeeds(profile: TravelProfile): boolean {
  return Object.values(profile.needs).some(Boolean);
}

export function needs(profile: TravelProfile, id: AccessNeedId): boolean {
  return profile.needs[id] === true;
}

/** true si viaja con mascota, por necesidad marcada o por perro guia. */
export function travelsWithAnimal(profile: TravelProfile): boolean {
  return needs(profile, "travels_with_pet") || needs(profile, "guide_dog");
}

/**
 * true si hay que avisar sobre la altura antes de recomendar el Colca o un
 * volcan. El aviso general de altura existe para todos; esto lo vuelve
 * personal y lo sube de prioridad.
 */
export function needsAltitudeWarning(profile: TravelProfile): boolean {
  return needs(profile, "cardiac_or_respiratory");
}
