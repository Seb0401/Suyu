"use client";

import { useEffect, useRef, useState } from "react";
import Mascot, { type MascotState } from "@/components/Mascot";
import { OfflineIcon, SendIcon } from "@/components/Icons";
import { useSites } from "@/components/useSites";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { OFFLINE_NOTICE, answerOffline } from "@/lib/offlineAssistant";
import type { ChatMessage, TouristService } from "@/lib/types";

type Turn = ChatMessage & { notice?: string; mascot?: MascotState };

/**
 * Elige la pose de la mascota segun LO QUE RESPONDIO el copiloto, no segun lo
 * que se le pregunto. Es lo correcto: si alguien pregunta por un itinerario y
 * la respuesta es "no puedo armarlo a esa hora", la cara tiene que acompañar la
 * respuesta, no la expectativa.
 *
 * Presentacion pura: no toca de donde sale la respuesta (§6.6).
 */
/**
 * Aviso de que la respuesta llega en espanol aunque la app este en otro idioma.
 * Va en el idioma del usuario: un aviso sobre no entender el espanol seria
 * inutil escrito en espanol.
 */
const SPANISH_ONLY_NOTICE: Record<string, string> = {
  en: "Without an AI connection this answer is only available in Spanish.",
  fr: "Sans connexion a l'IA, cette reponse n'est disponible qu'en espagnol.",
  pt: "Sem conexao com a IA, esta resposta so esta disponivel em espanhol.",
};

const INTENT_STATE: Record<string, MascotState> = {
  saludo: "wave",
  agradecimiento: "cheer",
  itinerario: "map",
  aforo: "search",
  accesibilidad: "smile",
  servicios: "look",
  desconocido: "confused",
};

export function pickMascotState(reply: string, intent?: string): MascotState {
  const r = reply.toLowerCase();

  /* Una respuesta que admite que no sabe manda sobre la intencion: es el turno
     donde la cara mas comunica. */
  if (/(no pude|no puedo|no tengo|no encontr|sin dato|sin confirmar|no entend)/.test(r)) {
    return "confused";
  }

  if (intent && INTENT_STATE[intent]) return INTENT_STATE[intent];

  /* Sin intent (respuestas de Claude) se deduce del texto de la respuesta. */
  if (/(plan de|itinerario|parada|min\b.*—|recorrido)/.test(r)) return "map";
  if (/(poca gente|congestionad|aforo|baja a|menos gente|cerrado)/.test(r)) return "search";
  if (/(rampa|silla de ruedas|accesible|baño|descanso)/.test(r)) return "smile";
  if (/(restaurante|servicio|guia|agencia|hospedaje)/.test(r)) return "look";
  if (/^(hola|buenas)/.test(r)) return "wave";
  return "chat";
}

const SUGGESTION_KEYS = ["chat.sug1", "chat.sug2", "chat.sug3", "chat.sug4"] as const;

export default function ChatWidget() {
  const { sites } = useSites();
  const { locale, t } = useLocale();
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          hour: new Date().getHours(),
          locale,
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
          notice:
            data.source === "offline"
              ? [
                  data.notice ?? OFFLINE_NOTICE,
                  /* El motor de reglas solo tiene cadenas en espanol. Decirlo
                     es mejor que dejar al usuario pensando que el selector de
                     idioma no funciona. */
                  locale !== "es" ? SPANISH_ONLY_NOTICE[locale] : null,
                ]
                  .filter(Boolean)
                  .join(" ")
              : undefined,
          mascot: pickMascotState(data.reply ?? "", data.intent),
        },
      ]);
    } catch {
      /* Sin red el endpoint no responde, asi que el motor de reglas corre aqui
         mismo en el cliente. Nunca se inventa una respuesta "de IA". */
      const local = answerOffline(message, sites, services, new Date().getHours());
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: local.reply,
          notice: local.notice,
          mascot: pickMascotState(local.reply, local.intent),
        },
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
          <p className="font-extrabold">{t("chat.titulo")}</p>
          <p className="text-xs opacity-80">{t("chat.subtitulo")}</p>
        </div>
        {!online ? (
          <span className="flex items-center gap-1.5 rounded-full bg-night-900 px-2.5 py-1 text-[11px] font-bold">
            <OfflineIcon size={14} />
            {t("chat.sinConexion")}
          </span>
        ) : null}
      </header>

      <div
        aria-live="polite"
        aria-label={t("chat.conversacion")}
        className="flex flex-1 flex-col gap-3 py-4"
      >
        {turns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-6 text-center">
            <Mascot size={80} state="wave" />
            <p className="font-bold text-ink">{t("chat.enQueAyudo")}</p>
            <p className="text-sm text-ink-soft">
              {t("chat.ayudaTexto")}
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
            {t("chat.escribiendo")}
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {turns.length === 0 ? (
        <ul className="mb-3 flex flex-wrap gap-2">
          {SUGGESTION_KEYS.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => send(t(key))}
                className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs font-semibold text-ink-soft"
              >
                {t(key)}
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
          {t("chat.mensajeLabel")}
        </label>
        <input
          id="mensaje"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("chat.mensajePlaceholder")}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label={t("chat.enviar")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-night-800 text-cream disabled:opacity-40"
        >
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  );
}
