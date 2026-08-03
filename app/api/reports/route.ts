import { NextResponse } from "next/server";
import { getSeedSite } from "@/lib/seed";
import type { AccessibilityReport } from "@/lib/types";

/**
 * Stub del Commit 0: almacen en memoria del proceso. Se pierde en cada reinicio
 * y no se comparte entre instancias; A6 lo reemplaza por Supabase manteniendo
 * la memoria como fallback.
 */
const reports: AccessibilityReport[] = [];

export async function GET() {
  return NextResponse.json({ reports, source: "memoria" });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const { site_id, issue, detail } = (body ?? {}) as Record<string, unknown>;

  if (typeof site_id !== "string" || typeof issue !== "string" || !issue.trim()) {
    return NextResponse.json(
      { error: "Faltan los campos site_id e issue." },
      { status: 400 },
    );
  }

  const site = getSeedSite(site_id);
  if (!site) {
    return NextResponse.json({ error: "Sitio desconocido." }, { status: 404 });
  }

  const report: AccessibilityReport = {
    id: crypto.randomUUID(),
    site_id,
    site_name: site.name,
    issue: issue.trim(),
    detail: typeof detail === "string" ? detail.trim() : "",
    created_at: new Date().toISOString(),
  };

  reports.unshift(report);

  return NextResponse.json({ report, source: "memoria" }, { status: 201 });
}
