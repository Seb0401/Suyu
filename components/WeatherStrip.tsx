"use client";

import { useEffect, useState } from "react";
import { CloudIcon, DropIcon, SunIcon } from "@/components/Icons";

type DayForecast = {
  date: string;
  code: number;
  label: string;
  temp_max: number;
  temp_min: number;
  rain_chance: number | null;
};

type WeatherResponse = {
  current: { temp: number; label: string } | null;
  days: DayForecast[];
  source: "open-meteo" | "normales";
  notice: string | null;
  advice: string | null;
  place: string;
};

const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function dayLabel(iso: string, index: number): string {
  if (index === 0) return "Hoy";
  // Se parsea a mediodia para que el cambio de huso no corra el dia.
  const d = new Date(`${iso}T12:00:00`);
  return DAY_NAMES[d.getDay()];
}

function Glyph({ code, size = 20 }: { code: number; size?: number }) {
  if (code === 0) return <SunIcon size={size} className="text-clay-600" />;
  if (code >= 51) return <DropIcon size={size} className="text-forest-700" />;
  return <CloudIcon size={size} className="text-ink-muted" />;
}

export default function WeatherStrip({ siteId }: { siteId?: string }) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = siteId ? `/api/weather?site=${siteId}` : "/api/weather";
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  // Sin clima la pantalla sigue sirviendo: la seccion desaparece y ya.
  if (failed || !data) return null;

  return (
    <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-extrabold text-ink">Clima</h2>
        {data.current ? (
          <p className="text-sm text-ink-soft">
            Ahora{" "}
            <span className="font-extrabold text-ink">{data.current.temp}°</span>{" "}
            · {data.current.label}
          </p>
        ) : null}
      </div>

      <ul className="mt-3 flex justify-between gap-1">
        {data.days.map((day, i) => (
          <li key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[11px] font-bold uppercase text-ink-muted">
              {dayLabel(day.date, i)}
            </span>
            <Glyph code={day.code} />
            <span className="text-xs font-extrabold text-ink">{day.temp_max}°</span>
            <span className="text-[11px] text-ink-muted">{day.temp_min}°</span>
            {/* La probabilidad solo aparece si es alta: en una ciudad con
                300 dias de sol, un "5%" en cada columna es ruido. */}
            {day.rain_chance !== null && day.rain_chance >= 30 ? (
              <span className="text-[10px] font-bold text-forest-700">
                {day.rain_chance}%
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {data.advice ? (
        <p className="mt-3 rounded-2xl bg-clay-50 p-3 text-xs leading-relaxed text-ink">
          {data.advice}
        </p>
      ) : null}

      {/* Obligatorio cuando el dato no es el pronostico real (§2.1). */}
      {data.notice ? (
        <p className="mt-3 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-2.5 text-xs leading-relaxed text-[var(--color-amber-text)]">
          {data.notice}
        </p>
      ) : null}
    </section>
  );
}
