import { NO_RATING_LABEL, RATING_LABEL } from "@/lib/accessibility";
import type { AccessibilityRating } from "@/lib/types";

/**
 * Estado de un servicio de accesibilidad, en escala 1-3.
 *
 * Los tres bloques son la codificacion primaria y la etiqueta de texto siempre
 * acompaña (§2.3). "Sin dato" no dibuja ningun bloque lleno: dejarlo en uno
 * solo lo haria leer como "deficiente", y no saber no es lo mismo que estar mal.
 */

const TONE: Record<AccessibilityRating, { fill: string; text: string }> = {
  1: { fill: "var(--crowd-alto)", text: "text-[var(--color-danger-text)]" },
  2: { fill: "var(--crowd-medio)", text: "text-[var(--color-amber-text)]" },
  3: { fill: "var(--crowd-bajo)", text: "text-forest-700" },
};

export default function RatingBar({
  rating,
  className = "",
}: {
  rating: AccessibilityRating | null;
  className?: string;
}) {
  const tone = rating ? TONE[rating] : null;
  const label = rating ? `${rating} de 3 · ${RATING_LABEL[rating]}` : NO_RATING_LABEL;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className="h-2.5 w-4 rounded-sm border border-sand-300"
            style={{
              background: rating && step <= rating ? tone?.fill : "transparent",
            }}
          />
        ))}
      </span>
      <span className={`text-xs font-bold ${tone ? tone.text : "text-ink-muted"}`}>{label}</span>
    </span>
  );
}
