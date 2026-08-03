import type { ServiceDetails } from "@/lib/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: "Fácil",
  moderado: "Moderado",
  exigente: "Exigente",
};

/**
 * Chips con el detalle que solo aplica a algunas categorias.
 *
 * Las estrellas se escriben como texto ("4 estrellas declaradas"), NO como
 * simbolos: un hotel con cuatro estrellas dibujadas se lee como una
 * calificacion de calidad, y esto es solo la categoria que el propio
 * establecimiento declara. La misma regla que impide poner estrellas a las
 * agencias (§6.10).
 */
export default function ServiceDetailChips({
  details,
  className = "",
}: {
  details?: ServiceDetails;
  className?: string;
}) {
  if (!details) return null;

  const chips: string[] = [];

  if (typeof details.stars === "number") {
    chips.push(`${details.stars} estrellas declaradas`);
  }
  if (details.cuisine) chips.push(details.cuisine);
  if (details.activity) chips.push(details.activity);
  if (details.difficulty) chips.push(DIFFICULTY_LABEL[details.difficulty]);
  if (typeof details.duration_hours === "number") {
    chips.push(
      details.duration_hours >= 24
        ? `${Math.round(details.duration_hours / 24)} días`
        : `${details.duration_hours} h`,
    );
  }

  const lines: { label: string; value: string }[] = [];
  if (details.signature_dish) {
    lines.push({ label: "Pide", value: details.signature_dish });
  }
  if (details.destinations?.length) {
    lines.push({ label: "Va a", value: details.destinations.join(" · ") });
  }
  if (details.schedule) lines.push({ label: "Horario", value: details.schedule });
  if (details.reference_fare) {
    lines.push({ label: "Precio de referencia", value: details.reference_fare });
  }
  if (details.best_months) {
    lines.push({ label: "Mejor época", value: details.best_months });
  }

  if (chips.length === 0 && lines.length === 0 && !details.requirements) {
    return null;
  }

  return (
    <div className={className}>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-soft"
            >
              {chip}
            </li>
          ))}
        </ul>
      ) : null}

      {lines.length > 0 ? (
        <dl className="mt-2 flex flex-col gap-1">
          {lines.map(({ label, value }) => (
            <div key={label} className="text-xs leading-relaxed">
              <dt className="inline font-extrabold text-ink-muted">{label}: </dt>
              <dd className="inline text-ink-soft">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* Los requisitos van aparte y con fondo propio: "saber nadar" o "dos dias
          de aclimatacion" no son un adorno mas de la ficha, son la diferencia
          entre poder hacer la actividad o no. */}
      {details.requirements ? (
        <p className="mt-2 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-2.5 text-xs leading-relaxed text-[var(--color-amber-text)]">
          <span className="font-extrabold">Requisitos: </span>
          {details.requirements}
        </p>
      ) : null}
    </div>
  );
}
