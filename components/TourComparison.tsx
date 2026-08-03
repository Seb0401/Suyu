"use client";

import { useEffect, useState } from "react";
import AgencyMonogram from "@/components/AgencyMonogram";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  TicketIcon,
} from "@/components/Icons";
import type { TourPlan } from "@/lib/types";

type Estimate = {
  base_pen: number | null;
  unavoidable_pen: number;
  optional_pen: number;
  realistic_pen: number | null;
  markup_percent: number | null;
};

type PlanWithEstimate = TourPlan & { estimate: Estimate };
type Group = { destination: string; plans: PlanWithEstimate[] };

type ToursResponse = {
  groups: Group[];
  exchange_note: string;
  disclaimer: string;
};

const soles = (n: number) => `S/ ${Math.round(n)}`;

export default function TourComparison() {
  const [data, setData] = useState<ToursResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tours")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;
  if (!data) {
    return <div className="h-64 animate-pulse rounded-3xl bg-sand-200" aria-hidden />;
  }

  return (
    <section>
      <p className="rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
        {data.disclaimer}
      </p>

      {data.groups.map((group) => {
        const priced = group.plans.filter((p) => p.estimate.realistic_pen !== null);
        // Escala comun al plan mas caro del grupo: las barras solo se pueden
        // comparar entre si si comparten el mismo maximo.
        const max = Math.max(...priced.map((p) => p.estimate.realistic_pen ?? 0), 1);
        const cheapestId = priced[0]?.id;

        return (
          <div key={group.destination} className="mt-6">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
              {group.destination}
            </h3>

            <ul className="mt-2 flex flex-col gap-2">
              {group.plans.map((plan) => {
                const est = plan.estimate;
                const isOpen = openPlan === plan.id;
                const hasPrice = est.realistic_pen !== null;
                const basePct = hasPrice ? ((est.base_pen ?? 0) / max) * 100 : 0;
                const extraPct = hasPrice ? (est.unavoidable_pen / max) * 100 : 0;

                return (
                  <li
                    key={plan.id}
                    className={`rounded-3xl border ${
                      isOpen ? "border-clay-600 bg-clay-50" : "border-sand-200 bg-sand-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenPlan(isOpen ? null : plan.id)}
                      aria-expanded={isOpen}
                      aria-controls={`plan-${plan.id}`}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start gap-3">
                        {/* Un plan sin agencia no tiene monograma que mostrar:
                            "PD" de "Precio De referencia" no identifica nada.
                            Va un icono de etiqueta, que es lo que es. */}
                        {plan.agency_id ? (
                          <AgencyMonogram name={plan.agency_name} size={38} />
                        ) : (
                          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-2xl bg-sand-200 text-ink-muted">
                            <TicketIcon size={19} />
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-bold leading-tight text-ink">
                              {plan.name}
                            </h4>
                            {plan.id === cheapestId ? (
                              <span className="rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-extrabold uppercase text-cream">
                                Más barato
                              </span>
                            ) : null}
                            {plan.wheelchair_viable === false ? (
                              <span className="flex items-center gap-1 rounded-full bg-clay-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-clay-700">
                                <WheelchairIcon size={11} />
                                No apto
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                            <ClockIcon size={13} />
                            {plan.duration_label}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          {hasPrice ? (
                            <>
                              <p className="text-xl font-extrabold leading-none text-ink">
                                {soles(est.realistic_pen!)}
                              </p>
                              <p className="text-[10px] leading-tight text-ink-muted">
                                total real
                              </p>
                            </>
                          ) : (
                            <p className="text-xs font-bold text-ink-muted">
                              Sin precio
                            </p>
                          )}
                        </div>
                      </div>

                      {/* La barra hace visible de un vistazo cuanto del total es
                          el tour y cuanto son entradas que nadie anuncia. */}
                      {hasPrice ? (
                        <>
                          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-sand-200">
                            <div
                              className="h-full bg-forest-700"
                              style={{ width: `${basePct}%` }}
                            />
                            <div
                              className="h-full bg-clay-600"
                              style={{ width: `${extraPct}%` }}
                            />
                          </div>
                          {/* La barra nunca carga el significado sola (§2.3). */}
                          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-soft">
                            <span>
                              <span className="font-extrabold text-forest-700">
                                {soles(est.base_pen ?? 0)}
                              </span>{" "}
                              anunciado
                            </span>
                            {est.unavoidable_pen > 0 ? (
                              <span>
                                <span className="font-extrabold text-clay-600">
                                  + {soles(est.unavoidable_pen)}
                                </span>{" "}
                                entradas obligatorias
                              </span>
                            ) : null}
                          </p>
                        </>
                      ) : null}

                      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-clay-600">
                        {isOpen ? "Ocultar detalle" : "Ver qué incluye"}
                        <ChevronDownIcon
                          size={14}
                          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </p>
                    </button>

                    {isOpen ? (
                      <div id={`plan-${plan.id}`} className="px-4 pb-4">
                        {hasPrice ? (
                          <dl className="rounded-2xl bg-sand-100 p-3 text-xs">
                            <div className="flex justify-between gap-3">
                              <dt className="text-ink-soft">Precio anunciado</dt>
                              <dd className="font-semibold text-ink">
                                {soles(est.base_pen ?? 0)}
                                {plan.currency === "USD" && plan.price_from !== null ? (
                                  <span className="ml-1 font-normal text-ink-muted">
                                    (US$ {plan.price_from})
                                  </span>
                                ) : null}
                              </dd>
                            </div>

                            {plan.extras
                              .filter((e) => e.unavoidable)
                              .map((extra) => (
                                <div
                                  key={extra.label}
                                  className="mt-1.5 flex justify-between gap-3"
                                >
                                  <dt className="flex items-start gap-1.5 text-ink-soft">
                                    <TicketIcon size={13} className="mt-px shrink-0" />
                                    {extra.label}
                                  </dt>
                                  <dd className="whitespace-nowrap font-semibold text-[var(--color-danger-text)]">
                                    + {extra.currency === "PEN" ? "S/ " : "US$ "}
                                    {extra.amount}
                                  </dd>
                                </div>
                              ))}

                            <div className="mt-2 flex justify-between gap-3 border-t border-sand-200 pt-2">
                              <dt className="font-extrabold text-ink">Total realista</dt>
                              <dd className="font-extrabold text-ink">
                                {soles(est.realistic_pen!)}
                              </dd>
                            </div>

                            {est.markup_percent !== null && est.markup_percent > 0 ? (
                              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                                Las entradas obligatorias suman un{" "}
                                <span className="font-extrabold text-ink-soft">
                                  {est.markup_percent}%
                                </span>{" "}
                                sobre el precio anunciado.
                              </p>
                            ) : null}

                            {est.optional_pen > 0 ? (
                              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                                Opcionales aparte: hasta {soles(est.optional_pen)} más.
                              </p>
                            ) : null}
                          </dl>
                        ) : (
                          <p className="rounded-2xl bg-sand-100 p-3 text-xs leading-relaxed text-ink-soft">
                            {plan.price_source}
                          </p>
                        )}

                        {plan.includes.length > 0 ? (
                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {plan.includes.map((item) => (
                              <li
                                key={item}
                                className="flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700"
                              >
                                <CheckIcon size={12} />
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {/* El angulo que ningun comparador de tours tiene. */}
                        <div
                          className={`mt-3 flex items-start gap-2 rounded-2xl p-3 ${
                            plan.wheelchair_viable === false
                              ? "bg-clay-100"
                              : "bg-forest-50"
                          }`}
                        >
                          <WheelchairIcon
                            size={16}
                            className={`mt-0.5 shrink-0 ${
                              plan.wheelchair_viable === false
                                ? "text-clay-700"
                                : "text-forest-700"
                            }`}
                          />
                          <p className="text-xs leading-relaxed text-ink-soft">
                            {plan.accessibility_note}
                          </p>
                        </div>

                        {plan.price_checked_at ? (
                          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                            Precio consultado el {plan.price_checked_at}.{" "}
                            {plan.price_source}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
        {data.exchange_note}
      </p>
    </section>
  );
}
