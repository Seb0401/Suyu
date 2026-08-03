import { NextResponse } from "next/server";
import { getSeedStories } from "@/lib/stories";

/** GET /api/stories?site=<id> — mas recientes primero. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site") ?? undefined;

  return NextResponse.json({
    stories: getSeedStories(siteId),
    // La UI debe dejar claro que esto lo escribe el equipo, no los usuarios.
    curated_by: "equipo",
  });
}
