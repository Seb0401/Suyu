"use client";

import { useEffect, useState } from "react";
import AgencyMonogram from "@/components/AgencyMonogram";
import { ArrowRightIcon, ChevronDownIcon, PinIcon } from "@/components/Icons";
import type { PartnerAgency } from "@/lib/types";

type AgencyWithLabels = PartnerAgency & {
  reviews_source_label: string;
  registry_label: string;
};

type AgenciesResponse = {
  agencies: AgencyWithLabels[];
  disclaimer: string;
};

/**
 * Directorio de agencias, plegado.
 *
 * Antes eran cuatro tarjetas largas abiertas y habia que desplazar mucho para
 * comparar. Ahora cada agencia es una fila con monograma y resumen de una
 * linea, y el detalle se abre al tocarla — el mismo patron del acordeon de
 * servicios, para que la app se sienta de una pieza.
 */
export default function AgencyList() {
  const [data, setData] = useState<AgenciesResponse | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agencies")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
        No pudimos cargar el directorio.
      </p>
    );
  }

  if (!data) {
    return <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />;
  }

  return (
    <>
      <p className="rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
        {data.disclaimer}
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {data.agencies.map((agency) => {
          const isOpen = open === agency.id;
          const panelId = `agencia-${agency.id}`;

          return (
            <li key={agency.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : agency.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition-colors ${
                  isOpen
                    ? "border-clay-600 bg-clay-50"
                    : "border-sand-200 bg-sand-50"
                }`}
              >
                <AgencyMonogram name={agency.name} />

                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold leading-tight text-ink">
                    {agency.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">
                    {agency.sample_tours.slice(0, 2).join(" · ")}
                  </span>
                </span>

                <ChevronDownIcon
                  size={20}
                  className={`shrink-0 text-ink-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  className="mt-2 rounded-3xl border border-sand-200 bg-sand-50 p-4"
                >
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {agency.summary}
                  </p>

                  {agency.sample_tours.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {agency.sample_tours.map((tour) => (
                        <li
                          key={tour}
                          className="rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700"
                        >
                          {tour}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {agency.address ? (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted">
                      <PinIcon size={14} className="mt-px shrink-0" />
                      {agency.address}
                    </p>
                  ) : null}

                  {/* Procedencia primero, afirmacion despues. Al reves se lee
                      como una calificacion nuestra (§6.10). */}
                  <div className="mt-3 rounded-2xl bg-sand-100 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                      {agency.reviews_source_label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {agency.reviews_note}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                      {agency.registry_label}
                    </span>

                    <a
                      href={agency.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-1.5 rounded-full bg-night-800 px-4 py-2 text-sm font-bold text-cream"
                    >
                      Ver la agencia
                      <ArrowRightIcon size={15} />
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                  </div>

                  {agency.phone ? (
                    <a
                      href={`tel:${agency.phone.replace(/\s/g, "")}`}
                      className="mt-2 inline-block text-xs font-semibold text-clay-600"
                    >
                      {agency.phone}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
