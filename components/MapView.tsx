"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { PinIcon } from "@/components/Icons";
import { useTheme } from "@/components/ThemeToggle";
import { crowdPresentation } from "@/lib/crowdUi";
import type { RouteGeometry, SiteWithCrowd } from "@/lib/types";

/*
 * MapLibre GL JS + OpenFreeMap: sin token, sin cuenta y sin limite de
 * peticiones, asi que el mapa ya no depende de ninguna variable de entorno.
 * Lo que si puede faltar es la RED (§2.1), y ahi el mapa vuelve a la lista en
 * texto — que nunca dejo de ser la alternativa real, no un adorno.
 */
const STYLE_URL = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

/** Copiado literal del TileJSON de OpenFreeMap (https://tiles.openfreemap.org/planet). */
const OSM_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

type MapViewProps = {
  sites: SiteWithCrowd[];
  route?: RouteGeometry | null;
  className?: string;
};

export default function MapView({ sites, route, className = "" }: MapViewProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <MapUnavailable sites={sites} className={className} />;
  /* setFailed va tal cual, no envuelto en una flecha: un setter de useState es
     estable entre renders y el efecto de LibreMap lo tiene en sus deps — una
     flecha nueva por render remontaria el mapa en bucle. */
  return <LibreMap sites={sites} route={route} className={className} onFail={setFailed} />;
}

function MapLegend() {
  const items = [
    { label: "Poca gente", color: "var(--crowd-bajo)" },
    { label: "Algo concurrido", color: "var(--crowd-medio)" },
    { label: "Muy congestionado", color: "var(--crowd-alto)" },
    { label: "Cerrado o sin datos", color: "var(--crowd-sin-datos)" },
  ];

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map(({ label, color }) => (
        <li key={label} className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full border border-sand-50"
            style={{ background: color }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Lista de sitios en texto. Es la alternativa al mapa, no un extra decorativo. */
function SiteRoster({ sites, srOnly }: { sites: SiteWithCrowd[]; srOnly?: boolean }) {
  return (
    <ul className={srOnly ? "sr-only" : "flex flex-col gap-2"}>
      {sites.map((site) => (
        <li key={site.id} className="flex items-start gap-2 text-sm">
          <PinIcon size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          <span>
            <span className="font-semibold text-ink">{site.name}</span>{" "}
            <span className="text-ink-soft">— {crowdPresentation(site).label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function MapUnavailable({ sites, className }: { sites: SiteWithCrowd[]; className: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-3xl border border-dashed border-sand-300 bg-sand-50 p-4 ${className}`}
    >
      <div>
        <p className="font-bold text-ink">Mapa no disponible</p>
        <p className="mt-0.5 text-sm text-ink-soft">
          No pudimos cargar el mapa (probablemente estás sin conexión), así que
          mostramos los lugares en lista. Todo lo demás funciona igual.
        </p>
      </div>
      <SiteRoster sites={sites} />
      <MapLegend />
    </div>
  );
}

function LibreMap({
  sites,
  route,
  className,
  onFail,
}: MapViewProps & { className: string; onFail: (failed: true) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      let maplibregl;
      try {
        maplibregl = (await import("maplibre-gl")).default;
      } catch {
        // El chunk no llego (sin red, cache frio): la lista sigue estando.
        if (!cancelled) onFail(true);
        return;
      }
      if (cancelled) return;

      try {
        map = new maplibregl.Map({
          container,
          style: STYLE_URL[theme],
          center: [-71.5375, -16.399],
          zoom: 13,
          /* La atribucion de OSM no es decorativa: la ODbL la EXIGE. En la
             practica el control solo mostraba "MapLibre" — la que trae el
             TileJSON de OpenFreeMap no llegaba a pintarse — asi que se
             declara aqui a mano. Es el mismo texto exacto del TileJSON, de
             modo que si MapLibre tambien la recoge, dedupe y no salga dos
             veces. Nunca desactivar este control. */
          attributionControl: {
            customAttribution: OSM_ATTRIBUTION,
          },
        });
      } catch {
        /* Sin WebGL el constructor lanza. MapLibre v5 ya no expone
           supported(), asi que el try/catch es la unica deteccion que no
           depende de la version. Un canvas negro y mudo seria peor que decir
           que el mapa no esta disponible. */
        onFail(true);
        return;
      }

      /* Un tile suelto que no carga no justifica tumbar el mapa entero; solo
         un fallo del estilo (la peticion inicial) lo deja inservible. */
      map.on("error", (event: { error?: { status?: number } }) => {
        if (!map.isStyleLoaded() && event.error?.status !== undefined) onFail(true);
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const bounds = new maplibregl.LngLatBounds();

      for (const site of sites) {
        const el = document.createElement("div");
        el.style.width = "22px";
        el.style.height = "22px";
        el.style.borderRadius = "9999px";
        el.style.border = "3px solid var(--color-cream)";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,.35)";
        el.style.background = crowdPresentation(site).colorVar;

        new maplibregl.Marker({ element: el })
          .setLngLat([site.lng, site.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 16 }).setText(
              `${site.name} — ${crowdPresentation(site).label}`,
            ),
          )
          .addTo(map);

        bounds.extend([site.lng, site.lat]);
      }

      map.on("load", () => {
        if (route && route.coordinates.length > 1) {
          const stroke = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-route-legend")
            .trim();

          map.addSource("suyu-route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: route },
          });
          map.addLayer({
            id: "suyu-route-line",
            type: "line",
            source: "suyu-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": stroke || "#15664a", "line-width": 5 },
          });

          for (const coord of route.coordinates) bounds.extend(coord);
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // `theme` remonta el mapa con el estilo del tema: setStyle() borraria la
    // capa de la ruta y los marcadores, y habria que recrearlos igual.
  }, [sites, route, theme, onFail]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        ref={containerRef}
        role="application"
        aria-label="Mapa de sitios de Arequipa"
        className="h-72 w-full overflow-hidden rounded-3xl border border-sand-200"
      />
      <SiteRoster sites={sites} srOnly />
      <MapLegend />
    </div>
  );
}
