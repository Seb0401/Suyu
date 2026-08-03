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

/**
 * Pasaporte Arequipeño (§6.x). Una estampa por sitio, ganada solo tras pasar
 * una geocerca GPS server-side — es permanente, no se edita ni se borra.
 */
export interface PassportStamp {
  id: string;
  site_id: string;
  site_name: string;
  accessibility_rating: number;
  review: string;
  photo_url: string | null;
  created_at: string;
}

export type PassportTier = "descubridor" | "explorador" | "conocedor" | "maestro";

export interface PassportSummary {
  stamps: PassportStamp[];
  tier: PassportTier;
  tier_label: string;
  stamps_count: number;
  total_sites: number;
  /** null cuando ya se alcanzo el nivel maximo. */
  next_tier_at: number | null;
  benefit: string;
  /** Siempre true por ahora: el beneficio se muestra pero no es canjeable (§2.1). */
  benefit_is_simulated: boolean;
}
