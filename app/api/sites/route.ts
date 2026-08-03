import { NextResponse } from "next/server";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import { getSites, onlyAccessible } from "@/lib/sites";

/**
 * GET /api/sites?hour=<0-23>&accessible=true
 *
 * `hour` existe para el demo: permite mostrar el sitio saturado a las 11 y
 * tranquilo a las 17 sin esperar a que pase el dia.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hour = normalizeHour(searchParams.get("hour")) ?? currentHourInArequipa();
  const accessibleOnly = searchParams.get("accessible") === "true";

  const { sites, source } = await getSites(hour);

  return NextResponse.json({
    sites: accessibleOnly ? onlyAccessible(sites) : sites,
    source,
    hour,
  });
}
