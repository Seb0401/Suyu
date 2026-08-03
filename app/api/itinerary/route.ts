import { NextResponse } from "next/server";
import { currentHourInArequipa, normalizeHour } from "@/lib/crowdProfile";
import { buildItinerary } from "@/lib/itinerary";
import { getSites } from "@/lib/sites";

const DEFAULT_AVAILABLE_MINUTES = 240;
const MAX_AVAILABLE_MINUTES = 12 * 60;

/**
 * GET /api/itinerary?hours=3&start=<0-23>&accessible=true&from=<siteId>
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const startHour =
    normalizeHour(searchParams.get("start")) ?? currentHourInArequipa();

  const hoursParam = Number(searchParams.get("hours"));
  const availableMinutes =
    Number.isFinite(hoursParam) && hoursParam > 0
      ? Math.min(Math.round(hoursParam * 60), MAX_AVAILABLE_MINUTES)
      : DEFAULT_AVAILABLE_MINUTES;

  const { sites, source } = await getSites(startHour);

  const itinerary = buildItinerary(sites, {
    startHour,
    availableMinutes,
    accessibleOnly: searchParams.get("accessible") === "true",
    startSiteId: searchParams.get("from") ?? undefined,
  });

  return NextResponse.json({
    ...itinerary,
    start_hour: startHour,
    available_minutes: availableMinutes,
    source,
  });
}
