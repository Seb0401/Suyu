import { haversineMeters, walkingMinutes } from "@/lib/geo";
import { getSeedServices } from "@/lib/seed";
import { getSites } from "@/lib/sites";
import type { ServiceCategory, TouristService } from "@/lib/types";

/**
 * Servicios turisticos cercanos a cada sitio (CLAUDE.md §6.7).
 *
 * El par formalized + registry_id es el diferenciador del proyecto, y por eso
 * es tambien donde mas facil seria mentir. La regla: si no tenemos el numero de
 * registro confirmado, formalized queda en false y registry_id en null. Nunca
 * se inventa un RUC para que la ficha se vea mas seria — ya paso una vez en
 * este proyecto y hubo que revertirlo.
 */

export type ServicesSource = "supabase" | "demo";

export interface ServiceWithDistance extends TouristService {
  distance_m: number | null;
  walking_min: number | null;
  /** Etiqueta lista para mostrar. Nunca omitir el caso "por verificar". */
  registry_label: string;
}

export interface ServicesResult {
  services: ServiceWithDistance[];
  source: ServicesSource;
}

export function registryLabel(service: TouristService): string {
  if (service.formalized && service.registry_id) {
    return `Registro ${service.registry_id}`;
  }
  return "Registro por verificar";
}

/** Costura para A8, igual que en lib/sites.ts. */
async function fetchServicesFromDb(): Promise<TouristService[] | null> {
  return null;
}

export async function getServices(options: {
  nearSiteId?: string;
  category?: ServiceCategory;
  accessibleOnly?: boolean;
  formalizedOnly?: boolean;
} = {}): Promise<ServicesResult> {
  const rows = await fetchServicesFromDb();
  const source: ServicesSource = rows && rows.length > 0 ? "supabase" : "demo";
  let services = rows && rows.length > 0 ? rows : getSeedServices();

  if (options.nearSiteId) {
    services = services.filter((s) => s.near_site_id === options.nearSiteId);
  }
  if (options.category) {
    services = services.filter((s) => s.category === options.category);
  }
  if (options.accessibleOnly) {
    services = services.filter((s) => s.wheelchair_accessible);
  }
  if (options.formalizedOnly) {
    services = services.filter((s) => s.formalized);
  }

  const { sites } = await getSites();
  const siteById = new Map(sites.map((site) => [site.id, site]));

  const withDistance: ServiceWithDistance[] = services.map((service) => {
    const site = siteById.get(service.near_site_id);
    const distance_m = site
      ? Math.round(haversineMeters(site, service))
      : null;
    return {
      ...service,
      distance_m,
      walking_min: distance_m === null ? null : walkingMinutes(distance_m),
      registry_label: registryLabel(service),
    };
  });

  withDistance.sort((a, b) => (a.distance_m ?? 1e9) - (b.distance_m ?? 1e9));

  return { services: withDistance, source };
}

export function countByCategory(
  services: TouristService[],
): Record<string, number> {
  return services.reduce<Record<string, number>>((acc, service) => {
    acc[service.category] = (acc[service.category] ?? 0) + 1;
    return acc;
  }, {});
}
