"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, ClockIcon, SparkIcon } from "@/components/Icons";
import type { SiteDetail } from "@/lib/types";

/**
 * Ficha tecnica curada del sitio (§6.8).
 *
 * Se monta como isla independiente: si /api/site-details falla o el sitio no
 * tiene ficha, la seccion simplemente no aparece. Un dato editorial que falta
 * no puede tumbar la pantalla que dice si hay rampa.
 */
export default function SiteDetailSection({ siteId }: { siteId: string }) {
  const [detail, setDetail] = useState<SiteDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/site-details?site=${siteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setDetail(d?.detail ?? null))
      .catch(() => {
        /* Sin ficha no hay seccion. No es un error que el usuario deba ver. */
      });
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  if (!detail) return null;

  return (
    <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <h2 className="font-extrabold text-ink">Conoce más</h2>

      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {detail.history}
      </p>

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-clay-50 p-3">
        <SparkIcon size={18} className="mt-0.5 shrink-0 text-clay-600" />
        <p className="text-sm leading-relaxed text-ink">{detail.curiosity}</p>
      </div>

      <dl className="mt-3 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <CalendarIcon size={16} className="mt-0.5 shrink-0 text-forest-700" />
          <div className="min-w-0">
            <dt className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
              Mejor momento
            </dt>
            <dd className="text-sm leading-relaxed text-ink-soft">
              {detail.best_time}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <ClockIcon size={16} className="mt-0.5 shrink-0 text-forest-700" />
          <div className="min-w-0">
            <dt className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">
              Tiempo recomendado
            </dt>
            <dd className="text-sm text-ink-soft">
              {detail.recommended_visit_minutes} minutos
              {/* Es el mismo numero que usa el planificador de itinerario, no
                  una estimacion aparte: si aqui dice 90 min, el plan del dia
                  reserva 90 min. */}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
