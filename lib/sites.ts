import { currentHourInArequipa } from "@/lib/crowdProfile";
import { getSeedSite, getSeedSites, withCrowd } from "@/lib/seed";
import type { Site, SiteWithCrowd } from "@/lib/types";

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

/**
 * Costura para A8. Devuelve null mientras Supabase no este conectado, y a
 * partir de A8 devuelve las filas de la tabla `sites` o null si falla.
 */
async function fetchSitesFromDb(): Promise<Site[] | null> {
  return null;
}

export async function getSites(
  hour: number = currentHourInArequipa(),
): Promise<SitesResult> {
  const rows = await fetchSitesFromDb();

  if (rows && rows.length > 0) {
    return {
      sites: rows.map((site) => withCrowd(site, hour)),
      source: "supabase",
      hour,
    };
  }

  return { sites: getSeedSites(hour), source: "demo", hour };
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
