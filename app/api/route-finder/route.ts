import { NextResponse } from "next/server";
import { antiCrowdAdvice } from "@/lib/crowd";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import {
  accessibilityMilestones,
  routeAccessibilityScore,
} from "@/lib/filters";
import { isWalkable, walkingRoute } from "@/lib/geo";
import { getSites } from "@/lib/sites";

/**
 * GET /api/route-finder?origin=<id>&destination=<id>&accessible=true&hour=<0-23>
 *
 * Con token de Mapbox devuelve la ruta peatonal real; sin el, linea recta con
 * approximate: true. La forma de la respuesta es la misma en ambos casos, para
 * que la UI no tenga dos caminos (§6.5).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originId = searchParams.get("origin");
  const destinationId = searchParams.get("destination");
  const accessibleFilter = searchParams.get("accessible") === "true";
  const hour = normalizeHour(searchParams.get("hour")) ?? currentHourInArequipa();

  if (!originId || !destinationId) {
    return NextResponse.json(
      { error: "Faltan los parametros origin y destination." },
      { status: 400 },
    );
  }

  const { sites } = await getSites(hour);
  const origin = sites.find((site) => site.id === originId);
  const destination = sites.find((site) => site.id === destinationId);

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Sitio de origen o destino desconocido." },
      { status: 404 },
    );
  }

  const route = await walkingRoute(origin, destination);

  // El aviso se calcula sobre el DESTINO: de nada sirve avisar que el punto de
  // partida esta lleno cuando el turista ya se esta yendo de ahi.
  const advice = antiCrowdAdvice(destination, sites, hour, {
    accessibleOnly: accessibleFilter,
  });

  return NextResponse.json({
    ...route,
    walkable: isWalkable(route.distance_m),
    accessibility_score: routeAccessibilityScore(origin, destination),
    milestones: accessibilityMilestones(origin, destination),
    accessible_filter: accessibleFilter,
    origin,
    destination,
    hour,
    saturated: advice.saturated,
    alternative: advice.alternative,
    quiet_hour: advice.quiet_hour,
  });
}
