import { currentHourInArequipa } from "@/lib/crowdProfile";
import { getSeedSite, getSeedSites, withCrowd } from "@/lib/seed";
import { supabase, trySupabase } from "@/lib/supabase";
import type { CrowdLevel, Site, SiteWithCrowd } from "@/lib/types";

/**
 * Acceso a sitios con fallback (CLAUDE.md §2.1). El orden manda:
 * Supabase si esta configurado y responde, semilla local si no.
 *
 * Ningun error de red puede dejar la pantalla vacia: el turista sigue
 * necesitando saber si hay rampa aunque el backend se caiga.
 */

export type SitesSource = "supabase" | "demo";

export interface SitesResult {
  sites: SiteWithCrowd[];
  source: SitesSource;
  hour: number;
}

async function fetchSitesFromDb(): Promise<Site[] | null> {
  return trySupabase(async () => {
    const { data, error } = await supabase.from("sites").select("*");
    if (error || !data) return null;
    return data as Site[];
  });
}

/**
 * Reportes manuales de aforo. Mandan sobre la prediccion horaria (§6.3): un
 * dato de alguien que esta parado en la puerta vale mas que nuestro perfil.
 * Solo cuenta el reporte de la ultima hora — mas viejo que eso ya no describe
 * lo que el turista se va a encontrar.
 */
const LIVE_CROWD_MAX_AGE_MIN = 60;

async function fetchLiveCrowd(): Promise<Map<string, CrowdLevel> | null> {
  return trySupabase(async () => {
    const since = new Date(
      Date.now() - LIVE_CROWD_MAX_AGE_MIN * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("crowd_status")
      .select("site_id, level, reported_at")
      .gte("reported_at", since)
      .order("reported_at", { ascending: false });

    if (error || !data) return null;

    const latest = new Map<string, CrowdLevel>();
    for (const row of data as { site_id: string; level: CrowdLevel }[]) {
      if (!latest.has(row.site_id)) latest.set(row.site_id, row.level);
    }
    return latest;
  });
}

export async function getSites(
  hour: number = currentHourInArequipa(),
): Promise<SitesResult> {
  const [rows, live] = await Promise.all([fetchSitesFromDb(), fetchLiveCrowd()]);

  const base: Site[] | null = rows && rows.length > 0 ? rows : null;
  const source: SitesSource = base ? "supabase" : "demo";
  const sites = base
    ? base.map((site) => withCrowd(site, hour))
    : getSeedSites(hour);

  if (!live || live.size === 0) return { sites, source, hour };

  return {
    sites: sites.map((site) => {
      const reported = live.get(site.id);
      if (!reported) return site;
      return {
        ...site,
        crowd_level: reported,
        crowd_is_live: true,
        // Un reporte manual implica que el sitio esta abierto: alguien esta ahi.
        crowd_closed: false,
      };
    }),
    source,
    hour,
  };
}

export async function getSite(
  id: string,
  hour: number = currentHourInArequipa(),
): Promise<SiteWithCrowd | null> {
  const { sites } = await getSites(hour);
  return sites.find((site) => site.id === id) ?? getSeedSite(id, hour);
}

/** Filtro de accesibilidad estricto: si el usuario lo pide, no se negocia. */
export function onlyAccessible(sites: SiteWithCrowd[]): SiteWithCrowd[] {
  return sites.filter((site) => site.wheelchair_accessible);
}
