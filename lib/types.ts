/**
 * CONTRATO COMPARTIDO — CLAUDE.md §2.2, §6.1
 *
 * Cambiar la forma de cualquier tipo de aqui es un cambio de contrato: se avisa
 * al equipo antes de commitear. Las pantallas consumen /api/*, nunca data/ ni
 * Supabase directamente.
 */

export type CrowdLevel = "bajo" | "medio" | "alto";
export type VerifiedBy = "equipo" | "usuario";

export interface Site {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  wheelchair_accessible: boolean;
  has_ramps: boolean;
  has_accessible_bathroom: boolean;
  has_rest_areas: boolean;
  notes: string;
  /** Procedencia del dato. null = sin verificar, la UI debe decirlo. */
  verified_by: VerifiedBy | null;
  verified_at: string | null;
  /** 24 valores 0-100, indice 0 = 00:00. Un 0 significa CERRADO, no "vacio". */
  crowd_profile: number[];
}

export interface SiteWithCrowd extends Site {
  crowd_level: CrowdLevel | null;
  /** true si viene de un reporte manual, no del perfil horario. */
  crowd_is_live: boolean;
  /** Ocupacion 0 = cerrado, NO "poca gente" (§6.3). */
  crowd_closed: boolean;
}

export type ServiceCategory =
  | "restaurante"
  | "guia"
  | "agencia"
  | "transporte"
  | "hospedaje"
  | "artesania"
  | "movilidad"
  | "salud"
  | "actividad";

export type ActivityDifficulty = "facil" | "moderado" | "exigente";

/**
 * Campos que solo aplican a algunas categorias. Todos opcionales: una entrada
 * llena unicamente lo que le corresponde.
 *
 * Es una bolsa de opcionales en vez de una union discriminada a proposito. La
 * union obligaria a la UI a hacer narrowing por categoria en cada punto donde
 * quiere mostrar un telefono, y el 90% de los campos que la UI toca son
 * comunes. Si algun dia un campo se vuelve obligatorio por categoria, ahi si
 * vale la pena separar.
 */
export interface ServiceDetails {
  /** Telefono de contacto. Aplica a cualquier categoria. */
  phone?: string;

  /** hospedaje: estrellas DECLARADAS por el establecimiento. Ver §6.7. */
  stars?: number;

  /** restaurante: tipo de cocina ("picanteria arequipena", "fusion"). */
  cuisine?: string;
  /** restaurante: plato por el que vale la pena ir. */
  signature_dish?: string;

  /** transporte: a donde llega. */
  destinations?: string[];
  /** transporte: horario o frecuencia, en texto libre. */
  schedule?: string;
  /** transporte: precio de referencia con su fecha, nunca un precio "actual". */
  reference_fare?: string;

  /** actividad: que se hace ("canotaje", "escalada", "trekking"). */
  activity?: string;
  difficulty?: ActivityDifficulty;
  duration_hours?: number;
  /** actividad: temporada recomendada. */
  best_months?: string;
  /** actividad: requisitos reales (edad minima, saber nadar, aclimatacion). */
  requirements?: string;
}

export interface TouristService {
  id: string;
  name: string;
  provider: string;
  category: ServiceCategory;
  near_site_id: string;
  lat: number;
  lng: number;
  wheelchair_accessible: boolean;
  /** Registrado formalmente. Si no esta confirmado: false + registry_id null. */
  formalized: boolean;
  registry_id: string | null;
  url: string | null;
  price_range: "$" | "$$" | "$$$" | null;
  notes: string;
  details?: ServiceDetails;
}

export interface AccessibilityReport {
  id: string;
  site_id: string;
  site_name: string;
  issue: string;
  detail: string;
  created_at: string;
}

export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Ficha tecnica curada de un sitio (§6.8). */
export interface SiteDetail {
  site_id: string;
  history: string;
  curiosity: string;
  best_time: string;
  recommended_visit_minutes: number;
}

/** Historia de viajero curada por el equipo, sin backend de usuarios (§6.9). */
export interface Story {
  id: string;
  site_id: string;
  site_name: string;
  author_name: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
}

/** Agencia de turismo real ya operando en Arequipa, no un afiliado (§6.10). */
export interface PartnerAgency {
  id: string;
  name: string;
  summary: string;
  sample_tours: string[];
  address: string | null;
  phone: string | null;
  url: string;
  reviews_note: string;
  reviews_source: "agencia" | "resenas" | "premio" | null;
  formalized: boolean;
  registry_id: string | null;
}
