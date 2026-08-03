import { NextResponse } from "next/server";
import { getZoneForSite, getZones } from "@/lib/zones";

/**
 * GET /api/zones?site=<id>
 *
 * Sin parametros devuelve todas las zonas. Con `site` devuelve la zona a la que
 * pertenece ese sitio, para el aviso contextual de la ficha.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site");

  if (siteId) {
    const zone = getZoneForSite(siteId);
    if (!zone) {
      return NextResponse.json(
        { error: "Ese sitio todavia no esta asignado a una zona." },
        { status: 404 },
      );
    }
    return NextResponse.json({ zone });
  }

  return NextResponse.json({
    zones: getZones(),
    notice:
      "La mejor época no es solo cuestión de clima: Arequipa casi no tiene fenómenos extremos. Lo que cambia mes a mes es la experiencia — si se ven los volcanes, si el cóndor remonta y cuánta gente hay.",
  });
}
