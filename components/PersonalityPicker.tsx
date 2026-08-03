"use client";

import {
  PERSONALITIES,
  type TravelerPersonality,
} from "@/components/travelerPersonalities";
import { CheckIcon } from "@/components/Icons";

/**
 * Selector de personalidad de viaje.
 *
 * Cada opcion lista lo que CAMBIA al elegirla. Una personalidad que solo dice
 * "Aventurero" y ajusta cosas en silencio es una caja negra; el usuario tiene
 * que poder predecir que va a pasar con su itinerario.
 *
 * Se puede deseleccionar: "ninguna" es una respuesta valida y no queremos
 * empujar a nadie a una etiqueta que no lo describe.
 */
export default function PersonalityPicker({
  value,
  onChange,
}: {
  value: TravelerPersonality | null;
  onChange: (next: TravelerPersonality | null) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {PERSONALITIES.map((p) => {
        const on = value === p.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onChange(on ? null : p.id)}
              aria-pressed={on}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${
                on ? "border-forest-700 bg-forest-50" : "border-sand-200 bg-sand-50"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  on
                    ? "border-forest-700 bg-forest-700 text-cream"
                    : "border-sand-300 text-transparent"
                }`}
              >
                <CheckIcon size={12} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block font-extrabold ${on ? "text-forest-700" : "text-ink"}`}
                >
                  {p.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                  {p.tagline}
                </span>

                {/* Solo al elegirla: en la lista cerrada seria ruido, y abierta
                    es justo lo que el usuario necesita para decidir. */}
                {on ? (
                  <ul className="mt-2 flex flex-col gap-1">
                    {p.effects.map((e) => (
                      <li
                        key={e}
                        className="flex items-start gap-1.5 text-[11px] leading-relaxed text-forest-700"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-700"
                        />
                        {e}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}

      <li>
        <p className="px-1 text-[11px] leading-relaxed text-ink-muted">
          Elegir una solo precarga tu itinerario. No cambia tus necesidades de
          accesibilidad, y todo se puede ajustar después.
        </p>
      </li>
    </ul>
  );
}
