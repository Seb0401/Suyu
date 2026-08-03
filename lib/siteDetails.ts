import detailsJson from "@/data/site-details.json";
import type { SiteDetail } from "@/lib/types";

/**
 * Fichas tecnicas curadas por sitio (CLAUDE.md §6.8).
 *
 * Sin tabla en Supabase y sin fallback: es texto editorial que el equipo
 * escribe una vez, no un dato operativo que cambie en produccion. Meterlo en
 * la base de datos solo agregaria una consulta que puede fallar.
 */

const DETAILS = detailsJson as SiteDetail[];

export function getSiteDetail(siteId: string): SiteDetail | null {
  return DETAILS.find((detail) => detail.site_id === siteId) ?? null;
}

export function getAllSiteDetails(): SiteDetail[] {
  return DETAILS;
}
