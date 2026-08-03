"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MapView from "@/components/MapView";
import Mascot from "@/components/Mascot";
import RouteTimeline, { type Milestone } from "@/components/RouteTimeline";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { ArrowRightIcon, CalendarIcon, PinIcon, SearchIcon } from "@/components/Icons";
import { useSites } from "@/components/useSites";
import { useT } from "@/components/i18n/LocaleProvider";
import { crowdPresentation } from "@/lib/crowdUi";
import type { RouteGeometry, SiteWithCrowd } from "@/lib/types";

type RouteResult = {
  geometry: RouteGeometry;
  distance_m: number;
  duration_min: number;
  approximate: boolean;
  walkable: boolean;
  accessibility_score: number;
  milestones: Milestone[];
  origin: SiteWithCrowd;
  destination: SiteWithCrowd;
  hour: number;
  saturated: boolean;
  alternative: SiteWithCrowd | null;
  quiet_hour: { hour: number; occupancy: number; level: string } | null;
  origin_is_user_location?: boolean;
};

/**
 * Debe coincidir con USER_LOCATION_ID de app/api/route-finder/route.ts. Se
 * duplica a proposito en vez de importarlo: ese archivo es un modulo de
 * servidor y traerlo al cliente arrastraria Supabase y el resto de lib/ al
 * bundle solo por una constante.
 */
