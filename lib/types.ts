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

/**
 * Estado de un servicio de accesibilidad, no si existe.
 * 1 = deficiente, 2 = utilizable con apoyo, 3 = en buen estado.
 *
 * Convive con los booleanos `has_*` de Site en vez de reemplazarlos: el
 * booleano dice si el rasgo EXISTE y la nota dice COMO esta. Una rampa que
 * existe pero solo es movil y bajo solicitud es `has_ramps: true` + rating 2.
 */
export type AccessibilityRating = 1 | 2 | 3;

export interface AccessibilityGrade {
  /** null = no hay dato suficiente para calificar. Nunca se asume un 2. */
  rating: AccessibilityRating | null;
  /** Justificacion en lenguaje de usuario. La UI la muestra tal cual. */
  note: string;
}

/** Politica de mascotas del sitio. NO aplica a perros guia (ver §6.11). */
export type PetPolicy = "permitidas" | "no-permitidas" | "sin-dato";

export interface SiteAccessibilityDetail {
  site_id: string;
  ramps: AccessibilityGrade;
  accessible_bathroom: AccessibilityGrade;
  rest_areas: AccessibilityGrade;
  wheelchair_circulation: AccessibilityGrade;
  /**
   * Baño familiar o cambiador para bebes. Es un servicio DISTINTO del baño
   * adaptado para personas con discapacidad: mezclarlos haria que un padre y
   * un usuario de silla de ruedas lean la misma etiqueta esperando cosas
   * distintas. null = sin dato.
   */
  has_family_bathroom: boolean | null;
  family_bathroom_note: string;
  pet_policy: PetPolicy;
  pet_note: string;
  source_label: string;
  source_url: string | null;
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
