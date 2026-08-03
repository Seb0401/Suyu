"use client";

/**
 * Taxonomia de necesidades de accesibilidad.
 *
 * Tres niveles, y la division NO es tecnica sino de dignidad:
 *
 * - "movilidad": lo que el onboarding pregunta a todo el mundo. Son rasgos del
 *   LUGAR ("necesito rampa"), no diagnosticos de la persona.
 * - "compania": familia y mascotas. Tambien va en el onboarding porque nadie
 *   se siente interrogado al decir que viaja con un perro.
 * - "sensible": lo que NO se pregunta de entrada. Preguntarle a cada turista
 *   que abre la app si es sordo, si tiene una condicion cardiaca o si necesita
 *   apoyo cognitivo convierte un onboarding en un formulario medico. Estas
 *   quedan detras de una opcion explicita en Perfil, que el usuario abre si
 *   quiere y cuando quiere.
 *
 * Ninguna de estas respuestas sale del dispositivo: viven en el mismo
 * localStorage que el resto del perfil (§2.1).
 */

export type NeedTier = "movilidad" | "compania" | "sensible";

export type AccessNeedId =
  // movilidad
  | "wheelchair_accessible"
  | "has_ramps"
  | "has_accessible_bathroom"
  | "has_rest_areas"
  | "avoid_steps"
  | "avoid_steep_slopes"
  // compania
  | "family_bathroom"
  | "travels_with_pet"
  | "guide_dog"
  // sensible
  | "low_vision"
  | "deaf_or_hoh"
  | "sensory_sensitivity"
  | "cardiac_or_respiratory"
  | "cognitive_support";

export interface AccessNeedDefinition {
  id: AccessNeedId;
  tier: NeedTier;
  label: string;
  /** Que hace la app con esto. Se muestra: el usuario merece saber por que se le pregunta. */
  effect: string;
  /**
   * true si el dato existe hoy en los sitios. Cuando es false, la app lo
   * registra y lo usa para AVISAR que no tenemos el dato, en vez de fingir que
   * puede filtrar por el.
   */
  has_data: boolean;
}

export const ACCESS_NEEDS: AccessNeedDefinition[] = [
  // --- movilidad ---------------------------------------------------------
  {
    id: "wheelchair_accessible",
    tier: "movilidad",
    label: "Uso silla de ruedas",
    effect: "Filtra los lugares sin acceso confirmado y avisa antes de cada ruta.",
    has_data: true,
  },
  {
    id: "has_ramps",
    tier: "movilidad",
    label: "Necesito rampa",
    effect: "Muestra el estado real de la rampa, no solo si existe.",
    has_data: true,
  },
  {
    id: "has_accessible_bathroom",
    tier: "movilidad",
    label: "Necesito baño accesible",
    effect: "Avisa cuando un baño se declara adaptado pero no cumple (pasa en dos de nuestros seis sitios).",
    has_data: true,
  },
  {
    id: "has_rest_areas",
    tier: "movilidad",
    label: "Necesito sitios donde sentarme",
    effect: "Prioriza lugares con zonas de descanso y acorta los tramos del itinerario.",
    has_data: true,
  },
  {
    id: "avoid_steps",
    tier: "movilidad",
    label: "No puedo con escaleras",
    effect: "Usa la calificación de escalones de cada sitio y marca los que no tienen alternativa.",
    has_data: true,
  },
  {
    id: "avoid_steep_slopes",
    tier: "movilidad",
    label: "Las pendientes me cuestan",
    effect: "Avisa en los sitios cuyo acceso tiene pendiente pronunciada, como Yanahuara.",
    has_data: true,
  },

  // --- compania ----------------------------------------------------------
  {
    id: "family_bathroom",
    tier: "compania",
    label: "Necesito baño familiar o cambiador",
    effect: "Marca los lugares que lo tienen confirmado.",
    has_data: true,
  },
  {
    id: "travels_with_pet",
    tier: "compania",
    label: "Viajo con mi mascota",
    effect: "Muestra la política de mascotas de cada lugar y de los servicios.",
    has_data: true,
  },
  {
    id: "guide_dog",
    tier: "compania",
    label: "Viajo con perro guía",
    effect:
      "Recuerda que la Ley 29830 garantiza el acceso aunque el lugar no admita mascotas.",
    has_data: true,
  },

  // --- sensible ----------------------------------------------------------
  {
    id: "low_vision",
    tier: "sensible",
    label: "Baja visión o ceguera",
    effect:
      "Señala qué sitios tienen señalización contrastada o audioguía, y cuáles no lo declaran.",
    has_data: true,
  },
  {
    id: "deaf_or_hoh",
    tier: "sensible",
    label: "Sordera o hipoacusia",
    effect:
      "Avisa si el personal maneja lengua de señas o si hay material subtitulado. Hoy casi ningún sitio lo declara, y eso también es información.",
    has_data: true,
  },
  {
    id: "sensory_sensitivity",
    tier: "sensible",
    label: "Sensibilidad sensorial",
    effect:
      "Da más peso a evitar las horas saturadas y avisa de los eventos con multitud, ruido y fuegos artificiales.",
    has_data: true,
  },
  {
    id: "cardiac_or_respiratory",
    tier: "sensible",
    label: "Condición cardíaca o respiratoria",
    effect:
      "Avisa antes de recomendar el Colca o un volcán: Arequipa está a 2 300 m y el Colca pasa de 3 200 m.",
    has_data: true,
  },
  {
    id: "cognitive_support",
    tier: "sensible",
    label: "Necesito apoyo cognitivo",
    effect:
      "Prefiere itinerarios cortos, con menos traslados y rutas más simples.",
    has_data: false,
  },
];

export const NEEDS_BY_TIER: Record<NeedTier, AccessNeedDefinition[]> = {
  movilidad: ACCESS_NEEDS.filter((n) => n.tier === "movilidad"),
  compania: ACCESS_NEEDS.filter((n) => n.tier === "compania"),
  sensible: ACCESS_NEEDS.filter((n) => n.tier === "sensible"),
};

export const TIER_LABEL: Record<NeedTier, string> = {
  movilidad: "Movilidad",
  compania: "Familia y mascotas",
  sensible: "Otras necesidades",
};

export const SENSITIVE_INTRO =
  "No preguntamos esto de entrada porque no es asunto nuestro salvo que tú quieras que lo sea. Si activas alguna, la app adapta los avisos. Todo se guarda solo en este dispositivo.";

export function getNeed(id: AccessNeedId): AccessNeedDefinition | undefined {
  return ACCESS_NEEDS.find((n) => n.id === id);
}
