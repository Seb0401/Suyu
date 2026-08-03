import { MONTH_NAMES, MONTH_SHORT, type MonthStatus } from "@/lib/zones";

/**
 * Tira de 12 meses.
 *
 * El color NUNCA carga el significado solo (§2.3): cada mes lleva su inicial
 * visible, el mes en curso va marcado con un anillo y no solo con tono, y cada
 * celda expone su estado en texto al lector de pantalla. La leyenda de abajo
 * cierra el circulo para quien no distingue los tonos.
 */

const STYLE: Record<MonthStatus, { bg: string; fg: string; label: string }> = {
  optimo: {
    bg: "var(--color-forest-700)",
    fg: "var(--color-cream)",
    label: "óptimo",
  },
  bueno: {
    bg: "var(--color-forest-100)",
    fg: "var(--color-forest-700)",
    label: "buena época",
  },
  lleno: {
    bg: "var(--color-amber-chip-bg)",
    fg: "var(--color-amber-text)",
    label: "buena época pero con mucha gente",
  },
  evitar: {
    bg: "var(--color-clay-100)",
    fg: "var(--color-clay-700)",
    label: "mejor evitar",
  },
  regular: {
    bg: "var(--color-sand-200)",
    fg: "var(--color-ink-muted)",
    label: "sin recomendación especial",
  },
};

const LEGEND: MonthStatus[] = ["optimo", "bueno", "lleno", "evitar"];

export default function MonthStrip({
  months,
  currentMonth,
  withLegend = false,
}: {
  months: MonthStatus[];
  currentMonth: number;
  withLegend?: boolean;
}) {
  return (
    <div>
      <ul className="flex gap-1">
        {months.map((status, i) => {
          const { bg, fg, label } = STYLE[status];
          const isCurrent = i + 1 === currentMonth;
          return (
            <li key={i} className="min-w-0 flex-1">
              <span
                className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                  isCurrent ? "ring-2 ring-clay-600 ring-offset-1" : ""
                }`}
                style={{ background: bg, color: fg }}
              >
                <span aria-hidden>{MONTH_SHORT[i]}</span>
                <span className="sr-only">
                  {MONTH_NAMES[i]}: {label}
                  {isCurrent ? " (mes actual)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {withLegend ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {LEGEND.map((status) => (
            <li
              key={status}
              className="flex items-center gap-1.5 text-[11px] text-ink-soft"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: STYLE[status].bg }}
              />
              {STYLE[status].label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
