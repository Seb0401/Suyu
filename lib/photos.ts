import raw from "@/data/site-photos.json";

/**
 * Fotos de los sitios, de Wikimedia Commons.
 *
 * Todas son de licencia libre (CC BY / CC BY-SA) y la atribucion viaja con la
 * foto, no en un archivo aparte: la licencia OBLIGA a nombrar al autor donde se
 * muestra la imagen, asi que si el dato no esta a mano se termina incumpliendo
 * sin querer. Por eso `author`, `license` y `source_url` no son opcionales.
 *
 * Los iconos de categoria (SiteThumbnail) NO desaparecen: siguen marcando de
 * que tipo es cada sitio y son el vocabulario del filtro por categoria.
 */

export interface SitePhoto {
  site_id: string;
  /** Ruta bajo public/. Se sirve same-origin, asi que funciona sin conexion. */
  file: string;
  author: string;
  license: string;
  source_url: string;
}

const PHOTOS = raw as SitePhoto[];
const BY_ID = new Map(PHOTOS.map((p) => [p.site_id, p]));

export function getSitePhoto(siteId: string): SitePhoto | null {
  return BY_ID.get(siteId) ?? null;
}

export function getAllSitePhotos(): SitePhoto[] {
  return PHOTOS;
}
