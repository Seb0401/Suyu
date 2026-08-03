import { NextResponse } from "next/server";
import { currentHourInArequipa, getSeedSites } from "@/lib/seed";

/**
 * Stub del Commit 0: ya devuelve la forma final para que la UI no espere a A2.
 * A2 lo reemplaza por lib/sites.ts (Supabase con fallback a semilla) SIN cambiar
 * la forma de esta respuesta.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hourParam = searchParams.get("hour");
  const parsed = hourParam === null ? NaN : Number(hourParam);
  const hour =
    Number.isInteger(parsed) && parsed >= 0 && parsed <= 23
      ? parsed
      : currentHourInArequipa();

  return NextResponse.json({
    sites: getSeedSites(hour),
    source: "demo",
    hour,
  });
}
