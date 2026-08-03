import { NextResponse } from "next/server";
import { getSeedServices } from "@/lib/seed";

/** Stub del Commit 0. A5 lo reemplaza por lib/services.ts. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const near = searchParams.get("near") ?? undefined;

  return NextResponse.json({ services: getSeedServices(near) });
}
