import { NextResponse } from "next/server";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import { getSeedSites } from "@/lib/seed";

/**
 * Stub del Commit 0: ya devuelve la forma final para que la UI no espere a A2.
 * A2 lo reemplaza por lib/sites.ts (Supabase con fallback a semilla) SIN cambiar
 * la forma de esta respuesta.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hour = normalizeHour(searchParams.get("hour")) ?? currentHourInArequipa();

  return NextResponse.json({
    sites: getSeedSites(hour),
    source: "demo",
    hour,
  });
}
