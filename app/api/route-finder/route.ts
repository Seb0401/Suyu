import { NextResponse } from "next/server";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import {
  accessibilityMilestones,
  routeAccessibilityScore,
} from "@/lib/filters";
import { isWalkable, walkingRoute } from "@/lib/geo";
import { getSite } from "@/lib/sites";

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

  const [origin, destination] = await Promise.all([
    getSite(originId, hour),
    getSite(destinationId, hour),
  ]);

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Sitio de origen o destino desconocido." },
      { status: 404 },
    );
  }

  const route = await walkingRoute(origin, destination);

  return NextResponse.json({
    ...route,
    walkable: isWalkable(route.distance_m),
    accessibility_score: routeAccessibilityScore(origin, destination),
    milestones: accessibilityMilestones(origin, destination),
    accessible_filter: accessibleFilter,
    origin,
    destination,
    hour,
    // A4 los llena; el contrato ya los declara para que B maquete contra ellos.
    alternative: null,
    quiet_hour: null,
  });
}
