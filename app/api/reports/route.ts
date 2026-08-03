import { NextResponse } from "next/server";
import { REPORT_ISSUES, createReport, listReports } from "@/lib/reports";

/** GET /api/reports?site=<id> — tambien devuelve los motivos validos. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { reports, source } = await listReports(
    searchParams.get("site") ?? undefined,
  );

  return NextResponse.json({ reports, source, issues: REPORT_ISSUES });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const result = await createReport(
    (body ?? {}) as { site_id: unknown; issue: unknown; detail?: unknown },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    { report: result.report, source: result.source },
    { status: 201 },
  );
}
