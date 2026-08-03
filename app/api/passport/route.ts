import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/authServer";
import { getPassportSummary } from "@/lib/passport";

/** GET /api/passport — resumen de estampas y nivel del usuario autenticado. */
export async function GET(request: Request) {
  const auth = await getUserIdFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await getPassportSummary(auth.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ summary: result.summary });
}
