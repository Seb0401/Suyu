import { antiCrowdAdvice } from "@/lib/crowd";
import { formatHour, nextQuietHour } from "@/lib/crowdProfile";
import { crowdLabel } from "@/lib/crowdUi";
import { accessibilityScore } from "@/lib/filters";
import { buildItinerary } from "@/lib/itinerary";
import type { SiteWithCrowd, TouristService } from "@/lib/types";

/**
 * Copiloto por reglas (CLAUDE.md §6.6).
 *
 * No imita a Claude ni lo intenta: detecta intencion por palabras clave y
 * compone la respuesta reutilizando buildItinerary() y antiCrowdAdvice(), las
 * mismas funciones que alimentan las pantallas. Una respuesta obviamente
 * mecanica pero correcta es preferible a uno que suene a IA y este inventando.
 */

/** La UI esta obligada a mostrar esto junto a cualquier respuesta de aqui. */
export const OFFLINE_NOTICE =
  "Modo sin conexión — respuestas basadas en reglas, sin IA.";

export type Intent =
  | "saludo"
  | "emergencia"
  | "accesibilidad"
  | "aforo"
  | "itinerario"
  | "servicios"
  | "clima"
  | "eventos"
  | "agradecimiento"
  | "desconocido";

export interface ParsedIntent {
  intent: Intent;
  /** Sitio mencionado por nombre, si lo hay. */
  siteId: string | null;
  /** Horas disponibles si el usuario las dijo ("tengo 3 horas"). */
  availableHours: number | null;
  /** true si menciono silla de ruedas, rampas, bano o descanso. */
  needsAccessible: boolean;
}

const KEYWORDS: Record<Exclude<Intent, "desconocido">, string[]> = {
  saludo: ["hola", "buenas", "buenos dias", "hey", "que tal", "saludos"],
  emergencia: [
    "emergencia",
    "ayuda",
    "socorro",
    "robaron",
    "robo",
    "asalto",
    "accidente",
    "policia",
    "ambulancia",
    "bomberos",
    "hospital",
    "urgencia",
    "me siento mal",
    "paro",
    "bloqueo",
    "huelga",
    "carretera",
    "varado",
    "soroche",
    "mal de altura",
  ],
  accesibilidad: [
    "silla de ruedas",
    "silla",
    "rampa",
    "rampas",
    "accesible",
    "accesibilidad",
    "bano",
    "baño",
    "escalon",
    "escalones",
    "descanso",
    "movilidad",
  ],
  aforo: [
    "lleno",
    "llena",
    "gente",
    "cola",
    "aforo",
    "congestionado",
    "saturado",
    "concurrido",
    "tranquilo",
    "vacio",
    "hora",
  ],
  itinerario: [
    "itinerario",
    "plan",
    "planear",
    "recorrido",
    "ruta del dia",
    "que hago",
    "arma",
    "organiza",
    "horas",
    // "tarde" y "manana" NO van aqui: son demasiado debiles y se llevaban
    // preguntas de otra cosa ("va a llover manana?" caia en itinerario).
    // "arma mi tarde" y "que hago esta tarde" siguen funcionando por "arma" y
    // "que hago", que si son senales de planificacion.
  ],
  servicios: [
    "comer",
    "comida",
    "restaurante",
    "almorzar",
    "guia",
    "agencia",
    "hospedaje",
    "hotel",
    "artesania",
    "souvenir",
    "tour",
  ],
  clima: [
    "clima",
    "tiempo",
    // Las tres raices de "llover" en espanol se escriben distinto (llov-,
    // llue-, lluv-), asi que no basta con una.
    "llov",
    "llue",
    "lluv",
    "frio",
    "calor",
    "temperatura",
    "abrig",
    "sol",
    "paraguas",
    "nublado",
  ],
  eventos: [
    "evento",
    "fiesta",
    "festival",
    "aniversario",
    "feriado",
    "procesion",
    "carnaval",
    "temporada",
    "epoca",
    "cuando ir",
    "cuando viajar",
  ],
  agradecimiento: ["gracias", "genial", "perfecto", "buenisimo", "excelente"],
};

