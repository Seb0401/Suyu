import type { Metadata } from "next";
import AgencyList from "@/components/AgencyList";
import TourComparison from "@/components/TourComparison";

export const metadata: Metadata = {
  title: "Tours y agencias — Suyu",
  description:
    "Compara planes turísticos de Arequipa con sus costos reales y mira quién los opera.",
};

export default function AgenciasPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Tours y agencias</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Compara planes turísticos y mira quién los opera.
      </p>

      {/* La comparacion va PRIMERO. El turista llega preguntando "cuanto me
          cuesta el Colca", no "que agencias existen". */}
      <div className="mt-5">
        <TourComparison />
      </div>

      <h2 className="mt-8 text-lg font-extrabold text-ink">Quién los opera</h2>
      <p className="mt-1 mb-3 text-sm text-ink-soft">
        Toca una agencia para ver su ficha.
      </p>

      <AgencyList />
    </div>
  );
}
