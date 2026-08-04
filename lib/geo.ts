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

/**
 * Con que motor se trazo la ruta. Importa para la UI: prometer un recorrido
 * apto para silla de ruedas y haber usado el perfil peatonal generico seria
 * exactamente el tipo de dato inventado que prohibe §2.1.
 */
export type RouteProfile = "wheelchair" | "foot-walking" | "straight-line";

export interface WalkingRoute {
  geometry: RouteGeometry;
  distance_m: number;
  duration_min: number;
  /** true = linea recta, no una ruta peatonal real. La UI tiene que decirlo. */
  approximate: boolean;
  profile: RouteProfile;
}

function fallbackRoute(a: LatLng, b: LatLng): WalkingRoute {
  const distance_m = Math.round(haversineMeters(a, b));
  return {
    geometry: straightLine(a, b),
    distance_m,
    duration_min: walkingMinutes(distance_m),
    approximate: true,
    profile: "straight-line",
  };
}

/** GeoJSON de OpenRouteService: una Feature con summary en properties. */
interface OrsResponse {
  features?: {
    geometry?: { type?: string; coordinates?: [number, number][] };
    properties?: { summary?: { distance?: number; duration?: number } };
  }[];
}

const ORS_TIMEOUT_MS = 3500;

/**
 * Un intento contra un perfil de OpenRouteService. Devuelve null si el perfil
 * no pudo resolver la ruta, o "timeout" si ni siquiera contesto a tiempo — el
 * llamador los trata distinto (ver walkingRoute).
 */
async function tryOrsProfile(
  profile: Exclude<RouteProfile, "straight-line">,
  a: LatLng,
  b: LatLng,
  apiKey: string,
): Promise<WalkingRoute | null | "timeout"> {
  const url =
    `https://api.openrouteservice.org/v2/directions/${profile}` +
    `?api_key=${apiKey}&start=${a.lng},${a.lat}&end=${b.lng},${b.lat}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(ORS_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
  } catch {
    // Timeout, DNS caido, red del evento saturada.
    return "timeout";
  }

  if (!response.ok) return null;

  try {
    const data = (await response.json()) as OrsResponse;
    const feature = data.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    const distance = feature?.properties?.summary?.distance;

    if (
      feature?.geometry?.type !== "LineString" ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      typeof distance !== "number"
    ) {
      return null;
    }

    const duration = feature.properties?.summary?.duration;
    return {
      geometry: { type: "LineString", coordinates },
      distance_m: Math.round(distance),
      duration_min:
        typeof duration === "number"
          ? Math.max(1, Math.round(duration / 60))
          : walkingMinutes(distance),
      approximate: false,
      profile,
    };
  } catch {
    return null;
  }
}

/**
 * Ruta peatonal real via OpenRouteService (CLAUDE.md §6.5).
 *
 * Con accessible=true pide el perfil `wheelchair`, que rutea sobre veredas,
 * bordillos, superficie e inclinacion de OSM — no solo "esto es peatonal".
 * Ese perfil depende de que la zona tenga esos datos mapeados, y la cobertura
 * de veredas en Arequipa es despareja, asi que degrada en tres escalones:
 *
 *   wheelchair → foot-walking → linea recta + haversine (approximate: true)
 *
 * Un timeout NO reintenta con el otro perfil: si la red esta lenta, insistir
 * solo alarga la espera. Un fallo de ruteo si reintenta, porque ahi el
 * problema son los datos del perfil, no la conexion.
 *
 * Nunca lanza: una ruta aproximada sirve, una excepcion en medio del pitch no.
 */
export async function walkingRoute(
  a: LatLng,
  b: LatLng,
  options: { accessible?: boolean } = {},
): Promise<WalkingRoute> {
  const apiKey = process.env.ORS_API_KEY?.trim();
  if (!apiKey) return fallbackRoute(a, b);

  if (options.accessible) {
    const wheelchair = await tryOrsProfile("wheelchair", a, b, apiKey);
    if (wheelchair === "timeout") return fallbackRoute(a, b);
    if (wheelchair) return wheelchair;
  }

  const walking = await tryOrsProfile("foot-walking", a, b, apiKey);
  return walking && walking !== "timeout" ? walking : fallbackRoute(a, b);
}
