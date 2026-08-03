"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { PinIcon } from "@/components/Icons";
import { crowdPresentation } from "@/lib/crowdUi";
import type { RouteGeometry, SiteWithCrowd } from "@/lib/types";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type MapViewProps = {
  sites: SiteWithCrowd[];
  route?: RouteGeometry | null;
  className?: string;
};

export default function MapView({ sites, route, className = "" }: MapViewProps) {
  /* Sin token no se monta Mapbox: se dice que el mapa no esta disponible y se
     lista lo mismo en texto. Un mapa gris y mudo seria peor que no tenerlo. */
  if (!TOKEN) {
    return <MapUnavailable sites={sites} className={className} />;
  }
  return <MapboxMap sites={sites} route={route} className={className} />;
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
          No hay token de Mapbox configurado, así que mostramos los lugares en
          lista. Todo lo demás funciona igual.
        </p>
      </div>
      <SiteRoster sites={sites} />
      <MapLegend />
    </div>
  );
}

function MapboxMap({ sites, route, className }: Required<Pick<MapViewProps, "sites">> & MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;

      mapboxgl.accessToken = TOKEN as string;
      map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-71.5375, -16.399],
        zoom: 13,
        // El mapa es complemento: si falla, la lista sigue estando (§2.1).
        attributionControl: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const bounds = new mapboxgl.LngLatBounds();

      for (const site of sites) {
        const el = document.createElement("div");
        el.style.width = "22px";
        el.style.height = "22px";
        el.style.borderRadius = "9999px";
        el.style.border = "3px solid var(--color-cream)";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,.35)";
        el.style.background = crowdPresentation(site).colorVar;

        new mapboxgl.Marker({ element: el })
          .setLngLat([site.lng, site.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 16 }).setText(
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
  }, [sites, route]);

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
