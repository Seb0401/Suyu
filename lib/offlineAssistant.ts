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
  | "accesibilidad"
  | "aforo"
  | "itinerario"
  | "servicios"
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
    "tarde",
    "manana",
    "horas",
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
  let intent: Intent = "desconocido";
  if (hits(KEYWORDS.itinerario)) intent = "itinerario";
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
      case "saludo":
        return "Hola. Puedo decirte qué tan accesible es cada sitio, cuándo hay menos gente y prepararte un plan para el día. Pregúntame por un lugar o dime cuántas horas tienes.";
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
