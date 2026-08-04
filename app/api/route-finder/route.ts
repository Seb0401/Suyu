import { NextResponse } from "next/server";
import { antiCrowdAdvice } from "@/lib/crowd";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import {
  accessibilityMilestones,
  accessibilityScore,
  routeAccessibilityScore,
} from "@/lib/filters";
import { isWalkable, walkingRoute } from "@/lib/geo";
import { getSites } from "@/lib/sites";

/** Id reservado para el punto de partida del propio usuario. */
export const USER_LOCATION_ID = "__mi-ubicacion__";

/** Caja aproximada de la region de Arequipa. Fuera de aqui la ruta no aplica. */
const AREQUIPA_BOUNDS = { minLat: -17.2, maxLat: -15.2, minLng: -73.5, maxLng: -70.8 };

function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/**
 * GET /api/route-finder?origin=<id>&destination=<id>&accessible=true&hour=<0-23>
 *
 * El origen tambien puede ser la ubicacion del usuario:
 *   origin=__mi-ubicacion__&origin_lat=<lat>&origin_lng=<lng>
 *
 * Con ORS_API_KEY devuelve la ruta peatonal real (perfil `wheelchair` si
 * accessible=true); sin ella, linea recta con approximate: true. La forma de
 * la respuesta es la misma en ambos casos, para que la UI no tenga dos
 * caminos (§6.5). `profile` dice con que motor se trazo de verdad.
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
  const destination = sites.find((site) => site.id === destinationId);
  const fromUser = originId === USER_LOCATION_ID;

  let origin = fromUser ? undefined : sites.find((site) => site.id === originId);

  if (fromUser) {
    const lat = parseCoord(searchParams.get("origin_lat"), -90, 90);
    const lng = parseCoord(searchParams.get("origin_lng"), -180, 180);

    if (lat === null || lng === null) {
      return NextResponse.json(
        { error: "Faltan o son invalidas las coordenadas origin_lat/origin_lng." },
        { status: 400 },
      );
    }
    if (
      lat < AREQUIPA_BOUNDS.minLat ||
      lat > AREQUIPA_BOUNDS.maxLat ||
      lng < AREQUIPA_BOUNDS.minLng ||
      lng > AREQUIPA_BOUNDS.maxLng
    ) {
      return NextResponse.json(
        { error: "Tu ubicacion esta fuera de la region de Arequipa.", out_of_area: true },
        { status: 422 },
      );
    }

    /*
     * Origen sintetico. Los rasgos de accesibilidad van en false y verified_by
     * en null a proposito: NO sabemos nada de la acera donde esta parado el
     * usuario. Marcarlos true seria inventar; marcarlos false y no contarlos en
     * el puntaje es lo honesto (ver mas abajo).
     */
    origin = {
      id: USER_LOCATION_ID,
      name: "Mi ubicacion",
      lat,
      lng,
      category: "ubicacion",
      wheelchair_accessible: false,
      has_ramps: false,
      has_accessible_bathroom: false,
      has_rest_areas: false,
      notes: "Punto de partida del usuario. No tenemos datos de accesibilidad de este lugar.",
      verified_by: null,
      verified_at: null,
      crowd_profile: Array.from({ length: 24 }, () => 0),
      crowd_level: null,
      crowd_is_live: false,
      crowd_closed: false,
    };
  }

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Sitio de origen o destino desconocido." },
      { status: 404 },
    );
  }

  const route = await walkingRoute(origin, destination, {
    accessible: accessibleFilter,
  });

  // El aviso se calcula sobre el DESTINO: de nada sirve avisar que el punto de
  // partida esta lleno cuando el turista ya se esta yendo de ahi.
  const advice = antiCrowdAdvice(destination, sites, hour, {
    accessibleOnly: accessibleFilter,
  });

  return NextResponse.json({
    ...route,
    walkable: isWalkable(route.distance_m),
    /*
     * Saliendo desde la ubicacion del usuario, el puntaje y los hitos salen
     * SOLO del destino. routeAccessibilityScore toma el minimo de los dos
     * extremos, asi que incluir un origen del que no sabemos nada daria 0% y
     * leeria como "la ruta es inaccesible" cuando en realidad es "no tenemos
     * el dato". Eso es peor que no informar (§2.1).
     */
    accessibility_score: fromUser
      ? accessibilityScore(destination)
      : routeAccessibilityScore(origin, destination),
    milestones: fromUser
      ? accessibilityMilestones(destination, destination).slice(0, 4)
      : accessibilityMilestones(origin, destination),
    origin_is_user_location: fromUser,
    accessible_filter: accessibleFilter,
    origin,
    destination,
    hour,
    saturated: advice.saturated,
    alternative: advice.alternative,
    quiet_hour: advice.quiet_hour,
  });
}
