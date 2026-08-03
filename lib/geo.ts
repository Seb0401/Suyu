const EARTH_RADIUS_M = 6371000;

/** Velocidad a pie deliberadamente conservadora: el publico objetivo incluye
 *  personas con movilidad reducida, no un caminante promedio. */
const WALKING_SPEED_M_PER_MIN = 60;

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
  return Math.round(meters / WALKING_SPEED_M_PER_MIN);
}