const USER_LOCATION_ID = "__mi-ubicacion__";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function hhmm(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function RutaPage() {
  const { sites, loading: loadingSites } = useSites();
  const t = useT();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [accessible, setAccessible] = useState(true);
  const [hour, setHour] = useState<number>(() => new Date().getHours());

  const [result, setResult] = useState<RouteResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  /**
   * La ubicacion se pide SOLO cuando el usuario elige "Mi ubicacion", nunca al
   * cargar la pantalla: un permiso que salta sin que nadie lo haya pedido se
   * deniega por reflejo, y ademas no lo necesitamos hasta ese momento.
   */
  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setError(t("ruta.ubicacionNoSoportada"));
      setOrigin("");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        /* Denegado, sin señal o agotado el tiempo: da igual cual — el usuario
           necesita saber que hay que elegir un punto de la lista. */
        setError(t("ruta.ubicacionDenegada"));
        setOrigin("");
        setCoords(null);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  // Precarga origen y destino con dos sitios distintos para que el demo no
  // arranque con los selects vacios.
  useEffect(() => {
    if (sites.length >= 2 && !origin && !destination) {
      setOrigin(sites[1].id);
      setDestination(sites[0].id);
    }
  }, [sites, origin, destination]);

  const mapSites = useMemo(() => {
    if (!result) return sites;
    return [result.origin, result.destination];
  }, [result, sites]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || origin === destination) return;

    setSearching(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        origin,
        destination,
        accessible: String(accessible),
        hour: String(hour),
      });
      if (origin === USER_LOCATION_ID && coords) {
        params.set("origin_lat", String(coords.lat));
        params.set("origin_lng", String(coords.lng));
      }

      const res = await fetch(`/api/route-finder?${params}`);
      if (!res.ok) {
        /* 422 = estas fuera de Arequipa. Es un caso distinto de "fallo la red"
           y merece su propio mensaje. */
        if (res.status === 422) {
          setError(t("ruta.ubicacionLejos"));
          setResult(null);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch {
      setError(t("ruta.errorCalculo"));
      setResult(null);
    } finally {
      setSearching(false);
    }
  }

  const sameSite = Boolean(origin && origin === destination);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">{t("ruta.titulo")}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {t("ruta.subtitulo")}
      </p>

      <form onSubmit={search} className="mt-5 flex flex-col gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="origen" className="text-xs font-bold text-ink-soft">
            {t("ruta.desde")}
          </label>
          <select
            id="origen"
            value={origin}
            onChange={(e) => {
              const next = e.target.value;
              setOrigin(next);
              setCoords(null);
              if (next === USER_LOCATION_ID) requestLocation();
            }}
            disabled={loadingSites}
            className="rounded-full border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink"
          >
            <option value="">{t("ruta.eligeLugar")}</option>
            <option value={USER_LOCATION_ID}>{t("ruta.miUbicacion")}</option>
            {sites.map((s) => (
              /* Los nombres de los lugares NO se traducen: son los que estan
                 senalizados y por los que se pregunta en la calle. */
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {origin === USER_LOCATION_ID ? (
            <p className="px-1 text-xs text-ink-soft" aria-live="polite">
              {locating
                ? t("ruta.ubicandote")
                : coords
                  ? t("ruta.desdeTuUbicacion")
                  : t("ruta.usarMiUbicacion")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="destino" className="text-xs font-bold text-ink-soft">
            {t("ruta.hasta")}
          </label>
          <select
            id="destino"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={loadingSites}
            className="rounded-full border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink"
          >
            <option value="">{t("ruta.eligeLugar")}</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hora" className="text-xs font-bold text-ink-soft">
            {t("ruta.aQueHora")}
          </label>
          <div className="flex items-center gap-2 rounded-full border border-sand-200 bg-sand-100 px-4 py-1">
            <CalendarIcon size={16} className="shrink-0 text-ink-muted" />
            <select
              id="hora"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full bg-transparent py-1.5 text-sm text-ink"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hhmm(h)}
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
          {t("ruta.soloAccesibles")}
        </label>

        {sameSite ? (
          <p className="text-xs font-semibold text-[var(--color-danger-text)]">
            {t("ruta.mismoLugar")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={
            searching ||
            loadingSites ||
            sameSite ||
            !origin ||
            !destination ||
            (origin === USER_LOCATION_ID && !coords)
          }
          className="flex items-center justify-center gap-2 rounded-full bg-forest-700 px-5 py-3 font-bold text-cream disabled:opacity-50"
        >
          <SearchIcon size={18} />
          {searching ? t("ruta.buscando") : t("ruta.buscar")}
        </button>
      </form>

      {/* §7.7: el resultado se anuncia solo, sin que el usuario tenga que ir a
          buscarlo con el lector de pantalla. */}
      <div aria-live="polite" className="mt-6 flex flex-col gap-4">
        {error ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">{error}</p>
        ) : null}

        {result ? (
          <>
            <section
              className="overflow-hidden rounded-3xl text-cream"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-forest-banner-from), var(--color-forest-banner-to))",
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <div>
                  <p className="text-4xl font-extrabold leading-none">
                    {result.accessibility_score}%
                  </p>
                  <p className="mt-1 font-semibold">{t("ruta.accesibilidad")}</p>
                </div>
                <WheelchairIcon size={52} className="opacity-40" />
              </div>

              {/* Saliendo desde la ubicacion del usuario el porcentaje solo
                  cubre el destino, y la cifra tiene que decirlo. */}
              {result.origin_is_user_location ? (
                <p className="px-5 pt-2 text-xs opacity-85">{t("ruta.origenSinDatos")}</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-3 divide-x divide-white/20 border-t border-white/20 text-center">
                <div className="px-2 py-3">
                  <dd className="font-extrabold">{(result.distance_m / 1000).toFixed(1)} km</dd>
                  <dt className="text-xs opacity-80">{t("ruta.distancia")}</dt>
                </div>
                <div className="px-2 py-3">
                  <dd className="font-extrabold">{result.duration_min} min</dd>
                  <dt className="text-xs opacity-80">{t("ruta.tiempo")}</dt>
                </div>
                <div className="px-2 py-3">
                  <dd className="font-extrabold">{result.milestones.length}</dd>
                  <dt className="text-xs opacity-80">{t("ruta.paradas")}</dt>
                </div>
              </dl>
            </section>

            {result.approximate ? (
              <p className="rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs font-semibold text-[var(--color-amber-text)]">
                {t("ruta.aproximada")}
              </p>
            ) : null}

            {!result.walkable ? (
              <p className="rounded-2xl border border-sand-200 bg-clay-50 p-3 text-xs font-semibold text-[var(--color-danger-text)]">
                {t("ruta.noCaminable")}
              </p>
            ) : null}

            <MapView sites={mapSites} route={result.geometry} />

            <section className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
              <h2 className="mb-4 font-extrabold text-ink">{t("ruta.tuRecorrido")}</h2>
              <RouteTimeline
                originName={result.origin.name}
                destinationName={result.destination.name}
                milestones={result.milestones}
              />
            </section>

            {result.saturated ? (
              <section className="rounded-3xl border border-sand-200 bg-clay-50 p-4">
                <div className="flex items-start gap-3">
                  <Mascot size={56} state="map" />
                  <div className="flex-1">
                    <h2 className="font-extrabold text-ink">
                      {result.destination.name} {t("ruta.estaLleno")} {hhmm(result.hour)}
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      {crowdPresentation(result.destination).advice}
                    </p>

                    {result.quiet_hour ? (
                      <p className="mt-2 text-sm font-semibold text-forest-700">
                        A las {hhmm(result.quiet_hour.hour)} baja a{" "}
                        {result.quiet_hour.occupancy}% de ocupación.
                      </p>
                    ) : null}

                    {result.alternative ? (
                      <Link
                        href={`/sitio/${result.alternative.id}`}
                        className="mt-3 flex items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-3"
                      >
                        <PinIcon size={18} className="shrink-0 text-forest-700" />
                        <span className="flex-1">
                          <span className="block text-sm font-bold text-ink">
                            {result.alternative.name}
                          </span>
                          <span className="block text-xs text-ink-soft">
                            {crowdPresentation(result.alternative).label} ·{" "}
                            {t("sitio.alternativaCercana")}
                          </span>
                        </span>
                        <ArrowRightIcon size={16} className="text-ink-muted" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
