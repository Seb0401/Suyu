import type { Metadata } from "next";
import Link from "next/link";
import MonthStrip from "@/components/MonthStrip";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { AlertIcon, ArrowRightIcon, PinIcon, SunIcon } from "@/components/Icons";
import { getZones, monthRangeLabel } from "@/lib/zones";

export const metadata: Metadata = {
  title: "Cuándo ir — Suyu",
  description:
    "Mejor época para visitar cada provincia de Arequipa, según la experiencia y no solo el clima.",
};

/** Renderizada en el servidor: datos locales, nada que esperar. */
export default function CuandoIrPage() {
  const zones = getZones();
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Cuándo ir</h1>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        Arequipa casi no tiene fenómenos extremos, así que &ldquo;buen
        clima&rdquo; no distingue nada. Lo que cambia mes a mes es la
        experiencia: si se ven los volcanes, si el cóndor remonta y cuánta gente
        hay.
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {zones.map((zone) => (
          <li
            key={zone.id}
            className={`rounded-3xl border p-4 ${
              zone.current === "optimo"
                ? "border-forest-700 bg-forest-50"
                : "border-sand-200 bg-sand-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold leading-tight text-ink">
                  {zone.name}
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {zone.kind === "provincia" ? "Provincia" : "Región"} ·{" "}
                  {zone.altitude_label}
                </p>
              </div>

              {/* El estado del mes actual va como texto, no solo como color. */}
              {zone.current === "optimo" ? (
                <span className="shrink-0 rounded-full bg-forest-700 px-2.5 py-1 text-[10px] font-extrabold uppercase text-cream">
                  Ideal ahora
                </span>
              ) : zone.current === "evitar" ? (
                <span className="shrink-0 rounded-full bg-clay-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-clay-700">
                  Mala época
                </span>
              ) : zone.current === "lleno" ? (
                <span className="shrink-0 rounded-full bg-[var(--color-amber-chip-bg)] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[var(--color-amber-text)]">
                  Lleno ahora
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {zone.summary}
            </p>

            <div className="mt-3">
              <MonthStrip
                months={zone.months}
                currentMonth={currentMonth}
                withLegend={zone.id === zones[0].id}
              />
            </div>

            <div className="mt-3 rounded-2xl bg-forest-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-forest-700">
                <SunIcon size={14} />
                Mejor {monthRangeLabel(zone.sweet_spot_months)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {zone.sweet_spot_reason}
              </p>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {zone.why}
            </p>

            {zone.avoid_months.length > 0 ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-clay-50 p-3">
                <AlertIcon size={16} className="mt-0.5 shrink-0 text-clay-600" />
                <p className="text-xs leading-relaxed text-ink-soft">
                  <span className="font-extrabold">
                    Evita {monthRangeLabel(zone.avoid_months)}:{" "}
                  </span>
                  {zone.avoid_reason}
                </p>
              </div>
            ) : null}

            {zone.crowd_months.length > 0 ? (
              <p className="mt-2 rounded-2xl bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
                <span className="font-extrabold">
                  {monthRangeLabel(zone.crowd_months)}:{" "}
                </span>
                {zone.crowd_reason}
              </p>
            ) : null}

            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-sand-100 p-3">
              <WheelchairIcon size={16} className="mt-0.5 shrink-0 text-forest-700" />
              <p className="text-xs leading-relaxed text-ink-soft">
                {zone.accessibility_note}
              </p>
            </div>

            {zone.site_ids.length > 0 ? (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                <PinIcon size={13} className="shrink-0" />
                {zone.site_ids.length}{" "}
                {zone.site_ids.length === 1 ? "lugar" : "lugares"} de la app en
                esta zona
              </p>
            ) : (
              /* Se dice que la zona no tiene sitios en vez de omitirla: que
                 Cotahuasi exista y no este cubierto es informacion util. */
              <p className="mt-3 text-xs text-ink-muted">
                Todavía no tenemos lugares de esta zona en la app.
              </p>
            )}

            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              {zone.sources}
            </p>
          </li>
        ))}
      </ul>

      <Link
        href="/eventos"
        className="mt-5 flex items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">
            ¿Y las fiestas?
          </span>
          <span className="block text-xs text-ink-soft">
            El calendario con fechas que también cambian el viaje
          </span>
        </span>
        <ArrowRightIcon size={18} className="shrink-0 text-ink-muted" />
      </Link>
    </div>
  );
}
