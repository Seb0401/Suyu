import eventsJson from "@/data/seed-events.json";

/**
 * Calendario de Arequipa (Fase 2).
 *
 * No son solo fiestas: tambien entran la temporada de lluvias y la ventana en
 * que Juanita no esta a la vista. Lo que define si algo entra aqui no es que
 * sea una celebracion, es que CAMBIE la decision de cuando viajar.
 *
 * Todo con fecha fija salvo Semana Santa, que es movil y se declara como tal
 * en vez de calcularse: el algoritmo de Pascua es facil de equivocar y una
 * fecha religiosa mal puesta en una app de turismo se nota.
 */

export interface TourismEvent {
  id: string;
  name: string;
  start_month: number | null;
  start_day: number | null;
  end_month: number | null;
  end_day: number | null;
  peak_label: string;
  summary: string;
  impact: string;
  accessibility_note: string;
  fixed_date: boolean;
  source: string;
  related_site_id?: string;
}

export interface EventWithStatus extends TourismEvent {
  /** true si hoy cae dentro del rango. */
  active_now: boolean;
  /** Dias hasta que empieza. null si es movil o si ya esta activo. */
  days_until: number | null;
  window_label: string;
}

const EVENTS = eventsJson as TourismEvent[];

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function windowLabel(e: TourismEvent): string {
  if (!e.fixed_date || e.start_month === null) return e.peak_label;
  const from = `${e.start_day} de ${MONTHS[e.start_month - 1]}`;
  const to = `${e.end_day} de ${MONTHS[(e.end_month ?? e.start_month) - 1]}`;
  return from === to ? from : `${from} al ${to}`;
}

function statusFor(e: TourismEvent, today: Date): Pick<EventWithStatus, "active_now" | "days_until"> {
  if (!e.fixed_date || e.start_month === null || e.end_month === null) {
    return { active_now: false, days_until: null };
  }

  const year = today.getFullYear();
  const start = new Date(year, e.start_month - 1, e.start_day ?? 1);
  const end = new Date(year, e.end_month - 1, e.end_day ?? 28, 23, 59);

  if (today >= start && today <= end) return { active_now: true, days_until: 0 };

  // Si ya paso este ano, se mide contra el del ano que viene: "faltan 300
  // dias" es mas util que un numero negativo.
  const next = today > end ? new Date(year + 1, e.start_month - 1, e.start_day ?? 1) : start;
  const days = Math.ceil((next.getTime() - today.getTime()) / 86400000);

  return { active_now: false, days_until: days };
}

export function getEvents(today: Date = new Date()): EventWithStatus[] {
  return EVENTS.map((e) => ({
    ...e,
    ...statusFor(e, today),
    window_label: windowLabel(e),
  })).sort((a, b) => {
    // Primero lo que esta pasando ahora, despues lo mas proximo, y las fechas
    // moviles al final porque no se pueden ordenar contra un numero.
    if (a.active_now !== b.active_now) return a.active_now ? -1 : 1;
    if (a.days_until === null) return 1;
    if (b.days_until === null) return -1;
    return a.days_until - b.days_until;
  });
}

/** Eventos activos hoy o dentro de la ventana dada. Para avisos contextuales. */
export function getUpcomingEvents(
  withinDays = 30,
  today: Date = new Date(),
): EventWithStatus[] {
  return getEvents(today).filter(
    (e) => e.active_now || (e.days_until !== null && e.days_until <= withinDays),
  );
}
