import type { CrowdLevel, SiteWithCrowd } from "@/lib/types";

/**
 * Presentacion compartida del nivel de aforo. Vive en lib/ para que la UI, el
 * copiloto y el panel digan exactamente lo mismo.
 *
 * §2.3: el color NUNCA carga el significado solo. Por eso cada nivel trae
 * siempre su etiqueta de texto, y quien pinte un color esta obligado a poner
 * tambien el `label` al lado.
 */

export interface CrowdPresentation {
  /** Etiqueta obligatoria. Nunca mostrar el color sin esto. */
  label: string;
  /** Variable CSS con el color del nivel (definida por B en globals.css). */
  colorVar: string;
  /** Frase corta para el copiloto y los avisos. */
  advice: string;
}

const LEVELS: Record<CrowdLevel, CrowdPresentation> = {
  bajo: {
    label: "Poca gente",
    colorVar: "var(--crowd-bajo)",
    advice: "Buen momento para ir.",
  },
  medio: {
    label: "Algo concurrido",
    colorVar: "var(--crowd-medio)",
    advice: "Hay gente, pero se puede recorrer.",
  },
  alto: {
    label: "Muy congestionado",
    colorVar: "var(--crowd-alto)",
    advice: "Conviene esperar o ir a otro sitio.",
  },
};

const CLOSED: CrowdPresentation = {
  label: "Cerrado",
  colorVar: "var(--crowd-sin-datos)",
  advice: "A esta hora no atiende.",
};

const NO_DATA: CrowdPresentation = {
  label: "Sin datos",
  colorVar: "var(--crowd-sin-datos)",
  advice: "No tenemos aforo para esta hora.",
};

export function crowdPresentation(site: SiteWithCrowd): CrowdPresentation {
  if (site.crowd_closed) return CLOSED;
  if (site.crowd_level === null) return NO_DATA;
  return LEVELS[site.crowd_level];
}

export function crowdLabel(site: SiteWithCrowd): string {
  return crowdPresentation(site).label;
}

/**
 * Procedencia del dato de accesibilidad. Un sitio sin verificar tiene que
 * decirlo, no quedarse en silencio (§2.1).
 */
export function verificationLabel(site: SiteWithCrowd): string {
  if (site.verified_by === "equipo") return "Verificado por el equipo";
  if (site.verified_by === "usuario") return "Reportado por viajeros";
  return "Por verificar";
}