/** Sin tildes y en minusculas: nadie escribe con tildes en un chat de celular. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function findSite(text: string, sites: SiteWithCrowd[]): string | null {
  const normalized = normalize(text);

  // Nombre completo primero: "Museo Santuarios Andinos" antes que "museo".
  const byFullName = sites.find((site) =>
    normalized.includes(normalize(site.name)),
  );
  if (byFullName) return byFullName.id;

  const byWord = sites.find((site) => {
    const words = normalize(site.name)
      .split(" ")
      .filter((w) => w.length > 4 && !["museo", "mirador"].includes(w));
    return words.some((word) => normalized.includes(word));
  });

  return byWord?.id ?? null;
}

function findHours(text: string): number | null {
  const match = normalize(text).match(/(\d+)\s*(hora|horas|h)\b/);
  if (!match) return null;
  const hours = Number(match[1]);
  return hours > 0 && hours <= 12 ? hours : null;
}

export function parseIntent(
  message: string,
  sites: SiteWithCrowd[],
): ParsedIntent {
  const text = normalize(message);
  const hits = (words: string[]) => words.some((w) => text.includes(w));

  // El orden importa: "el itinerario accesible de 3 horas" dispara varias
  // categorias, y la mas especifica gana.
  //
  // La emergencia va PRIMERO de todas. Si alguien escribe "me robaron cerca de
  // Santa Catalina", la palabra del sitio no puede desviar la respuesta a una
  // ficha turistica.
  let intent: Intent = "desconocido";
  if (hits(KEYWORDS.emergencia)) intent = "emergencia";
  // Clima y eventos antes que itinerario: sus palabras son mas especificas
  // ("llover", "aniversario") y no deben perder contra una generica de plan.
  else if (hits(KEYWORDS.clima)) intent = "clima";
  else if (hits(KEYWORDS.eventos)) intent = "eventos";
  else if (hits(KEYWORDS.itinerario)) intent = "itinerario";
  else if (hits(KEYWORDS.aforo)) intent = "aforo";
  else if (hits(KEYWORDS.accesibilidad)) intent = "accesibilidad";
  else if (hits(KEYWORDS.servicios)) intent = "servicios";
  else if (hits(KEYWORDS.agradecimiento)) intent = "agradecimiento";
  else if (hits(KEYWORDS.saludo)) intent = "saludo";

  return {
    intent,
    siteId: findSite(message, sites),
    availableHours: findHours(message),
    needsAccessible: hits(KEYWORDS.accesibilidad),
  };
}

function describeAccessibility(site: SiteWithCrowd): string {
  const tiene: string[] = [];
  const falta: string[] = [];

  (
    [
      [site.wheelchair_accessible, "acceso en silla de ruedas"],
      [site.has_ramps, "rampa"],
      [site.has_accessible_bathroom, "bano accesible"],
      [site.has_rest_areas, "zona de descanso"],
    ] as const
  ).forEach(([ok, label]) => (ok ? tiene : falta).push(label));

  const partes = [`${site.name} — ${accessibilityScore(site)}% accesible.`];
  if (tiene.length > 0) partes.push(`Tiene ${tiene.join(", ")}.`);
  if (falta.length > 0) partes.push(`No confirmado: ${falta.join(", ")}.`);
  if (site.verified_by === null) {
    partes.push("Ten en cuenta que estos datos todavía no están verificados.");
  }

  return partes.join(" ");
}

function answerAccessibility(
  parsed: ParsedIntent,
  sites: SiteWithCrowd[],
): string {
  if (parsed.siteId) {
    const site = sites.find((s) => s.id === parsed.siteId);
    if (site) return describeAccessibility(site);
  }

  const accesibles = sites
    .filter((s) => s.wheelchair_accessible)
    .sort((a, b) => accessibilityScore(b) - accessibilityScore(a));

  if (accesibles.length === 0) {
    return "Ninguno de los sitios del piloto tiene acceso en silla de ruedas confirmado.";
  }

  return [
    "Sitios con acceso en silla de ruedas confirmado:",
    ...accesibles.map((s) => `• ${s.name} (${accessibilityScore(s)}% accesible)`),
  ].join("\n");
}

function answerCrowd(
  parsed: ParsedIntent,
  sites: SiteWithCrowd[],
  hour: number,
): string {
  const site = parsed.siteId
    ? sites.find((s) => s.id === parsed.siteId)
    : undefined;

  if (!site) {
    const tranquilos = sites.filter(
      (s) => !s.crowd_closed && s.crowd_level === "bajo",
    );
    if (tranquilos.length === 0) {
      return "Ahora mismo no hay ningún sitio con poca gente. Pregúntame por uno en particular y te digo a qué hora baja.";
    }
    return [
      `A las ${formatHour(hour)} estos están con poca gente:`,
      ...tranquilos.map((s) => `• ${s.name}`),
    ].join("\n");
  }

  if (site.crowd_closed) {
    const quiet = nextQuietHour(site.crowd_profile, hour);
    return quiet
      ? `${site.name} está cerrado a las ${formatHour(hour)}. Abre con poca gente hacia las ${formatHour(quiet.hour)}.`
      : `${site.name} está cerrado a las ${formatHour(hour)}.`;
  }

  const advice = antiCrowdAdvice(site, sites, hour, {
    accessibleOnly: parsed.needsAccessible,
  });

  const partes = [`${site.name}: ${crowdLabel(site).toLowerCase()}.`];
  if (advice.quiet_hour) {
    partes.push(
      `Baja a ${advice.quiet_hour.occupancy}% hacia las ${formatHour(advice.quiet_hour.hour)}.`,
    );
  }
  if (advice.alternative) {
    partes.push(
      `Si no quieres esperar: ${advice.alternative.site.name}, a ${advice.alternative.walking_min} min a pie.`,
    );
  }

  return partes.join(" ");
}

function answerItinerary(
  parsed: ParsedIntent,
  sites: SiteWithCrowd[],
  hour: number,
): string {
  const hours = parsed.availableHours ?? 4;
  const itinerary = buildItinerary(sites, {
    startHour: hour,
    availableMinutes: hours * 60,
    accessibleOnly: parsed.needsAccessible,
    startSiteId: parsed.siteId ?? undefined,
  });

  if (itinerary.stops.length === 0) {
    return `No puedo preparar un plan de ${hours} h desde las ${formatHour(hour)}: a esa hora los sitios están cerrados o no entran en el tiempo disponible.`;
  }

  const lineas = itinerary.stops.map(
    (stop) =>
      `${stop.arrive_label} — ${stop.site.name} (${stop.visit_minutes} min)` +
      (stop.walkable ? "" : " · requiere transporte"),
  );

  const cierre =
    itinerary.skipped.length > 0
      ? `\nQueda fuera: ${itinerary.skipped.map((s) => s.site.name).join(", ")}.`
      : "";

  const filtro = parsed.needsAccessible ? " Solo sitios accesibles." : "";

  return `Plan de ${hours} h desde las ${formatHour(hour)}.${filtro}\n${lineas.join("\n")}${cierre}`;
}

function answerServices(
  parsed: ParsedIntent,
  services: TouristService[],
  sites: SiteWithCrowd[],
): string {
  const cerca = parsed.siteId
    ? services.filter((s) => s.near_site_id === parsed.siteId)
    : services;

  if (cerca.length === 0) {
    return "Todavía no tengo servicios cargados cerca de ese sitio.";
  }

  const site = sites.find((s) => s.id === parsed.siteId);
  const encabezado = site
    ? `Cerca de ${site.name}:`
    : "Servicios del directorio:";

  return [
    encabezado,
    ...cerca
      .slice(0, 5)
      .map(
        (s) =>
          `• ${s.name} (${s.category})` +
          (s.formalized ? "" : " · registro por verificar"),
      ),
  ].join("\n");
}

/**
 * Respuesta de emergencia.
 *
 * Los numeros van PRIMERO y textuales. Aunque no haya red y aunque el modelo
 * no este disponible, esto tiene que salir bien: es la unica pregunta del chat
 * donde equivocarse tiene consecuencias fuera de la app.
 */
