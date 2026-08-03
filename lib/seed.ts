import sitesJson from "@/data/seed-sites.json";
import servicesJson from "@/data/seed-services.json";
import type {
  CrowdLevel,
  Site,
  SiteWithCrowd,
  TouristService,
} from "@/lib/types";

const SITES = sitesJson as Site[];
const SERVICES = servicesJson as TouristService[];

/**
 * Umbrales de aforo (CLAUDE.md §6.3). El caso 0 es CERRADO, no "poca gente":
 * es el error que mas se repite al leer estos perfiles.
 *
 * TODO(A1): mover a lib/crowdProfile.ts junto con nextQuietHour/bestHour.
 */
export function crowdLevelFor(occupancy: number): CrowdLevel | null {
  if (occupancy === 0) return null;
  if (occupancy >= 70) return "alto";
  if (occupancy >= 40) return "medio";
  return "bajo";
}

export function currentHourInArequipa(): number {
  // Arequipa es UTC-5 todo el ano, sin horario de verano.
  return new Date(Date.now() - 5 * 60 * 60 * 1000).getUTCHours();
}

function withCrowd(site: Site, hour: number): SiteWithCrowd {
  const occupancy = site.crowd_profile[hour] ?? 0;
  return {
    ...site,
    crowd_level: crowdLevelFor(occupancy),
    crowd_is_live: false,
    crowd_closed: occupancy === 0,
  };
}

/** Sitios semilla con el aforo ya resuelto para la hora pedida. */
export function getSeedSites(hour = currentHourInArequipa()): SiteWithCrowd[] {
  return SITES.map((site) => withCrowd(site, hour));
}

export function getSeedSite(
  id: string,
  hour = currentHourInArequipa(),
): SiteWithCrowd | null {
  const site = SITES.find((s) => s.id === id);
  return site ? withCrowd(site, hour) : null;
}

export function getSeedServices(nearSiteId?: string): TouristService[] {
  if (!nearSiteId) return SERVICES;
  return SERVICES.filter((s) => s.near_site_id === nearSiteId);
}
