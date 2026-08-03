"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertIcon,
  CalendarIcon,
  CloudIcon,
  DropIcon,
  SunIcon,
} from "@/components/Icons";

type Weather = {
  current: { temp: number; label: string } | null;
  days: { code: number; temp_max: number; temp_min: number; rain_chance: number | null }[];
  source: "open-meteo" | "normales";
};

type EventItem = {
  id: string;
  name: string;
  active_now: boolean;
  days_until: number | null;
  window_label: string;
};

function Glyph({ code, size = 22 }: { code: number; size?: number }) {
  if (code === 0) return <SunIcon size={size} className="text-clay-600" />;
  if (code >= 51) return <DropIcon size={size} className="text-forest-700" />;
  return <CloudIcon size={size} className="text-ink-muted" />;
}

/**
 * "Hoy en Arequipa" — el estado de la ciudad en una tira, en Inicio.
 *
 * Inicio era la unica pantalla que no sabia que existen el clima, el calendario
 * y las emergencias. Esto los junta en el primer scroll, que es donde sirven:
 * el turista abre la app en la manana y quiere saber si llueve y si hay algo
 * pasando, no navegar tres secciones para averiguarlo.
 *
 * Si falla cualquiera de las dos consultas, la parte que si respondio se
 * muestra igual. Nada de esto es critico como para tumbar el Inicio.
 */
export default function TodayStrip() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && d && setWeather(d))
      .catch(() => {});

    // 45 dias: lo bastante lejos para alcanzar a mover un viaje, lo bastante
    // cerca para que no sea trivia.
    fetch("/api/events?upcoming=45")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setEvent(d?.events?.[0] ?? null))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (!weather && !event) return null;

  const today = weather?.days?.[0];

  return (
    <section className="px-6 pt-6" aria-labelledby="hoy-titulo">
      <h2 id="hoy-titulo" className="mb-3 font-extrabold text-ink">
        Hoy en Arequipa
      </h2>

      <div className="flex flex-col gap-2">
        {today ? (
          <Link
            href="/eventos"
            className="flex items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4"
          >
            <Glyph code={today.code} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">
                {weather?.current
                  ? `${weather.current.temp}° · ${weather.current.label}`
                  : `${today.temp_max}° / ${today.temp_min}°`}
              </span>
              <span className="block text-xs text-ink-soft">
                Máxima {today.temp_max}° · mínima {today.temp_min}°
                {today.rain_chance !== null && today.rain_chance >= 30
                  ? ` · ${today.rain_chance}% de lluvia`
                  : ""}
              </span>
            </span>
            {/* Obligatorio cuando el dato no es el pronostico real (§2.1). */}
            {weather?.source === "normales" ? (
              <span className="shrink-0 rounded-full bg-[var(--color-amber-chip-bg)] px-2 py-1 text-[10px] font-extrabold text-[var(--color-amber-text)]">
                Sin conexión
              </span>
            ) : null}
          </Link>
        ) : null}

        {event ? (
          <Link
            href="/eventos"
            className={`flex items-center gap-3 rounded-3xl border p-4 ${
              event.active_now
                ? "border-clay-600 bg-clay-50"
                : "border-sand-200 bg-sand-50"
            }`}
          >
            <CalendarIcon size={22} className="shrink-0 text-clay-600" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">{event.name}</span>
              <span className="block text-xs text-ink-soft">
                {event.active_now
                  ? "Está pasando ahora"
                  : event.days_until !== null
                    ? `En ${event.days_until} días · ${event.window_label}`
                    : event.window_label}
              </span>
            </span>
          </Link>
        ) : null}

        <Link
          href="/emergencias"
          className="flex items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4"
        >
          <AlertIcon size={22} className="shrink-0 text-clay-600" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-ink">Emergencias</span>
            <span className="block text-xs text-ink-soft">
              105 · 106 · 116 y qué hacer ante un paro
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
