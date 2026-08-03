import { getAccessibilityDetail } from "@/lib/accessibility";
import { bestHour, formatHour, nextQuietHour } from "@/lib/crowdProfile";
import { crowdLabel } from "@/lib/crowdUi";
import { accessibilityScore } from "@/lib/filters";
import type { ChatMessage, SiteWithCrowd, TouristService } from "@/lib/types";

/**
 * Llamada directa a la API de Anthropic (CLAUDE.md §3, §6.6).
 *
 * Sin SDK a proposito: es una sola llamada a un endpoint, y cargar
 * @anthropic-ai/sdk por eso engorda el bundle sin darnos nada. Si el copiloto
 * creciera a tool use o streaming, el SDK pasa a valer la pena.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

/** El copiloto responde en un chat: importa mas la latencia que la profundidad. */
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 20000;

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Resumen de un sitio para el system prompt.
 *
 * NUNCA se pasan las 24 cifras crudas del perfil horario: son ~150 tokens por
 * sitio de ruido que el modelo no necesita para responder "esta lleno, anda a
 * las 17:00". Se le da la conclusion ya calculada.
 */
function summarizeSite(site: SiteWithCrowd, hour: number): string {
  const rasgos = [
    site.wheelchair_accessible ? "silla de ruedas" : null,
    site.has_ramps ? "rampa" : null,
    site.has_accessible_bathroom ? "bano accesible" : null,
    site.has_rest_areas ? "zona de descanso" : null,
  ].filter(Boolean);

  const quiet = nextQuietHour(site.crowd_profile, hour);
  const best = bestHour(site.crowd_profile);

  /* Del estado 1-3 solo se manda el rasgo PEOR calificado. Mandar las cuatro
     notas de los seis sitios infla el prompt sin cambiar la respuesta, y lo
     accionable es justo el punto debil: "hay bano adaptado pero no sirve". */
  const detail = getAccessibilityDetail(site.id);
  const peor = detail
    ? (
        [
          ["rampa", detail.ramps],
          ["bano adaptado", detail.accessible_bathroom],
          ["zona de descanso", detail.rest_areas],
          ["circulacion en silla de ruedas", detail.wheelchair_circulation],
        ] as const
      )
        .filter(([, g]) => g.rating !== null)
        .sort((a, b) => (a[1].rating as number) - (b[1].rating as number))[0]
    : undefined;

  const partes = [
    `- ${site.name} (${site.category}, ${accessibilityScore(site)}% accesible)`,
    `  Ahora: ${crowdLabel(site)}.`,
    rasgos.length > 0
      ? `  Tiene: ${rasgos.join(", ")}.`
      : "  Sin rasgos de accesibilidad confirmados.",
    peor && (peor[1].rating as number) <= 2
      ? `  Punto debil: ${peor[0]} en estado ${peor[1].rating}/3. ${peor[1].note}`
      : null,
    quiet ? `  Baja la gente a las ${formatHour(quiet.hour)}.` : null,
    !quiet && best ? `  Mejor hora del dia: ${formatHour(best.hour)}.` : null,
    site.verified_by === null ? "  Datos SIN verificar." : null,
  ].filter(Boolean);

  return partes.join("\n");
}

function summarizeService(service: TouristService): string {
  const registro = service.formalized
    ? `registro ${service.registry_id}`
    : "registro por verificar";
  return `- ${service.name} (${service.category}, ${registro})`;
}

/** Idiomas en que el copiloto puede responder. Espejo de components/i18n. */
const LANGUAGE_RULE: Record<string, string> = {
  es: "Responde en espanol.",
  en: "Reply in English, even though this prompt is written in Spanish.",
  fr: "Reponds en francais, meme si ce prompt est ecrit en espagnol.",
  pt: "Responda em portugues, embora este prompt esteja escrito em espanhol.",
};

export function buildSystemPrompt(
  sites: SiteWithCrowd[],
  services: TouristService[],
  hour: number,
  locale = "es",
): string {
  return [
    "Eres Suyu, un companero de viaje para turistas en Arequipa, Peru.",
    "Tu prioridad es la accesibilidad: rutas sin escalones, con rampa, bano accesible y zonas de descanso.",
    "",
    `Hora local actual: ${formatHour(hour)}.`,
    "",
    "SITIOS DISPONIBLES (son los unicos que conoces):",
    sites.map((site) => summarizeSite(site, hour)).join("\n"),
    "",
    "SERVICIOS CERCANOS:",
    services.map(summarizeService).join("\n"),
    "",
    "REGLAS:",
    `1. IDIOMA: ${LANGUAGE_RULE[locale] ?? LANGUAGE_RULE.es} Responde en 3 a 5 frases. Es un chat en un celular, no un informe.`,
    "1b. ESTILO: lenguaje neutro y llano, con la ortografia y los acentos correctos del idioma en que respondas. Sin jerga, sin modismos regionales ('chevere', 'anda a', 'de una') y sin diminutivos. Frases cortas y directas. Quien lee puede no ser hablante nativo y puede estar usando un lector de pantalla.",
    "1c. Los NOMBRES de los lugares (Monasterio de Santa Catalina, Mirador de Yanahuara, Plaza de Armas) se dejan SIEMPRE en espanol, aunque respondas en otro idioma: son los nombres con los que el turista va a preguntar en la calle y por los que estan senalizados.",
    "2. Usa SOLO los sitios y servicios de arriba. Si te preguntan por otro lugar, dilo con honestidad en vez de inventarlo.",
    "3. Si un sitio esta muy congestionado, ofrece la alternativa Y la hora en que baja la gente. Las dos cosas.",
    "4. Si un sitio no tiene un rasgo de accesibilidad confirmado, di 'sin confirmar'. Nunca lo des por hecho.",
    "5. Si los datos de un sitio estan SIN verificar, avisalo antes de recomendarlo.",
    "6. El aforo es una estimacion por franja horaria, no una medicion en vivo. Si te preguntan, dilo.",
    "7. No inventes precios, horarios exactos, telefonos ni numeros de registro.",
  ].join("\n");
}

export type AnthropicResult =
  | { ok: true; reply: string }
  | { ok: false; reason: "sin_key" | "sin_red" | "error_api" | "rechazado" };

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  stop_reason?: string;
}

/**
 * Devuelve el texto del modelo, o un motivo de fallo para que /api/chat caiga
 * al motor de reglas. Nunca lanza y nunca inventa una respuesta: si Claude no
 * contesto, quien llama tiene que decirlo en pantalla (§2.1).
 */
export async function askClaude(
  systemPrompt: string,
  history: ChatMessage[],
): Promise<AnthropicResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "sin_key" };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        // El chat necesita responder rapido; el razonamiento profundo no aporta
        // aqui y si agrega segundos de espera frente al jurado.
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return { ok: false, reason: "error_api" };

    const data = (await response.json()) as AnthropicResponse;

    // Los clasificadores pueden declinar con HTTP 200. Hay que revisarlo antes
    // de leer content, que en ese caso viene vacio.
    if (data.stop_reason === "refusal") {
      return { ok: false, reason: "rechazado" };
    }

    const reply = (data.content ?? [])
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!reply) return { ok: false, reason: "error_api" };

    return { ok: true, reply };
  } catch {
    // Timeout, DNS, key vencida, cuota agotada: todos terminan en el fallback.
    return { ok: false, reason: "sin_red" };
  }
}
