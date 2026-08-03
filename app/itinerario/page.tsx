"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CrowdBadge from "@/components/CrowdBadge";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { ArrowRightIcon, CalendarIcon } from "@/components/Icons";
import type { SiteWithCrowd } from "@/lib/types";

type Stop = {
  site: SiteWithCrowd;
  arrive_hour: number;
  arrive_label: string;
  visit_minutes: number;
  travel_from_previous_min: number | null;
  travel_from_previous_m: number | null;
  walkable: boolean;
};

type ItineraryResponse = {
  stops: Stop[];
  total_minutes: number;
  skipped: { site: SiteWithCrowd; reason: string }[];
  needs_transport: boolean;
  start_hour: number;
  available_minutes: number;
};

function humanMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function ItinerarioPage() {
  const [hours, setHours] = useState(4);
  const [start, setStart] = useState(() => new Date().getHours());
  const [accessible, setAccessible] = useState(true);
  const [data, setData] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    const params = new URLSearchParams({
      hours: String(hours),
      start: String(start),
      accessible: String(accessible),
    });
    fetch(`/api/itinerary?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError("No pudimos armar el itinerario."));
  }, [hours, start, accessible]);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Itinerario del día</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dinos cuánto tiempo tienes y preparamos un plan que evita las horas
        saturadas.
      </p>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="horas" className="text-xs font-bold text-ink-soft">
              Horas disponibles
            </label>
            <select
              id="horas"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="rounded-full border border-sand-200 bg-sand-100 px-3 py-2 text-sm text-ink"
            >
              {[2, 3, 4, 6, 8].map((h) => (
                <option key={h} value={h}>
                  {h} horas
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="inicio" className="text-xs font-bold text-ink-soft">
              Empiezo a las
            </label>
            <select
              id="inicio"
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
              className="rounded-full border border-sand-200 bg-sand-100 px-3 py-2 text-sm text-ink"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={accessible}
            onChange={(e) => setAccessible(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-forest-700)]"
          />
          <WheelchairIcon size={18} className="text-forest-700" />
          Solo lugares accesibles
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {error ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">{error}</p>
        ) : null}

        {data ? (
          <>
            <section
              className="overflow-hidden rounded-3xl px-5 py-4 text-cream"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-forest-banner-from), var(--color-forest-banner-to))",
              }}
            >
              <p className="text-sm opacity-85">Tu plan</p>
              <p className="text-3xl font-extrabold leading-tight">
                {data.stops.length} {data.stops.length === 1 ? "parada" : "paradas"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                <CalendarIcon size={15} />
                {humanMinutes(data.total_minutes)} en total
              </p>
            </section>

            {data.needs_transport ? (
              <p className="mt-3 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs font-semibold text-[var(--color-amber-text)]">
                Algún tramo es demasiado largo para ir a pie. Considera taxi o
                transporte público para esa parte.
              </p>
            ) : null}

            {data.stops.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-soft">
                Con ese tiempo y esos filtros no alcanza para ninguna parada.
                Prueba con más horas o quitando el filtro de accesibilidad.
              </p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {data.stops.map((stop, i) => (
                  <li key={stop.site.id}>
                    {stop.travel_from_previous_min !== null ? (
                      <p className="mb-2 flex items-center gap-1.5 pl-3 text-xs text-ink-muted">
                        <ArrowRightIcon size={14} />
                        {stop.travel_from_previous_min} min
                        {stop.travel_from_previous_m !== null
                          ? ` · ${stop.travel_from_previous_m} m`
                          : ""}
                        {!stop.walkable ? " · demasiado lejos a pie" : " a pie"}
                      </p>
                    ) : null}

                    <Link
                      href={`/sitio/${stop.site.id}`}
                      className="flex items-start gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-extrabold text-forest-700">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-ink">{stop.site.name}</span>
                        <span className="block text-xs text-ink-muted">
                          {stop.arrive_label} · {stop.visit_minutes} min de visita
                        </span>
                        <CrowdBadge site={stop.site} className="mt-2" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}

            {/* Nunca se descarta un sitio en silencio: si no entro, se dice por que. */}
            {data.skipped.length > 0 ? (
              <section className="mt-5 rounded-3xl border border-sand-200 bg-sand-50 p-4">
                <h2 className="text-sm font-extrabold text-ink">Qué quedó fuera</h2>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {data.skipped.map(({ site, reason }) => (
                    <li key={site.id} className="text-xs text-ink-soft">
                      <span className="font-semibold text-ink">{site.name}</span> — {reason}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
