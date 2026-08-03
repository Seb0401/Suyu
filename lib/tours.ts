import toursJson from "@/data/seed-tours.json";
import type { Currency, TourPlan } from "@/lib/types";

/**
 * Planes turisticos comparables (CLAUDE.md §6.11).
 *
 * El objetivo NO es rankear agencias por precio. Es que el turista vea que el
 * precio publicado casi nunca es lo que termina pagando: en el Colca el boleto
 * turistico son S/ 70 que ninguna agencia incluye, mas que la diferencia entre
 * un operador y otro.
 *
 * Sin tabla en Supabase: son precios curados a mano con su fecha de consulta,
 * no un catalogo que se sincronice solo.
 */

const TOURS = toursJson as TourPlan[];

/**
 * Tipo de cambio de referencia para poder sumar dolares y soles en el mismo
 * total. Es un valor fijo y declarado, NO una cotizacion del dia: la app no
 * consulta ninguna API de divisas todavia, y presentar un total como si
 * estuviera al tipo de cambio de hoy seria inventar precision.
 */
export const USD_TO_PEN_REFERENCE = 3.75;
export const USD_REFERENCE_NOTE =
  "Convertido a un tipo de cambio de referencia de S/ 3.75 por dólar. No es la cotización del día.";

export function toPen(amount: number, currency: Currency): number {
  return currency === "PEN" ? amount : amount * USD_TO_PEN_REFERENCE;
}

export interface TourEstimate {
  /** Precio publicado, en soles de referencia. null si la agencia no publica. */
  base_pen: number | null;
  /** Suma de los extras que practicamente nadie puede evitar. */
  unavoidable_pen: number;
  /** Suma de los extras opcionales. */
  optional_pen: number;
  /** base + inevitables. Lo que realmente cuesta entrar. null si no hay base. */
  realistic_pen: number | null;
  /** Cuanto sube el precio publicado por culpa de lo inevitable, en %. */
  markup_percent: number | null;
}

export function estimate(plan: TourPlan): TourEstimate {
  const base_pen =
    plan.price_from === null ? null : toPen(plan.price_from, plan.currency);

  const sum = (unavoidable: boolean) =>
    plan.extras
      .filter((e) => e.unavoidable === unavoidable)
      .reduce((acc, e) => acc + toPen(e.amount, e.currency), 0);

  const unavoidable_pen = sum(true);
  const optional_pen = sum(false);
  const realistic_pen = base_pen === null ? null : base_pen + unavoidable_pen;

  return {
    base_pen,
    unavoidable_pen,
    optional_pen,
    realistic_pen,
    markup_percent:
      base_pen === null || base_pen === 0
        ? null
        : Math.round((unavoidable_pen / base_pen) * 100),
  };
}

export interface TourPlanWithEstimate extends TourPlan {
  estimate: TourEstimate;
}

export interface TourGroup {
  destination: string;
  plans: TourPlanWithEstimate[];
}

/**
 * Planes agrupados por destino, que es lo unico comparable entre si. Comparar
 * el precio de un city tour de 4 horas contra un Colca de 2 dias no dice nada.
 */
export function getTourGroups(options: { destination?: string } = {}): TourGroup[] {
  const plans = TOURS.filter(
    (p) => !options.destination || p.destination === options.destination,
  ).map((plan) => ({ ...plan, estimate: estimate(plan) }));

  const groups = new Map<string, TourPlanWithEstimate[]>();
  for (const plan of plans) {
    const list = groups.get(plan.destination) ?? [];
    list.push(plan);
    groups.set(plan.destination, list);
  }

  return [...groups.entries()].map(([destination, list]) => ({
    destination,
    // Los que publican precio primero, y de menor a mayor. Un plan sin precio
    // no se puede comparar, asi que va al final en vez de ensuciar el orden.
    plans: list.sort((a, b) => {
      const av = a.estimate.realistic_pen;
      const bv = b.estimate.realistic_pen;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av - bv;
    }),
  }));
}

export function getTourPlans(): TourPlanWithEstimate[] {
  return TOURS.map((plan) => ({ ...plan, estimate: estimate(plan) }));
}
