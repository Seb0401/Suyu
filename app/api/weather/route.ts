import { NextResponse } from "next/server";
import { getSites } from "@/lib/sites";
import { getWeather } from "@/lib/weather";

/** Centro de Arequipa, para cuando no se pide un sitio concreto. */
const AREQUIPA = { lat: -16.39889, lng: -71.537, name: "Arequipa" };

/**
 * GET /api/weather?site=<id>
 *
 * Sin `site` devuelve el clima del centro de Arequipa. Con `site` usa las
 * coordenadas de ese sitio, que importa: la Cruz del Condor esta a 3270 m y a
 * 160 km, y su clima no se parece al del centro.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site");

  let place = AREQUIPA;
  if (siteId) {
    const { sites } = await getSites();
    const site = sites.find((s) => s.id === siteId);
    if (!site) {
      return NextResponse.json({ error: "Sitio desconocido." }, { status: 404 });
    }
    place = { lat: site.lat, lng: site.lng, name: site.name };
  }

  const weather = await getWeather(place.lat, place.lng);

  return NextResponse.json({ ...weather, place: place.name });
}
