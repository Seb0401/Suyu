import type { PassportTier } from "@/lib/types";

/**
 * Presentacion de niveles del Pasaporte Arequipeño (§6.11), calculados contra
 * los 6 sitios semilla. Mismo patron que lib/crowdUi.ts: una tabla de
 * presentacion + una funcion pura que resuelve el estado a partir del dato.
 *
 * Los 4 niveles (Descubridor/Explorador/Conocedor/Maestro, en bronce/cobre/
 * plata/oro) siguen el sistema de medallas de la referencia visual del
 * equipo — cada nivel es un material distinto, no solo una etiqueta.
 *
 * Los beneficios son simulados a proposito (§2.1): el usuario decidio que el
 * sistema de niveles funcione completo pero el descuento todavia no sea un
 * codigo canjeable real. `benefitIsSimulated` siempre es true hoy; cuando
 * exista un descuento real se resuelve por (user_id, tier) en una tabla
 * nueva (ver el comentario al final de supabase/schema.sql), no aca.
 */

export interface PassportTierPresentation {
  tier: PassportTier;
  label: string;
  /** Nombre del material de la medalla, para mostrarlo junto al nivel. */
  metalLabel: string;
  metalFrom: string;
  metalTo: string;
  /** Tono del icono/puntos sobre la medalla: metales claros (plata, oro)
   *  necesitan un icono oscuro para leerse; los oscuros (bronce, cobre) uno
   *  claro. Nunca es solo el color del metal el que decide el contraste. */
  iconTone: "light" | "dark";
  benefit: string;
  benefitIsSimulated: boolean;
  minStamps: number;
}

const TIERS: PassportTierPresentation[] = [
  {
    tier: "descubridor",
    label: "Descubridor",
    metalLabel: "Bronce",
    metalFrom: "var(--metal-bronze-from)",
    metalTo: "var(--metal-bronze-to)",
    iconTone: "light",
    benefit: "Haz tu primer check-in para desbloquear tu primer beneficio.",
    benefitIsSimulated: true,
    minStamps: 0,
  },
  {
    tier: "explorador",
    label: "Explorador",
    metalLabel: "Cobre",
    metalFrom: "var(--metal-copper-from)",
    metalTo: "var(--metal-copper-to)",
    iconTone: "light",
    benefit:
      "10% de descuento en una tienda de artesanía aliada (simulado — todavía no es un código real).",
    benefitIsSimulated: true,
    minStamps: 2,
  },
  {
    tier: "conocedor",
    label: "Conocedor",
    metalLabel: "Plata",
    metalFrom: "var(--metal-silver-from)",
    metalTo: "var(--metal-silver-to)",
    iconTone: "dark",
    benefit:
      "15% de descuento en un tour con una agencia aliada (simulado — todavía no es un código real).",
    benefitIsSimulated: true,
    minStamps: 4,
  },
  {
    tier: "maestro",
    label: "Maestro",
    metalLabel: "Oro",
    metalFrom: "var(--metal-gold-from)",
    metalTo: "var(--metal-gold-to)",
    iconTone: "dark",
    benefit:
      "20% de descuento + reconocimiento como Maestro Suyu (simulado — todavía no es un código real).",
    benefitIsSimulated: true,
    minStamps: 6,
  },
];

export function passportPresentation(
  stampsCount: number,
  totalSites: number,
): PassportTierPresentation & { stampsCount: number; totalSites: number; nextTierAt: number | null } {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (stampsCount >= tier.minStamps) current = tier;
  }

  const nextTier = TIERS.find((tier) => tier.minStamps > stampsCount);

  return {
    ...current,
    stampsCount,
    totalSites,
    nextTierAt: nextTier ? nextTier.minStamps : null,
  };
}
