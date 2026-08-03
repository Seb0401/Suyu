import { NextResponse } from "next/server";
import { haversineMeters, walkingMinutes } from "@/lib/geo";
import { currentHourInArequipa, getSeedSite } from "@/lib/seed";
import type { RouteGeometry } from "@/lib/types";

/**
 * Stub del Commit 0: linea recta + haversine, siempre approximate: true.
 * A3 agrega Mapbox Directions manteniendo esta misma forma de respuesta y
 * dejando este calculo como fallback cuando no hay token.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originId = searchParams.get("origin");
  const destinationId = searchParams.get("destination");
  const accessible = searchParams.get("accessible") === "true";
  const hourParam = Number(searchParams.get("hour"));
  const hour =
    Number.isInteger(hourParam) && hourParam >= 0 && hourParam <= 23
      ? hourParam
      : currentHourInArequipa();

  if (!originId || !destinationId) {
    return NextResponse.json(
      { error: "Faltan los parametros origin y destination." },
      { status: 400 },
    );
  }

  const origin = getSeedSite(originId, hour);
  const destination = getSeedSite(destinationId, hour);

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Sitio de origen o destino desconocido." },
      { status: 404 },
    );
  }

  const distance_m = Math.round(haversineMeters(origin, destination));
  const geometry: RouteGeometry = {
    type: "LineString",
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
  };

  return NextResponse.json({
    geometry,
    distance_m,
    duration_min: walkingMinutes(distance_m),
    // Sin Mapbox no hay ruta peatonal real: la UI tiene que decirlo (§6.5).
    approximate: true,
    accessible_filter: accessible,
    origin,
    destination,
    hour,
    // A3/A4 los llenan; el contrato ya los declara para que B maquete contra ellos.
    alternative: null,
    quiet_hour: null,
  });
}
