"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { useCallback, useEffect, useState } from "react";
import CrowdBadge from "@/components/CrowdBadge";
import Meter from "@/components/Meter";
import StopProfileAlerts from "@/components/StopProfileAlerts";
import { buildProfileAlerts, hasAnyNeed } from "@/components/profileAlerts";
import { EMPTY_PROFILE, readProfile, type TravelProfile } from "@/components/travelProfile";
import type { SiteAccessibilityDetail } from "@/lib/types";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
} from "@/components/Icons";
import type { SiteWithCrowd } from "@/lib/types";

const VISITED_KEY = "suyu:visited";

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
  const t = useT();
  const [data, setData] = useState<ItineraryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  /**
   * Progreso de visita en localStorage, no en el servidor: no hay cuentas de
   * usuario y no vamos a inventar un backend para esto. Se lee en un efecto,
   * no en el estado inicial, porque en SSR no existe window y el estado
   * inicial tiene que coincidir en servidor y cliente o hay error de
   * hidratacion.
   */
  const [visited, setVisited] = useState<string[]>([]);

  /* Perfil y fichas de accesibilidad para los avisos personalizados. Las fichas
     se piden UNA vez para todos los sitios en vez de una por parada: son seis
     registros estaticos y seis peticiones por itinerario no compran nada. */
  const [profile, setProfile] = useState<TravelProfile>(EMPTY_PROFILE);
  const [details, setDetails] = useState<Map<string, SiteAccessibilityDetail>>(new Map());

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  useEffect(() => {
    fetch("/api/accessibility")
      .then((r) => (r.ok ? r.json() : { details: [] }))
      .then((d) => {
        const list: SiteAccessibilityDetail[] = d.details ?? [];
        setDetails(new Map(list.map((x) => [x.site_id, x])));
      })
      .catch(() => setDetails(new Map()));
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VISITED_KEY);
      if (raw) setVisited(JSON.parse(raw) as string[]);
    } catch {
      /* Modo incognito o storage lleno: se sigue sin progreso guardado. */
    }
  }, []);

  const toggleVisited = useCallback((siteId: string) => {
    setVisited((prev) => {
      const next = prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId];
      try {
        window.localStorage.setItem(VISITED_KEY, JSON.stringify(next));
      } catch {
        /* Si no se puede guardar, al menos la sesion actual funciona. */
      }
      return next;
    });
  }, []);

  const load = useCallback(() => {
    setFailed(false);
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
      .catch(() => setFailed(true));
  }, [hours, start, accessible]);

  useEffect(load, [load]);

  // Solo cuentan las paradas del plan actual: si cambias los filtros y sale otro
  // recorrido, el avance se recalcula sobre ese, no sobre lo visitado historico.
  const visitedInPlan =
    data?.stops.filter((stop) => visited.includes(stop.site.id)).length ?? 0;

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">{t("itinerario.titulo")}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {t("itinerario.subtitulo")}
      </p>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="horas" className="text-xs font-bold text-ink-soft">
              {t("itinerario.horas")}
            </label>
            <select
              id="horas"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="rounded-full border border-sand-200 bg-sand-100 px-3 py-2 text-sm text-ink"
            >
              {[2, 3, 4, 6, 8].map((h) => (
                <option key={h} value={h}>
                  {h} {t("common.horas")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="inicio" className="text-xs font-bold text-ink-soft">
              {t("itinerario.empiezo")}
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
          {t("itinerario.soloAccesibles")}
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {failed ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
            {t("itinerario.error")}
          </p>
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
              <p className="text-sm opacity-85">{t("itinerario.tuPlan")}</p>
              <p className="text-3xl font-extrabold leading-tight">
                {data.stops.length}{" "}
                {data.stops.length === 1 ? t("itinerario.parada") : t("itinerario.paradas")}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                <CalendarIcon size={15} />
                {humanMinutes(data.total_minutes)} {t("itinerario.enTotal")}
              </p>
            </section>

            {/* El progreso solo aparece cuando hay algo marcado. Una barra al 0%
                desde el inicio invita a "completarla" y convierte el plan en una
                lista de tareas; el objetivo es pasear, no hacer checklist. */}
            {data.stops.length > 0 && visitedInPlan > 0 ? (
              <div className="mt-3 rounded-3xl border border-sand-200 bg-sand-50 p-4">
                <Meter
                  label={t("itinerario.tuAvance")}
                  value={visitedInPlan}
                  max={data.stops.length}
                  valueLabel={`${visitedInPlan} ${t("panel.deN")} ${data.stops.length}`}
                />
              </div>
            ) : null}

            {data.needs_transport ? (
              <p className="mt-3 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs font-semibold text-[var(--color-amber-text)]">
                {t("itinerario.transporte")}
              </p>
            ) : null}

            {data.stops.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-soft">
                {t("itinerario.sinParadas")}
              </p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {data.stops.map((stop, i) => {
                  const done = visited.includes(stop.site.id);
                  return (
                    <li key={stop.site.id}>
                      {stop.travel_from_previous_min !== null ? (
                        <p className="mb-2 flex items-center gap-1.5 pl-3 text-xs text-ink-muted">
                          <ArrowRightIcon size={14} />
                          {stop.travel_from_previous_min} min
                          {stop.travel_from_previous_m !== null
                            ? ` · ${stop.travel_from_previous_m} m`
                            : ""}
                          {!stop.walkable ? ` · ${t("itinerario.lejosAPie")}` : ` ${t("itinerario.aPie")}`}
                        </p>
                      ) : null}

                      <div
                        className={`rounded-3xl border border-sand-200 p-4 transition-colors ${
                          done ? "bg-forest-50" : "bg-sand-50"
                        }`}
                      >
                        <Link href={`/sitio/${stop.site.id}`} className="flex items-start gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                              done
                                ? "bg-forest-700 text-cream"
                                : "bg-forest-100 text-forest-700"
                            }`}
                          >
                            {/* El check reemplaza al numero: el estado no viaja
                                solo en el color de fondo (§2.3). */}
                            {done ? <CheckIcon size={16} /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block font-bold ${
                                done ? "text-ink-soft line-through" : "text-ink"
                              }`}
                            >
                              {stop.site.name}
                            </span>
                            <span className="block text-xs text-ink-muted">
                              {stop.arrive_label} · {stop.visit_minutes} {t("itinerario.minVisita")}
                            </span>
                            <CrowdBadge site={stop.site} className="mt-2" />
                          </span>
                        </Link>

                        {/* Fuera del <Link>: los avisos se despliegan, y un
                            boton dentro de un enlace no se puede activar sin
                            navegar. */}
                        {hasAnyNeed(profile) ? (
                          <StopProfileAlerts
                            alerts={buildProfileAlerts(
                              profile,
                              stop.site,
                              details.get(stop.site.id) ?? null,
                            )}
                          />
                        ) : null}

                        <button
                          type="button"
                          onClick={() => toggleVisited(stop.site.id)}
                          aria-pressed={done}
                          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                            done
                              ? "border-forest-700 bg-forest-700 text-cream"
                              : "border-sand-300 bg-sand-100 text-ink-soft"
                          }`}
                        >
                          <CheckIcon size={15} />
                          {done ? t("itinerario.visitado") : t("itinerario.marcarVisitado")}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Enlace contextual a /agencias: aqui es donde el turista acaba de
                ver un plan armado y puede querer compararlo con un tour ya
                existente. En la barra inferior no cabe una quinta entrada. */}
            <Link
              href="/agencias"
              className="mt-4 flex items-center gap-3 rounded-3xl border border-sand-200 bg-clay-50 p-4"
            >
              <BriefcaseIcon size={22} className="shrink-0 text-clay-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">
                  ¿Prefieres un tour ya armado?
                </span>
                <span className="block text-xs text-ink-soft">
                  Mira agencias que operan en Arequipa
                </span>
              </span>
              <ArrowRightIcon size={16} className="shrink-0 text-ink-muted" />
            </Link>

            {/* Nunca se descarta un sitio en silencio: si no entro, se dice por que. */}
            {data.skipped.length > 0 ? (
              <section className="mt-5 rounded-3xl border border-sand-200 bg-sand-50 p-4">
                <h2 className="text-sm font-extrabold text-ink">{t("itinerario.quedoFuera")}</h2>
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
