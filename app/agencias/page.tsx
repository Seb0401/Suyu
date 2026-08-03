"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, BriefcaseIcon, PinIcon } from "@/components/Icons";
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
 * Directorio de agencias reales de Arequipa.
 *
 * NO hay estrellas ni puntajes, y no es un descuido: el equipo no pudo verificar
 * ninguna calificacion de forma independiente, asi que convertir esas notas en
 * un numero seria inventar justo el dato que decidimos no inventar (§6.10).
 * En su lugar se muestra el texto con su procedencia declarada.
 */
export default function AgenciasPage() {
  const [data, setData] = useState<AgenciesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agencies")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("No pudimos cargar el directorio."));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Agencias aliadas</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Operadores que ya trabajan en Arequipa. Compara tu itinerario de Suyu
        con un tour ya armado.
      </p>

      <div aria-live="polite" className="mt-5">
        {error ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
            {error}
          </p>
        ) : null}

        {!data && !error ? (
          <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
        ) : null}

        {data ? (
          <>
            {/* El disclaimer va arriba, antes de las fichas: si va al pie, se lee
                despues de haber decidido, que es cuando ya no sirve. */}
            <p className="rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
              {data.disclaimer}
            </p>

            <ul className="mt-4 flex flex-col gap-4">
              {data.agencies.map((agency) => (
                <li
                  key={agency.id}
                  className="rounded-3xl border border-sand-200 bg-sand-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
                      <BriefcaseIcon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-extrabold leading-tight text-ink">
                        {agency.name}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {agency.summary}
                      </p>
                    </div>
                  </div>

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
                      como una calificacion nuestra. */}
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
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
