import { NextResponse } from "next/server";
import { antiCrowdAdvice } from "@/lib/crowd";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import { getSites } from "@/lib/sites";

/**
 * GET /api/crowd?site=<id>&hour=<0-23>&accessible=true
 *
 * El aviso anti-aforo de un sitio suelto, para la pantalla "Estado del lugar".
 * La misma logica que usa /api/route-finder, expuesta sin necesidad de pedir
 * una ruta completa.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site");
  const hour = normalizeHour(searchParams.get("hour")) ?? currentHourInArequipa();
  const accessibleOnly = searchParams.get("accessible") === "true";

  if (!siteId) {
    return NextResponse.json(
      { error: "Falta el parametro site." },
      { status: 400 },
    );
  }

  const { sites, source } = await getSites(hour);
  const site = sites.find((s) => s.id === siteId);

  if (!site) {
    return NextResponse.json({ error: "Sitio desconocido." }, { status: 404 });
  }

  const advice = antiCrowdAdvice(site, sites, hour, { accessibleOnly });

  return NextResponse.json({ site, ...advice, hour, source });
}
