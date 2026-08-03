import { NextResponse } from "next/server";
import { countByCategory, getServices } from "@/lib/services";
import type { ServiceCategory } from "@/lib/types";

const CATEGORIES: ServiceCategory[] = [
  "restaurante",
  "guia",
  "agencia",
  "transporte",
  "hospedaje",
  "artesania",
  "movilidad",
  "salud",
  "actividad",
];

/**
 * GET /api/services?near=<siteId>&category=<cat>&accessible=true&formalized=true
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");
  const category = CATEGORIES.find((c) => c === categoryParam);

  const { services, source } = await getServices({
    nearSiteId: searchParams.get("near") ?? undefined,
    category,
    accessibleOnly: searchParams.get("accessible") === "true",
    formalizedOnly: searchParams.get("formalized") === "true",
  });

  return NextResponse.json({
    services,
    source,
    counts: countByCategory(services),
  });
}
