import sitesJson from "@/data/seed-sites.json";
import servicesJson from "@/data/seed-services.json";
import {
  crowdLevelAt,
  currentHourInArequipa,
  isClosedAt,
} from "@/lib/crowdProfile";
import type { Site, SiteWithCrowd, TouristService } from "@/lib/types";

const SITES = sitesJson as Site[];
const SERVICES = servicesJson as TouristService[];

export function withCrowd(site: Site, hour: number): SiteWithCrowd {
  return {
    ...site,
    crowd_level: crowdLevelAt(site.crowd_profile, hour),
    crowd_is_live: false,
    crowd_closed: isClosedAt(site.crowd_profile, hour),
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
