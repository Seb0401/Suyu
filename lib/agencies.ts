import agenciesJson from "@/data/seed-agencies.json";
import type { PartnerAgency } from "@/lib/types";

/**
 * Directorio informativo de agencias reales de Arequipa (CLAUDE.md §6.10).
 *
 * Son enlaces de salida, no afiliados ni reservas. El objetivo es que el
 * turista pueda comparar el itinerario que arma Suyu contra tours que ya
 * existen, no que nos lleve una comision.
 *
 * REGLA QUE ORIGINO §2.1: no se pudo obtener una calificacion numerica
 * verificada de forma independiente (TripAdvisor y GetYourGuide bloquean el
 * scraping). En vez de inventar una cifra, reviews_note declara su propia
 * procedencia y reviews_source la clasifica.
 */

const AGENCIES = agenciesJson as PartnerAgency[];

/** Etiqueta de procedencia. Nunca devuelve cadena vacia. */
export function reviewsSourceLabel(agency: PartnerAgency): string {
  switch (agency.reviews_source) {
    case "agencia":
      return "Dato declarado por la agencia";
    case "resenas":
      return "Segun resenas publicas";
    case "premio":
      return "Distincion publica verificable";
    default:
      return "Sin evidencia suficiente";
  }
}

export interface PartnerAgencyWithLabels extends PartnerAgency {
  reviews_source_label: string;
  registry_label: string;
}

function withLabels(agency: PartnerAgency): PartnerAgencyWithLabels {
  return {
    ...agency,
    reviews_source_label: reviewsSourceLabel(agency),
    registry_label:
      agency.formalized && agency.registry_id
        ? `Registro ${agency.registry_id}`
        : "Registro por verificar",
  };
}

export function getPartnerAgencies(): PartnerAgencyWithLabels[] {
  return AGENCIES.map(withLabels);
}

export function getPartnerAgency(id: string): PartnerAgencyWithLabels | null {
  const agency = AGENCIES.find((a) => a.id === id);
  return agency ? withLabels(agency) : null;
}