function answerEmergency(text: string): string {
  const t = normalize(text);
  const roadTrouble = ["paro", "bloqueo", "huelga", "carretera", "varado"].some(
    (w) => t.includes(w),
  );
  const altitude = ["soroche", "mal de altura", "altura"].some((w) => t.includes(w));

  if (roadTrouble) {
    return [
      "No tengo el estado de las vías en tiempo real, así que no puedo decirte si la carretera está libre.",
      "Confirma con iPerú (01 5748000, 24 h) o con tu hotel antes de salir.",
      "Si ya estás varado, la Defensoría del Pueblo suele gestionar el paso, y en bloqueos largos la Policía ha dispuesto buses de vuelta al aeropuerto.",
    ].join(" ");
  }

  if (altitude) {
    return [
      "Si hay dolor de cabeza fuerte, vómitos o confusión, lo único que resuelve es bajar de altura.",
      "Ante síntomas severos llama al 106 (SAMU).",
      "El mate de coca ayuda con el malestar leve, pero no reemplaza aclimatarse.",
    ].join(" ");
  }

  return [
    "Emergencia: 105 Policía · 106 ambulancia (SAMU) · 116 Bomberos.",
    "Si es un problema de turista (robo de documentos, estafa de una agencia), la Policía de Turismo de Arequipa atiende al 054 201258.",
    "iPerú da asistencia 24 h al 01 5748000.",
  ].join(" ");
}

