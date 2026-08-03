import storiesJson from "@/data/seed-stories.json";
import { getSeedSites } from "@/lib/seed";
import type { Story } from "@/lib/types";

/**
 * Historias de viajeros (CLAUDE.md §6.9).
 *
 * Es un blog curado por el equipo, NO un sistema de comentarios: no hay
 * formulario de envio ni moderacion. Construir eso bien no entraba en el
 * alcance, y publicar contenido de usuarios sin moderar habria sido peor que
 * no tenerlo.
 */

/** El JSON no guarda site_name: se cruza con los sitios al leer. */
type StorySeed = Omit<Story, "site_name">;

const STORIES = storiesJson as StorySeed[];

export function getSeedStories(siteId?: string): Story[] {
  // Cruzar en vez de duplicar el nombre en el JSON: si cambia el nombre de un
  // sitio, las historias no quedan desincronizadas.
  const nameById = new Map(getSeedSites().map((site) => [site.id, site.name]));

  return STORIES.filter((story) => !siteId || story.site_id === siteId)
    .map((story) => ({
      ...story,
      site_name: nameById.get(story.site_id) ?? "Sitio desconocido",
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getStory(id: string): Story | null {
  return getSeedStories().find((story) => story.id === id) ?? null;
}
