import type { ComponentType } from "react";
import {
  ChurchIcon,
  MuseumIcon,
  PlazaIcon,
  ViewpointIcon,
  type IconProps,
} from "@/components/Icons";

/**
 * Miniatura de un sitio.
 *
 * Decision: es un mosaico generado por categoria, no una foto. El mockup usa
 * fotografias, pero el repo no tiene imagenes con licencia de los sitios y
 * poner fotos de terceros sin verificar la licencia frente a un jurado es peor
 * que no ponerlas. Genera cero peticiones de red, lo que ademas encaja con
 * offline-first (§2.1).
 */

type Style = { wrap: string; Icon: ComponentType<IconProps> };

const BY_CATEGORY: Record<string, Style> = {
  museo: { wrap: "bg-clay-50 text-[var(--color-museo-text)]", Icon: MuseumIcon },
  mirador: { wrap: "bg-forest-50 text-forest-700", Icon: ViewpointIcon },
  iglesia: { wrap: "bg-sand-200 text-clay-700", Icon: ChurchIcon },
  plaza: { wrap: "bg-forest-100 text-forest-700", Icon: PlazaIcon },
};

const FALLBACK: Style = { wrap: "bg-sand-200 text-ink-soft", Icon: PlazaIcon };

export default function SiteThumbnail({
  category,
  className = "",
  iconSize = 40,
}: {
  category: string;
  className?: string;
  iconSize?: number;
}) {
  const { wrap, Icon } = BY_CATEGORY[category] ?? FALLBACK;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${wrap} ${className}`}
      aria-hidden
    >
      <Icon size={iconSize} />
    </div>
  );
}
