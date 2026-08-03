"use client";

import { useEffect, useRef, useState } from "react";
import Mascot, { type MascotState } from "@/components/Mascot";
import { OfflineIcon, SendIcon } from "@/components/Icons";
import { useSites } from "@/components/useSites";
import { OFFLINE_NOTICE, answerOffline } from "@/lib/offlineAssistant";
import type { ChatMessage, TouristService } from "@/lib/types";

type Turn = ChatMessage & { notice?: string; mascot?: MascotState };

/**
 * Elige la pose de la mascota segun lo que pregunto el usuario. Es presentacion
 * pura: no toca la logica de la respuesta, que sigue saliendo de /api/chat o
 * del motor de reglas (§6.6).
 */
function pickMascotState(text: string): MascotState {
  const t = text.toLowerCase();
  if (/\b(hola|buenas|buenos dias|hey|que tal)\b/.test(t)) return "wave";
  if (/\b(gracias|genial|perfecto|excelente)\b/.test(t)) return "cheer";
  if (/(ruta|mapa|llegar|camino|ir de|hasta)/.test(t)) return "map";
  if (/(busca|buscar|donde|lleno|gente|aforo|congestion)/.test(t)) return "search";
  return "chat";
}

const SUGGESTIONS = [
  "¿Qué lugares son accesibles en silla de ruedas?",
  "Tengo 3 horas, ¿qué me recomiendas?",
  "¿Dónde hay menos gente ahora?",
  "¿Hay baños accesibles cerca de la Plaza de Armas?",
];

export default function ChatWidget() {
  const { sites } = useSites();
  const [services, setServices] = useState<TouristService[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    const history: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(history);
    setDraft("");
    setSending(true);

    const mascot = pickMascotState(message);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          hour: new Date().getHours(),
        }),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          // El aviso no es opcional: si la respuesta no vino de Claude, la UI
          // esta obligada a decirlo (§2.1).
          notice: data.source === "offline" ? (data.notice ?? OFFLINE_NOTICE) : undefined,
          mascot,
        },
      ]);
    } catch {
      /* Sin red el endpoint no responde, asi que el motor de reglas corre aqui
         mismo en el cliente. Nunca se inventa una respuesta "de IA". */
      const local = answerOffline(message, sites, services, new Date().getHours());
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: local.reply, notice: local.notice, mascot },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <header className="flex items-center gap-3 rounded-3xl bg-night-800 p-4 text-cream">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-night-700">
          <Mascot size={38} state={online ? "chat" : "confused"} />
        </span>
        <div className="flex-1">
          <p className="font-extrabold">Suyu IA</p>
          <p className="text-xs opacity-80">Tu copiloto de viaje</p>
        </div>
        {!online ? (
          <span className="flex items-center gap-1.5 rounded-full bg-night-900 px-2.5 py-1 text-[11px] font-bold">
            <OfflineIcon size={14} />
            Sin conexión
          </span>
        ) : null}
      </header>

      <div
        aria-live="polite"
        aria-label="Conversación con el copiloto"
        className="flex flex-1 flex-col gap-3 py-4"
      >
        {turns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-6 text-center">
            <Mascot size={80} state="wave" />
            <p className="font-bold text-ink">¿En qué te ayudo?</p>
            <p className="text-sm text-ink-soft">
              Pregúntame por accesibilidad, aforo o pídeme un plan para tu día.
            </p>
          </div>
        ) : null}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <p
              key={i}
              className="ml-auto max-w-[85%] whitespace-pre-line rounded-3xl rounded-br-lg bg-night-800 px-4 py-2.5 text-sm text-cream"
            >
              {turn.content}
            </p>
          ) : (
            <div key={i} className="flex max-w-[92%] items-start gap-2">
              <Mascot size={32} state={turn.mascot ?? "chat"} className="mt-1 shrink-0" />
              <div className="rounded-3xl rounded-bl-lg border border-sand-200 bg-sand-50 px-4 py-2.5">
                <p className="whitespace-pre-line text-sm text-ink">{turn.content}</p>
                {turn.notice ? (
                  <p className="mt-2 flex items-center gap-1.5 border-t border-sand-200 pt-2 text-[11px] font-bold text-[var(--color-amber-text)]">
                    <OfflineIcon size={13} />
                    {turn.notice}
                  </p>
                ) : null}
              </div>
            </div>
          ),
        )}

        {sending ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Mascot size={32} state="search" />
            Escribiendo…
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {turns.length === 0 ? (
        <ul className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs font-semibold text-ink-soft"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="sticky bottom-0 flex items-center gap-2 rounded-full border border-sand-200 bg-sand-50 p-1.5 pl-4"
      >
        <label htmlFor="mensaje" className="sr-only">
          Escribe tu mensaje
        </label>
        <input
          id="mensaje"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe tu mensaje…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Enviar mensaje"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-night-800 text-cream disabled:opacity-40"
        >
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  );
}
