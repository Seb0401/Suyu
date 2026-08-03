"use client";

import { useEffect, useMemo, useState } from "react";
import ServiceDetailChips from "@/components/ServiceDetailChips";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import {
  ExternalLinkIcon,
  HelpCircleIcon,
  PinIcon,
  ServiceIcon,
} from "@/components/Icons";
import type { ServiceCategory, TouristService } from "@/lib/types";

type ServiceWithDistance = TouristService & {
  distance_m: number | null;
  walking_min: number | null;
  distance_from: string | null;
  registry_label: string;
};

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${meters} m`;
}

type Filter = ServiceCategory | "todos";

const CATEGORIES: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "hospedaje", label: "Hoteles" },
  { value: "restaurante", label: "Restaurantes" },
  { value: "transporte", label: "Transporte" },
  { value: "actividad", label: "Actividades" },
  { value: "agencia", label: "Agencias" },
  { value: "guia", label: "Guías" },
  { value: "artesania", label: "Artesanía" },
  { value: "movilidad", label: "Movilidad" },
  { value: "salud", label: "Salud" },
];

/**
 * Aviso propio de la categoria "actividad".
 *
 * Un reportaje de Diario El Pueblo (2023) conto solo 7 agencias formales
 * ofreciendo deportes de aventura en toda Arequipa. Es exactamente la
 * problematica de formalizacion de TURISTON, y callarla en la pantalla donde
 * alguien elige con quien va a bajar un rio seria lo contrario de lo que hace
 * esta app.
 */
const ACTIVITY_WARNING =
  "En Arequipa muy pocas agencias formales ofrecen deportes de aventura. Antes de contratar, pide el registro del operador y verifica que entreguen equipo de seguridad. Nosotros no verificamos el registro de ninguno.";

export default function ServiciosPage() {
  const [services, setServices] = useState<ServiceWithDistance[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("todos");
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setServices(d.services ?? []))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!services) return [];
    return services.filter(
      (s) =>
        (filter === "todos" || s.category === filter) &&
        (!accessibleOnly || s.wheelchair_accessible),
    );
  }, [services, filter, accessibleOnly]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of services ?? []) {
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return map;
  }, [services]);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Servicios</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dónde dormir, comer, moverte y qué hacer en Arequipa.
      </p>

      <div className="mt-5 -mx-6 overflow-x-auto px-6">
        <ul className="flex w-max gap-2 pb-1">
          {CATEGORIES.map(({ value, label }) => {
            const n = value === "todos" ? services?.length ?? 0 : counts.get(value) ?? 0;
            if (value !== "todos" && n === 0) return null;
            const active = filter === value;
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={active}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-clay-600 bg-clay-600 text-cream"
                      : "border-sand-200 bg-sand-50 text-ink-soft"
                  }`}
                >
                  {label} <span className="opacity-70">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="mt-3 flex items-center gap-2.5 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={accessibleOnly}
          onChange={(e) => setAccessibleOnly(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-forest-700)]"
        />
        <WheelchairIcon size={18} className="text-forest-700" />
        Solo con acceso confirmado
      </label>

      {filter === "actividad" ? (
        <p className="mt-4 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
          {ACTIVITY_WARNING}
        </p>
      ) : null}

      <div aria-live="polite" className="mt-4">
        {error ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
            No pudimos cargar los servicios.
          </p>
        ) : null}

        {!services && !error ? (
          <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
        ) : null}

        {services && visible.length === 0 ? (
          <p className="rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-soft">
            {accessibleOnly
              ? "Ninguno de esta categoría tiene acceso confirmado todavía. Eso no significa que no sea accesible: significa que no lo hemos podido verificar."
              : "No hay servicios en esta categoría."}
          </p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {visible.map((service) => (
            <li
              key={service.id}
              className="rounded-3xl border border-sand-200 bg-sand-50 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-ink-soft">
                  <ServiceIcon category={service.category} size={20} />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold leading-tight text-ink">
                    {service.name}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {service.provider}
                    {service.price_range ? ` · ${service.price_range}` : ""}
                  </p>
                </div>

                {service.wheelchair_accessible ? (
                  <WheelchairIcon size={18} className="shrink-0 text-forest-700" />
                ) : null}
              </div>

              <ServiceDetailChips details={service.details} className="mt-3" />

              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                {service.notes}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* El registro nunca se omite: si no esta confirmado, se dice. */}
                <span className="flex items-center gap-1.5 rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  <HelpCircleIcon size={13} />
                  {service.registry_label}
                </span>

                {service.details?.phone ? (
                  <a
                    href={`tel:${service.details.phone.replace(/\s/g, "")}`}
                    className="rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-clay-600"
                  >
                    {service.details.phone}
                  </a>
                ) : null}

                {/* La distancia siempre con su referencia: "194 m" a secas no
                    responde "de donde", y en una lista global de la ciudad esa
                    es justo la pregunta. */}
                {service.distance_m !== null && service.distance_from ? (
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <PinIcon size={13} />
                    {formatDistance(service.distance_m)} de {service.distance_from}
                  </span>
                ) : null}

                {service.url ? (
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-auto flex items-center gap-1.5 text-xs font-bold text-clay-600"
                  >
                    Ver más
                    <ExternalLinkIcon size={13} />
                    <span className="sr-only">(se abre en una pestaña nueva)</span>
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
