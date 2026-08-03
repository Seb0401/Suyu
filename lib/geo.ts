import type { RouteGeometry } from "@/lib/types";

const EARTH_RADIUS_M = 6371000;

/**
 * Velocidad a pie deliberadamente conservadora: el publico objetivo incluye
 * personas con movilidad reducida, no un caminante promedio.
 */
const WALKING_SPEED_M_PER_MIN = 60;

/** Mas alla de esto, caminar deja de ser una opcion razonable (§ itinerario). */
export const MAX_WALKABLE_METERS = 2500;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Distancia en metros sobre la esfera. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALKING_SPEED_M_PER_MIN));
}

export function isWalkable(meters: number): boolean {
  return meters <= MAX_WALKABLE_METERS;
}

export function straightLine(a: LatLng, b: LatLng): RouteGeometry {
  return {
    type: "LineString",
    coordinates: [
      [a.lng, a.lat],
      [b.lng, b.lat],
    ],
  };
}

export interface WalkingRoute {
  geometry: RouteGeometry;
  distance_m: number;
  duration_min: number;
  /** true = linea recta, no una ruta peatonal real. La UI tiene que decirlo. */
  approximate: boolean;
}

function fallbackRoute(a: LatLng, b: LatLng): WalkingRoute {
  const distance_m = Math.round(haversineMeters(a, b));
  return {
    geometry: straightLine(a, b),
    distance_m,
    duration_min: walkingMinutes(distance_m),
    approximate: true,
  };
}

interface MapboxRoute {
  geometry?: { type?: string; coordinates?: [number, number][] };
  distance?: number;
  duration?: number;
}

/**
 * Ruta peatonal real via Mapbox Directions. Sin token, sin red o ante
 * cualquier respuesta rara cae a linea recta + haversine marcada como
 * aproximada (CLAUDE.md §6.5).
 *
 * Nunca lanza: una ruta aproximada sirve, una excepcion en medio del pitch no.
 */
export async function walkingRoute(
  a: LatLng,
  b: LatLng,
): Promise<WalkingRoute> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return fallbackRoute(a, b);

  const coords = `${a.lng},${a.lat};${b.lng},${b.lat}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return fallbackRoute(a, b);

    const data = (await response.json()) as { routes?: MapboxRoute[] };
    const route = data.routes?.[0];
    const coordinates = route?.geometry?.coordinates;

    if (
      !route ||
      route.geometry?.type !== "LineString" ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      typeof route.distance !== "number"
    ) {
      return fallbackRoute(a, b);
    }

    return {
      geometry: { type: "LineString", coordinates },
      distance_m: Math.round(route.distance),
      duration_min:
        typeof route.duration === "number"
          ? Math.max(1, Math.round(route.duration / 60))
          : walkingMinutes(route.distance),
      approximate: false,
    };
  } catch {
    // Timeout, DNS, token vencido, cuota agotada: todos terminan igual.
    return fallbackRoute(a, b);
  }
}
