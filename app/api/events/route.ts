import { NextResponse } from "next/server";
import { getEvents, getUpcomingEvents } from "@/lib/events";

/**
 * GET /api/events?upcoming=<dias>
 *
 * Sin parametros devuelve el calendario completo, ordenado por cercania.
 * Con `upcoming` filtra a lo que esta pasando o esta por pasar.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upcoming = Number(searchParams.get("upcoming"));

  const events =
    Number.isFinite(upcoming) && upcoming > 0
      ? getUpcomingEvents(upcoming)
      : getEvents();

  return NextResponse.json({
    events,
    notice:
      "Fechas basadas en el calendario festivo de Arequipa. Semana Santa es móvil: confirma la fecha del año en que viajes.",
  });
}
