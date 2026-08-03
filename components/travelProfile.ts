"use client";

/**
 * Perfil de viaje del usuario.
 *
 * Vive en localStorage y NO requiere cuenta: §2.1 manda que la app funcione
 * completa sin red y sin keys, asi que la personalizacion no puede depender de
 * un login. La cuenta (AccountSection) es un extra opcional que sincroniza
 * esto mismo entre dispositivos.
 */

export const PROFILE_KEY = "suyu:travel-profile";

export type Companions = "solo" | "pareja" | "ninos" | "adultos-mayores";
export type Pace = "evitar-multitudes" | "sin-preferencia";
export type Interest = "cultura" | "gastronomia" | "naturaleza";

export interface TravelProfile {
  /** Rasgos de accesibilidad que el usuario necesita. Claves de Site. */
  needs: {
    wheelchair_accessible?: boolean;
    has_ramps?: boolean;
    has_accessible_bathroom?: boolean;
    has_rest_areas?: boolean;
  };
  companions: Companions[];
  interests: Interest[];
  /** Horas disponibles para el itinerario. */
  hours: number;
  pace: Pace;
  /** ISO de cuando se completo. null = nunca respondio el onboarding. */
  completed_at: string | null;
}

export const EMPTY_PROFILE: TravelProfile = {
  needs: {},
  companions: [],
  interests: [],
  hours: 4,
  pace: "sin-preferencia",
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
  return profile.companions.includes("ninos");
}

export function hasAccessibilityNeeds(profile: TravelProfile): boolean {
  return Object.values(profile.needs).some(Boolean);
}
