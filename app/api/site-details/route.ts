import { NextResponse } from "next/server";
import { getAllSiteDetails, getSiteDetail } from "@/lib/siteDetails";

/** GET /api/site-details?site=<id> — sin el parametro devuelve todas. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site");

  if (!siteId) {
    return NextResponse.json({ details: getAllSiteDetails() });
  }

  const detail = getSiteDetail(siteId);
  if (!detail) {
    return NextResponse.json(
      { error: "Ese sitio todavia no tiene ficha tecnica." },
      { status: 404 },
    );
  }

  return NextResponse.json({ detail });
}
