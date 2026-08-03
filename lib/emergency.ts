import emergencyJson from "@/data/seed-emergency.json";
import type { Contingency, EmergencyLine } from "@/lib/types";

/**
 * Emergencias y contingencias (Fase 2).
 *
 * Todo local, sin red y sin Supabase, y es deliberado: es la unica pantalla de
 * la app que alguien va a abrir cuando algo salio mal, y ahi puede no haber
 * senal. Un numero de emergencia que depende de una consulta no sirve.
 *
 * No hay feed en vivo de paros ni bloqueos. Se explica el escenario y a quien
 * llamar; fingir un "estado de las vias en tiempo real" seria el peor dato
 * falso posible, porque alguien decidiria si salir a la carretera con el.
 */

const DATA = emergencyJson as {
  lines: EmergencyLine[];
  contingencies: Contingency[];
};

/** Ordenadas por prioridad: primero lo que se marca cuando algo pasa ya. */
export function getEmergencyLines(): EmergencyLine[] {
  return [...DATA.lines].sort((a, b) => a.priority - b.priority);
}

export function getContingencies(): Contingency[] {
  // Las de severidad alta primero: el paro del Colca y el mal de altura son
  // las que de verdad arruinan o ponen en riesgo un viaje.
  const weight = { alta: 0, media: 1 } as const;
  return [...DATA.contingencies].sort(
    (a, b) => weight[a.severity] - weight[b.severity],
  );
}

/** Numero que se marca sin pensar. Se expone aparte para el acceso rapido. */
export const PRIMARY_LINE = DATA.lines.find((l) => l.id === "policia")!;
