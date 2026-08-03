"use client";

import type { Interest, Pace, TravelProfile } from "@/components/travelProfile";

/**
 * Personalidades de viajero.
 *
 * No son etiquetas decorativas: cada una PRECARGA decisiones concretas del
 * perfil (horas, ritmo, intereses, dificultad tolerada) para que el usuario no
 * tenga que contestar seis preguntas antes de usar la app. Elegir una es un
 * atajo, no un compromiso — todo lo que rellena se puede cambiar despues en
 * Perfil, y por eso el onboarding lo dice.
 *
 * Deliberadamente NO tocan `needs`: la accesibilidad no se infiere de una
 * personalidad. Alguien aventurero puede usar silla de ruedas, y precargarle
 * "no necesita nada" por haber elegido "aventurero" seria justo el prejuicio
 * que esta app existe para corregir.
 */

export type TravelerPersonality =
  | "aventurero"
  | "familiar"
  | "cultural"
  | "gastronomico"
  | "tranquilo";

/** Dificultad maxima de actividad que la personalidad tolera. */
export type DifficultyCeiling = "facil" | "moderado" | "exigente";

export interface PersonalityDefinition {
  id: TravelerPersonality;
  label: string;
  tagline: string;
  /** Lo que cambia en la app al elegirla. Se muestra: nada de magia opaca. */
  effects: string[];
  defaults: {
    hours: number;
    pace: Pace;
    interests: Interest[];
  };
  difficulty_ceiling: DifficultyCeiling;
  /** Categorias de servicio que se muestran primero. */
  service_priority: string[];
}

export const PERSONALITIES: PersonalityDefinition[] = [
  {
    id: "aventurero",
    label: "Aventurero",
    tagline: "Canotaje, volcanes y madrugar si hace falta.",
    effects: [
      "Prioriza actividades sobre museos",
      "Muestra también las opciones exigentes, con sus requisitos",
      "Días más largos en el itinerario",
    ],
    defaults: { hours: 8, pace: "sin-preferencia", interests: ["naturaleza"] },
    difficulty_ceiling: "exigente",
    service_priority: ["actividad", "agencia", "transporte"],
  },
  {
    id: "familiar",
    label: "En familia",
    tagline: "Con niños: distancias cortas y baño a mano.",
    effects: [
      "Avisa si un lugar es apto para ir con niños",
      "Da prioridad a los sitios con baño familiar",
      "Evita actividades exigentes y jornadas largas",
    ],
    defaults: { hours: 4, pace: "evitar-multitudes", interests: ["cultura", "naturaleza"] },
    difficulty_ceiling: "facil",
    service_priority: ["restaurante", "actividad", "salud"],
  },
  {
    id: "cultural",
    label: "Cultural",
    tagline: "Historia, arquitectura y museos con calma.",
    effects: [
      "Prioriza museos, iglesias y casonas",
      "Muestra primero la ficha histórica de cada lugar",
      "Más tiempo por parada, menos paradas",
    ],
    defaults: { hours: 5, pace: "evitar-multitudes", interests: ["cultura"] },
    difficulty_ceiling: "facil",
    service_priority: ["guia", "agencia", "artesania"],
  },
  {
    id: "gastronomico",
    label: "Gastronómico",
    tagline: "Picanterías, mercados y el rocoto relleno.",
    effects: [
      "Prioriza picanterías y restaurantes",
      "Sugiere paradas alrededor de la hora de almuerzo",
      "Muestra el plato por el que vale la pena ir",
    ],
    defaults: { hours: 4, pace: "sin-preferencia", interests: ["gastronomia"] },
    difficulty_ceiling: "facil",
    service_priority: ["restaurante", "artesania", "guia"],
  },
  {
    id: "tranquilo",
    label: "Sin prisa",
    tagline: "Pocos lugares, bien vistos y sin multitudes.",
    effects: [
      "Evita las horas y los sitios saturados",
      "Menos paradas y más tiempo en cada una",
      "Descarta las actividades exigentes",
    ],
    defaults: { hours: 3, pace: "evitar-multitudes", interests: ["cultura"] },
    difficulty_ceiling: "facil",
    service_priority: ["restaurante", "hospedaje", "artesania"],
  },
];

export function getPersonality(
  id: TravelerPersonality | null,
): PersonalityDefinition | null {
  if (!id) return null;
  return PERSONALITIES.find((p) => p.id === id) ?? null;
}

/**
 * Aplica los valores por defecto de una personalidad SIN pisar lo que el
 * usuario ya eligio a mano.
 *
 * `needs` no se toca nunca (ver la nota de arriba), y los intereses se suman en
 * vez de reemplazarse: si alguien ya marco gastronomia y luego elige
 * "aventurero", sigue interesandole comer.
 */
export function applyPersonality(
  profile: TravelProfile,
  id: TravelerPersonality,
): TravelProfile {
  const def = getPersonality(id);
  if (!def) return profile;

  const touched = profile.completed_at !== null;

  return {
    ...profile,
    personality: id,
    hours: touched ? profile.hours : def.defaults.hours,
    pace: touched ? profile.pace : def.defaults.pace,
    interests: Array.from(
      new Set([...profile.interests, ...def.defaults.interests]),
    ),
  };
}

const DIFFICULTY_ORDER: DifficultyCeiling[] = ["facil", "moderado", "exigente"];

/** true si la actividad entra dentro de lo que la personalidad tolera. */
export function fitsDifficulty(
  personality: TravelerPersonality | null,
  difficulty: string | undefined,
): boolean {
  const def = getPersonality(personality);
  if (!def || !difficulty) return true;

  const ceiling = DIFFICULTY_ORDER.indexOf(def.difficulty_ceiling);
  const level = DIFFICULTY_ORDER.indexOf(difficulty as DifficultyCeiling);
  return level === -1 || level <= ceiling;
}
