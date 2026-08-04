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
  /**
   * Gradas y escalones. Es la dimension INVERSA a las demas: aqui un 3 no
   * significa "escaleras en buen estado" sino "pocas gradas o ninguna, y las
   * que hay son bajas". Se califica el OBSTACULO, no el servicio, porque eso
   * es lo que decide si alguien puede entrar.
   */
  steps: AccessibilityGrade;
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
  /**
   * Altitud en metros. No es un dato turistico de adorno: Arequipa esta a
   * ~2 300 m y el Colca pasa de 3 200 m, y esa diferencia es lo unico que
   * permite avisarle a alguien con condicion cardiaca o respiratoria ANTES de
   * que se suba a un bus de cuatro horas. null = sin dato.
   */
  altitude_m: number | null;
  /** Precision del dato de altitud, incluida la discrepancia entre fuentes. */
  altitude_note: string;
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
  /**
   * Que es el lugar, en una frase. Va ANTES que la historia: el turista que
   * llega a la ficha muchas veces no sabe todavia de que se trata, y arrancar
   * con "fundado en 1579 por dona Maria de Guzman" responde una pregunta que
   * todavia no se hizo.
   */
  what_is: string;
  /** Por que vale la pena ir. Es el argumento, no la descripcion. */
  why_visit: string;
  /** Lo concreto que hay que ver o hacer estando ahi. */
  highlights: string[];
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

/** Linea de emergencia o de asistencia (Fase 2). */
export interface EmergencyLine {
  id: string;
  name: string;
  phone: string;
  when: string;
  scope: "nacional" | "arequipa";
  /** 1 = emergencia real, 2 = asistencia al turista, 3 = oficina presencial. */
  priority: 1 | 2 | 3;
}

/**
 * Suceso imprevisto con guia de que hacer.
 *
 * No hay feed en vivo de paros ni bloqueos, y no lo inventamos: esto es
 * contenido curado que explica el escenario y a quien llamar. Fingir un
 * "estado de las vias en tiempo real" seria el peor dato falso posible, porque
 * alguien decidiria si salir a la carretera con el.
 */
export interface Contingency {
  id: string;
  title: string;
  summary: string;
  what_to_do: string[];
  /** Como golpea a quien tiene movilidad reducida. Es la tesis del proyecto. */
  accessibility_note: string;
  severity: "alta" | "media";
}

export type Currency = "PEN" | "USD";

/** Un costo que el precio publicado NO cubre. */
export interface ExtraCost {
  label: string;
  amount: number;
  currency: Currency;
  /** De donde salio el monto. Nunca un numero sin procedencia. */
  source: string;
  /** true si practicamente nadie puede evitarlo (una entrada obligatoria). */
  unavoidable: boolean;
}

/**
 * Plan turistico comparable (§6.11).
 *
 * El objetivo NO es rankear agencias por precio: es que el turista vea que el
 * precio publicado casi nunca es lo que termina pagando. En el Colca el boleto
 * turistico son S/ 70 que ninguna agencia incluye, y eso pesa mas que la
 * diferencia entre operadores.
 */
export interface TourPlan {
  id: string;
  /** Agencia que lo vende. null = precio de referencia del mercado. */
  agency_id: string | null;
  agency_name: string;
  name: string;
  /** Clave para agrupar planes comparables entre si. */
  destination: string;
  duration_label: string;
  duration_hours: number;
  /** Precio "desde" publicado. null si no se pudo confirmar. */
  price_from: number | null;
  currency: Currency;
  /** Fecha de consulta. Un precio sin fecha envejece mal y se lee como garantia. */
  price_checked_at: string | null;
  price_source: string;
  includes: string[];
  /** Lo que el precio NO cubre, con monto. Es la parte util de la comparacion. */
  extras: ExtraCost[];
  /** El angulo de Suyu: se puede hacer con movilidad reducida? */
  accessibility_note: string;
  wheelchair_viable: boolean | null;
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
