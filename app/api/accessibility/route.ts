import { NextResponse } from "next/server";
import {
  GUIDE_DOG_LAW_URL,
  GUIDE_DOG_NOTICE,
  getAccessibilityDetail,
  getAllAccessibilityDetails,
} from "@/lib/accessibility";

/**
 * GET /api/accessibility            -> todas las fichas
 * GET /api/accessibility?site=<id>  -> una sola
 *
 * Endpoint NUEVO en vez de ampliar /api/sites: agregar campos a la respuesta de
 * sites obligaria a revisar todo lo que ya la consume. Aqui no rompe nada.
 *
 * `guide_dog` viaja en la respuesta porque es un derecho legal que aplica a
 * todos los sitios por igual, no un rasgo que varie entre ellos.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site");

  const guide_dog = { notice: GUIDE_DOG_NOTICE, law_url: GUIDE_DOG_LAW_URL };

  if (siteId) {
    const detail = getAccessibilityDetail(siteId);
    if (!detail) {
      return NextResponse.json(
        { error: "No hay ficha de accesibilidad para ese sitio." },
        { status: 404 },
      );
    }
    return NextResponse.json({ detail, guide_dog, source: "demo" });
  }

  return NextResponse.json({
    details: getAllAccessibilityDetails(),
    guide_dog,
    source: "demo",
  });
}
