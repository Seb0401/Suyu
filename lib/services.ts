import { haversineMeters, walkingMinutes } from "@/lib/geo";
import { getSeedServices } from "@/lib/seed";
import { getSites } from "@/lib/sites";
import { supabase, trySupabase } from "@/lib/supabase";
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

async function fetchServicesFromDb(): Promise<TouristService[] | null> {
  return trySupabase(async () => {
    const { data, error } = await supabase.from("services").select("*");
    if (error || !data) return null;
    return data as TouristService[];
  });
}

/**
 * Radio para el fallback por cercania. Un servicio dentro de este radio es
 * util aunque este asignado a otro sitio.
 */
const NEARBY_FALLBACK_METERS = 900;

export async function getServices(options: {
  nearSiteId?: string;
  category?: ServiceCategory;
  accessibleOnly?: boolean;
  formalizedOnly?: boolean;
} = {}): Promise<ServicesResult> {
  const rows = await fetchServicesFromDb();
  const source: ServicesSource = rows && rows.length > 0 ? "supabase" : "demo";
  const all = rows && rows.length > 0 ? rows : getSeedServices();
  let services = all;

  if (options.nearSiteId) {
    const assigned = all.filter((s) => s.near_site_id === options.nearSiteId);

    /**
     * near_site_id apunta a UN solo sitio, y eso deja huecos: el Museo
     * Santuarios Andinos esta a tres cuadras de la Plaza pero no heredaba
     * ninguno de sus servicios, asi que la pantalla decia "no hay nada aqui"
     * cuando en realidad hay media docena a cinco minutos.
     *
     * Si el sitio no tiene servicios propios, se completan con los que esten
     * a menos de 900 m en linea recta. La distancia real viaja en la respuesta,
     * asi que la UI puede mostrarla y el usuario juzga.
     */
    if (assigned.length === 0) {
      const { sites } = await getSites();
      const site = sites.find((s) => s.id === options.nearSiteId);
      services = site
        ? all.filter(
            (s) => haversineMeters(site, s) <= NEARBY_FALLBACK_METERS,
          )
        : assigned;
    } else {
      services = assigned;
    }
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
    /**
     * La distancia se mide desde el sitio que el usuario PIDIO, no desde el que
     * el servicio tiene asignado. Con el fallback por cercania un servicio de
     * la Plaza puede aparecer en la ficha del museo, y reportar su distancia a
     * la Plaza seria contestar otra pregunta.
     */
    const reference = options.nearSiteId
      ? siteById.get(options.nearSiteId)
      : siteById.get(service.near_site_id);
    const distance_m = reference
      ? Math.round(haversineMeters(reference, service))
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