function answerWeather(): string {
  return [
    "No puedo consultar el pronóstico sin conexión.",
    "Como referencia: Arequipa es de las ciudades más secas del mundo habitado, con sol casi todo el año y noches frías.",
    "La única temporada de lluvias va de enero a marzo, y llueve sobre todo por la tarde.",
    "El sillar mojado resbala, así que en esos meses los recorridos en silla de ruedas se complican.",
  ].join(" ");
}

function answerEvents(): string {
  return [
    "Las fechas que más cambian un viaje a Arequipa: el Aniversario de la ciudad del 6 al 18 de agosto, con el 15 como día central; la Virgen de Chapi del 1 al 15 de mayo; y Semana Santa, que es de fecha móvil.",
    "En esas fechas los hoteles se agotan y el centro tiene calles cerradas.",
    "Ojo también: Juanita, la momia del Museo Santuarios Andinos, no se exhibe de enero a abril.",
  ].join(" ");
}

export interface OfflineAnswer {
  reply: string;
  notice: string;
  intent: Intent;
}

export function answerOffline(
  message: string,
  sites: SiteWithCrowd[],
  services: TouristService[],
  hour: number,
): OfflineAnswer {
  const parsed = parseIntent(message, sites);

  const reply = (() => {
    switch (parsed.intent) {
      case "emergencia":
        return answerEmergency(message);
      case "clima":
        return answerWeather();
      case "eventos":
        return answerEvents();
      case "saludo":
        return "Hola. Puedo decirte qué tan accesible es cada sitio, cuándo hay menos gente, prepararte un plan para el día y darte los teléfonos de emergencia. Pregúntame por un lugar o dime cuántas horas tienes.";
      case "agradecimiento":
        return "Con gusto. Si quieres, preparo el resto del día.";
      case "accesibilidad":
        return answerAccessibility(parsed, sites);
      case "aforo":
        return answerCrowd(parsed, sites, hour);
      case "itinerario":
        return answerItinerary(parsed, sites, hour);
      case "servicios":
        return answerServices(parsed, services, sites);
      default:
        // Sin intencion clara no se adivina: se dice que se sabe hacer.
        return "No entendí bien. Puedo ayudarte con tres cosas: la accesibilidad de un sitio, a qué hora hay menos gente y preparar un itinerario. Por ejemplo: 'tengo 3 horas y necesito rampas'.";
    }
  })();

  return { reply, notice: OFFLINE_NOTICE, intent: parsed.intent };
}
