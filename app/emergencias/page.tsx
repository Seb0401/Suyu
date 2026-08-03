import type { Metadata } from "next";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { AlertIcon, PhoneIcon } from "@/components/Icons";
import { getContingencies, getEmergencyLines } from "@/lib/emergency";

export const metadata: Metadata = {
  title: "Emergencias — Suyu",
  description:
    "Números de emergencia en Arequipa y qué hacer ante paros, bloqueos y mal de altura.",
};

/**
 * Emergencias.
 *
 * Renderizada en el SERVIDOR, sin fetch del cliente y sin estado de carga: es
 * la unica pantalla que alguien abre cuando algo ya salio mal, y ahi puede no
 * haber senal ni paciencia para un esqueleto girando. Los datos son locales,
 * asi que el HTML sale completo de una.
 */
export default function EmergenciasPage() {
  const lines = getEmergencyLines();
  const contingencies = getContingencies();

  const urgent = lines.filter((l) => l.priority === 1);
  const support = lines.filter((l) => l.priority > 1);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Emergencias</h1>
      <p className="mt-1 text-sm text-ink-soft">
        A quién llamar y qué hacer si algo sale mal.
      </p>

      {/* Los tres numeros que se marcan sin pensar, arriba y grandes. En una
          emergencia nadie desplaza buscando. */}
      <ul className="mt-5 flex flex-col gap-2">
        {urgent.map((line) => (
          <li key={line.id}>
            <a
              href={`tel:${line.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-4 rounded-3xl border-2 border-clay-600 bg-clay-50 p-4"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-clay-600 text-cream">
                <PhoneIcon size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-2xl font-extrabold leading-none text-clay-700">
                  {line.phone}
                </span>
                <span className="mt-1 block font-bold text-ink">{line.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  {line.when}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-7 font-extrabold text-ink">Asistencia al turista</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {support.map((line) => (
          <li
            key={line.id}
            className="rounded-3xl border border-sand-200 bg-sand-50 p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold text-ink">{line.name}</h3>
              <a
                href={`tel:${line.phone.replace(/\s/g, "")}`}
                className="shrink-0 whitespace-nowrap rounded-full bg-night-800 px-3 py-1.5 text-sm font-extrabold text-cream"
              >
                {line.phone}
              </a>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              {line.when}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="mt-7 font-extrabold text-ink">Si algo se complica</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Los imprevistos más comunes en Arequipa y el Colca, y qué hacer en cada
        uno.
      </p>

      <ul className="mt-3 flex flex-col gap-3">
        {contingencies.map((c) => (
          <li
            key={c.id}
            className="rounded-3xl border border-sand-200 bg-sand-50 p-4"
          >
            <div className="flex items-start gap-2.5">
              <AlertIcon
                size={20}
                className={`mt-0.5 shrink-0 ${
                  c.severity === "alta"
                    ? "text-[var(--color-danger-text)]"
                    : "text-[var(--color-amber-text)]"
                }`}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold leading-tight text-ink">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {c.summary}
                </p>
              </div>
            </div>

            <ol className="mt-3 flex flex-col gap-2">
              {c.what_to_do.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-100 text-[11px] font-extrabold text-forest-700">
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-ink-soft">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            {/* El angulo del proyecto: un bloqueo que se resuelve caminando
                kilometros no se resuelve para todo el mundo. */}
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-clay-50 p-3">
              <WheelchairIcon
                size={16}
                className="mt-0.5 shrink-0 text-clay-600"
              />
              <p className="text-xs leading-relaxed text-ink-soft">
                {c.accessibility_note}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
        No mostramos el estado de las vías en tiempo real porque no tenemos una
        fuente confiable para eso. Antes de salir a carretera, confirma con
        iPerú o con tu hotel.
      </p>
    </div>
  );
}
