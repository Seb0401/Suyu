"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import type { TranslationKey } from "@/components/i18n/dictionary";

/**
 * Aforo por hora de un sitio.
 *
 * La ALTURA DE BARRA es la codificacion primaria; el color solo refuerza
 * (§2.3, §6.3). No es una preferencia de estilo: el validador de paletas marca
 * el ambar --crowd-medio en 2.09:1 contra la superficie de tarjeta, por debajo
 * del minimo de 3:1. Ese aviso se salda con altura + etiqueta de texto + la
 * vista de tabla, que por eso no es opcional.
 *
 * Solo se etiqueta directamente la hora tranquila: poner el numero sobre las 24
 * barras convierte el grafico en una tabla mal maquetada.
 */

const CLOSED_STUB_PX = 3;

/* Devuelve la CLAVE del diccionario, no el texto: es una funcion de modulo y no
   puede llamar al hook de traduccion. */
function levelOf(occupancy: number): { key: TranslationKey; color: string } {
  if (occupancy === 0) return { key: "crowd.cerrado", color: "var(--crowd-sin-datos)" };
  if (occupancy >= 70) return { key: "crowd.alto", color: "var(--crowd-alto)" };
  if (occupancy >= 40) return { key: "crowd.medio", color: "var(--crowd-medio)" };
  return { key: "crowd.bajo", color: "var(--crowd-bajo)" };
}

const LEGEND: { key: TranslationKey; color: string }[] = [
  { key: "crowd.bajo", color: "var(--crowd-bajo)" },
  { key: "crowd.medio", color: "var(--crowd-medio)" },
  { key: "crowd.alto", color: "var(--crowd-alto)" },
  { key: "crowd.cerrado", color: "var(--crowd-sin-datos)" },
];

function hhmm(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function CrowdChart({
  profile,
  currentHour,
  quietHour,
  className = "",
}: {
  profile: number[];
  currentHour?: number;
  quietHour?: number | null;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const t = useT();

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-extrabold text-ink">{t("crowd.gentePorHora")}</h3>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="rounded-full border border-sand-200 px-3 py-1 text-xs font-bold text-ink-soft"
        >
          {showTable ? t("crowd.verGrafico") : t("crowd.verTabla")}
        </button>
      </div>

      {showTable ? (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">{t("crowd.ocupacion")}</caption>
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-muted">
              <th scope="col" className="py-1">{t("crowd.hora")}</th>
              <th scope="col" className="py-1">{t("crowd.ocupacion")}</th>
              <th scope="col" className="py-1">{t("crowd.nivel")}</th>
            </tr>
          </thead>
          <tbody>
            {profile.map((occ, h) => (
              <tr key={h} className="border-t border-sand-200">
                <td className="py-1 font-semibold text-ink">{hhmm(h)}</td>
                <td className="py-1 text-ink-soft">{occ}%</td>
                <td className="py-1 text-ink-soft">{t(levelOf(occ).key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className="relative mt-4 h-40">
            {/* Grilla recesiva: referencia sin competir con las barras. */}
            {[0, 25, 50, 75, 100].map((tick) => (
              <span
                key={tick}
                aria-hidden
                className="absolute inset-x-0 border-t"
                style={{ bottom: `${tick}%`, borderColor: "var(--viz-grid)" }}
              />
            ))}

            <ol className="absolute inset-0 flex items-end gap-[2px]">
              {profile.map((occ, h) => {
                const { key: levelKey, color } = levelOf(occ);
                const label = t(levelKey);
                const isNow = currentHour === h;
                const isQuiet = quietHour === h;

                return (
                  <li key={h} className="group relative flex h-full flex-1 items-end">
                    <span
                      tabIndex={0}
                      role="img"
                      aria-label={`${hhmm(h)}: ${occ}% de ocupación, ${label}`}
                      className="w-full rounded-t-[4px] transition-opacity focus-visible:opacity-80"
                      style={{
                        height: occ === 0 ? `${CLOSED_STUB_PX}px` : `${occ}%`,
                        background: color,
                        /* Marcar "ahora" con un anillo, no con otro color: el
                           color ya esta ocupado indicando el nivel de aforo. */
                        outline: isNow ? "2px solid var(--color-ink)" : undefined,
                        outlineOffset: isNow ? "1px" : undefined,
                      }}
                    />

                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--color-scrim)] px-2 py-1 text-[11px] font-semibold text-cream group-hover:block group-focus-within:block">
                      {hhmm(h)} · {occ}% · {label}
                    </span>

                    {isQuiet ? (
                      <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-forest-700 px-1.5 py-0.5 text-[10px] font-bold text-cream">
                        {hhmm(h)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-[var(--viz-ink-muted)]">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {LEGEND.map(({ key, color }) => (
              <li key={key} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                {t(key)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
