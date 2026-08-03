"use client";

import { useEffect, useState } from "react";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { CheckIcon, ClockIcon, TicketIcon } from "@/components/Icons";
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
    return <div className="h-48 animate-pulse rounded-3xl bg-sand-200" aria-hidden />;
  }

  return (
    <section>
      <h2 className="text-lg font-extrabold text-ink">Compara planes</h2>
      <p className="mt-1 text-sm text-ink-soft">
        El precio que ves anunciado casi nunca es el que pagas. Esto suma lo que
        no viene incluido.
      </p>

      <p className="mt-3 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
        {data.disclaimer}
      </p>

      {data.groups.map((group) => (
        <div key={group.destination} className="mt-5">
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            {group.destination}
          </h3>

          <ul className="flex flex-col gap-3">
            {group.plans.map((plan) => (
              <li
                key={plan.id}
                className="rounded-3xl border border-sand-200 bg-sand-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold leading-tight text-ink">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-ink-muted">{plan.agency_name}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    {plan.estimate.realistic_pen !== null ? (
                      <>
                        <p className="text-xl font-extrabold leading-none text-ink">
                          {soles(plan.estimate.realistic_pen)}
                        </p>
                        <p className="text-[11px] leading-tight text-ink-muted">
                          total realista
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-ink-muted">
                        Sin precio publicado
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                  <ClockIcon size={14} />
                  {plan.duration_label}
                </p>

                {/* El desglose es el punto de la pantalla: el precio anunciado
                    arriba y, debajo, lo que le falta para ser el precio real. */}
                {plan.estimate.base_pen !== null ? (
                  <dl className="mt-3 rounded-2xl bg-sand-100 p-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-soft">Precio anunciado</dt>
                      <dd className="font-semibold text-ink">
                        {soles(plan.estimate.base_pen)}
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
                        {soles(plan.estimate.realistic_pen ?? 0)}
                      </dd>
                    </div>

                    {plan.estimate.markup_percent !== null &&
                    plan.estimate.markup_percent > 0 ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                        Las entradas obligatorias suman un{" "}
                        <span className="font-extrabold text-ink-soft">
                          {plan.estimate.markup_percent}%
                        </span>{" "}
                        sobre el precio anunciado.
                      </p>
                    ) : null}

                    {plan.estimate.optional_pen > 0 ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                        Opcionales aparte: hasta{" "}
                        {soles(plan.estimate.optional_pen)} más.
                      </p>
                    ) : null}
                  </dl>
                ) : (
                  <p className="mt-3 rounded-2xl bg-sand-100 p-3 text-xs leading-relaxed text-ink-soft">
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
                      ? "bg-clay-50"
                      : "bg-forest-50"
                  }`}
                >
                  <WheelchairIcon
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      plan.wheelchair_viable === false
                        ? "text-[var(--color-danger-text)]"
                        : "text-forest-700"
                    }`}
                  />
                  <p className="text-xs leading-relaxed text-ink-soft">
                    {plan.accessibility_note}
                  </p>
                </div>

                {plan.price_checked_at ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                    Precio consultado el {plan.price_checked_at}. {plan.price_source}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
        {data.exchange_note}
      </p>
    </section>
  );
}
