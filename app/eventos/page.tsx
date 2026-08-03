import type { Metadata } from "next";
import Link from "next/link";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { AlertIcon, CalendarIcon } from "@/components/Icons";
import { getEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Calendario de Arequipa — Suyu",
  description:
    "Fiestas, temporada de lluvias y fechas que cambian cómo se visita Arequipa.",
};

/** Renderizada en el servidor: son datos locales y no hay nada que esperar. */
export default function EventosPage() {
  const events = getEvents();

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Calendario</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Fechas que cambian cómo se visita Arequipa: no solo fiestas, también la
        temporada de lluvias y los cierres.
      </p>

      <ul className="mt-5 flex flex-col gap-3">
        {events.map((e) => (
          <li
            key={e.id}
            className={`rounded-3xl border p-4 ${
              e.active_now
                ? "border-clay-600 bg-clay-50"
                : "border-sand-200 bg-sand-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold leading-tight text-ink">
                  {e.name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                  <CalendarIcon size={14} />
                  {e.window_label}
                </p>
              </div>

              {/* El estado va como texto, no como color de borde solo (§2.3). */}
              {e.active_now ? (
                <span className="shrink-0 rounded-full bg-clay-600 px-2.5 py-1 text-xs font-extrabold text-cream">
                  Ahora
                </span>
              ) : e.days_until !== null ? (
                <span className="shrink-0 rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  en {e.days_until} d
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  fecha móvil
                </span>
              )}
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {e.summary}
            </p>

            {/* El impacto es lo que decide si mueves el viaje o no; por eso va
                resaltado y no escondido al final. */}
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--color-amber-chip-bg)] p-3">
              <AlertIcon
                size={16}
                className="mt-0.5 shrink-0 text-[var(--color-amber-text)]"
              />
              <p className="text-xs leading-relaxed text-[var(--color-amber-text)]">
                {e.impact}
              </p>
            </div>

            {e.accessibility_note ? (
              <div className="mt-2 flex items-start gap-2 rounded-2xl bg-forest-50 p-3">
                <WheelchairIcon size={16} className="mt-0.5 shrink-0 text-forest-700" />
                <p className="text-xs leading-relaxed text-ink-soft">
                  {e.accessibility_note}
                </p>
              </div>
            ) : null}

            {e.related_site_id ? (
              <Link
                href={`/sitio/${e.related_site_id}`}
                className="mt-3 inline-block text-xs font-bold text-clay-600"
              >
                Ver el lugar afectado
              </Link>
            ) : null}

            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              {e.source}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded-2xl border border-sand-200 bg-sand-50 p-3 text-xs leading-relaxed text-ink-soft">
        Semana Santa es de fecha móvil y no la calculamos: confirma la del año
        en que viajes. Preferimos decirlo antes que arriesgar una fecha
        religiosa equivocada.
      </p>

      <Link
        href="/emergencias"
        className="mt-4 flex items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4"
      >
        <AlertIcon size={22} className="shrink-0 text-clay-600" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">
            ¿Y si algo se complica?
          </span>
          <span className="block text-xs text-ink-soft">
            Paros, bloqueos y a quién llamar
          </span>
        </span>
      </Link>
    </div>
  );
}
