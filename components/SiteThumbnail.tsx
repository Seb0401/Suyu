import Image from "next/image";
import type { ComponentType } from "react";
import {
  ChurchIcon,
  MuseumIcon,
  PlazaIcon,
  ViewpointIcon,
  type IconProps,
} from "@/components/Icons";
import { getSitePhoto } from "@/lib/photos";

/**
 * Miniatura de un sitio.
 *
 * Muestra la foto real (Wikimedia Commons, licencia libre) y encima un chip con
 * el icono de la categoria. El icono no sobra por tener foto: es el mismo
 * simbolo que usa el filtro por categoria en Explorar, asi que verlo aqui es lo
 * que hace que el filtro se entienda sin leerlo.
 *
 * Sin foto para ese sitio, el mosaico de categoria sigue siendo el fondo — no
 * hay hueco ni imagen rota.
 */

type Style = { wrap: string; Icon: ComponentType<IconProps> };

export const CATEGORY_STYLE: Record<string, Style> = {
  museo: { wrap: "bg-clay-50 text-[var(--color-museo-text)]", Icon: MuseumIcon },
  mirador: { wrap: "bg-forest-50 text-forest-700", Icon: ViewpointIcon },
  iglesia: { wrap: "bg-sand-200 text-clay-700", Icon: ChurchIcon },
  plaza: { wrap: "bg-forest-100 text-forest-700", Icon: PlazaIcon },
};

const FALLBACK: Style = { wrap: "bg-sand-200 text-ink-soft", Icon: PlazaIcon };

export function categoryStyle(category: string): Style {
  return CATEGORY_STYLE[category] ?? FALLBACK;
}

/**
 * Icono por categoria, reutilizado por components/PassportStamp.tsx.
 *
 * Se apoya en categoryStyle en vez de repetir el mapa: la rama del pasaporte
 * lo escribio contra BY_CATEGORY, que esta rama renombro a CATEGORY_STYLE.
 */
export function categoryIcon(category: string): ComponentType<IconProps> {
  return categoryStyle(category).Icon;
}

export default function SiteThumbnail({
  siteId,
  category,
  siteName,
  className = "",
  iconSize = 40,
}: {
  siteId?: string;
  category: string;
  siteName?: string;
  className?: string;
  iconSize?: number;
}) {
  const { wrap, Icon } = categoryStyle(category);
  const photo = siteId ? getSitePhoto(siteId) : null;

  if (!photo) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${wrap} ${className}`} aria-hidden>
        <Icon size={iconSize} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={photo.file}
        alt={siteName ? `Fotografía de ${siteName}` : ""}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
        unoptimized
      />
      <span
        aria-hidden
        className={`absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full border border-sand-50/70 ${wrap}`}
      >
        <Icon size={17} />
      </span>
    </div>
  );
}
