import { NextResponse } from "next/server";
import { askClaude, buildSystemPrompt } from "@/lib/anthropic";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import { answerOffline } from "@/lib/offlineAssistant";
import { getServices } from "@/lib/services";
import { getSites } from "@/lib/sites";
import type { ChatMessage } from "@/lib/types";

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

function parseHistory(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;

  const history: ChatMessage[] = [];
  for (const raw of input.slice(-MAX_HISTORY)) {
    const msg = raw as Record<string, unknown>;
    if (msg?.role !== "user" && msg?.role !== "assistant") return null;
    if (typeof msg.content !== "string" || !msg.content.trim()) return null;
    history.push({
      role: msg.role,
      content: msg.content.trim().slice(0, MAX_MESSAGE_CHARS),
    });
  }

  if (history.length === 0) return null;
  if (history[0].role !== "user") return null;

  return history;
}

/**
 * POST /api/chat
 *
 * Body: { messages: ChatMessage[], hour?: number }
 * Respuesta: { reply, source: "claude" | "offline", notice? }
 *
 * `source` no es telemetria: la UI esta OBLIGADA a mostrarlo cuando vale
 * "offline". Falsear salida de IA frente a un jurado destruye el pitch (§2.1).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const { messages, hour: rawHour } = (body ?? {}) as Record<string, unknown>;
  const history = parseHistory(messages);

  if (!history) {
    return NextResponse.json(
      { error: "Se espera messages: [{ role, content }] empezando por user." },
      { status: 400 },
    );
  }

  const hour = normalizeHour(rawHour) ?? currentHourInArequipa();
  const [{ sites }, { services }] = await Promise.all([
    getSites(hour),
    getServices(),
  ]);

  const result = await askClaude(
    buildSystemPrompt(sites, services, hour),
    history,
  );

  if (result.ok) {
    return NextResponse.json({ reply: result.reply, source: "claude" });
  }

  // Sin Claude respondemos igual, pero por reglas y diciendolo. Devolvemos 200
  // porque la respuesta es valida: no es un error que la UI deba tratar como
  // caida, es otro modo de funcionamiento (§2.1).
  const lastUserMessage =
    [...history].reverse().find((m) => m.role === "user")?.content ?? "";

  const offline = answerOffline(lastUserMessage, sites, services, hour);

  return NextResponse.json({
    reply: offline.reply,
    source: "offline",
    notice: offline.notice,
    reason: result.reason,
    intent: offline.intent,
  });
}
