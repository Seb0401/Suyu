import { CrowdDensityIcon } from "@/components/Icons";
import { crowdPresentation } from "@/lib/crowdUi";
import type { CrowdLevel, SiteWithCrowd } from "@/lib/types";

/**
 * Nivel de aforo. La etiqueta de texto es obligatoria y la cantidad de siluetas
 * es la codificacion primaria; el color solo refuerza (§2.3).
 *
 * Por que el chip NO usa --crowd-* como color de texto: esos hexes estan
 * calibrados como relleno de barra y marcador (areas grandes). El ambar
 * (#e5a50a) no llega a 3:1 sobre la superficie de tarjeta, asi que en texto se
 * usa --color-amber-text, que si contrasta. Lo mismo con el rojo.
 */

const LEVEL_STYLE: Record<CrowdLevel, { chip: string; count: 1 | 2 | 3 }> = {
  bajo: { chip: "bg-forest-50 text-forest-700", count: 1 },
  medio: { chip: "bg-[var(--color-amber-chip-bg)] text-[var(--color-amber-text)]", count: 2 },
  alto: { chip: "bg-clay-50 text-[var(--color-danger-text)]", count: 3 },
};

export default function CrowdBadge({
  site,
  className = "",
}: {
  site: SiteWithCrowd;
  className?: string;
}) {
  const { label } = crowdPresentation(site);
  const known = !site.crowd_closed && site.crowd_level !== null;
  const style = known ? LEVEL_STYLE[site.crowd_level as CrowdLevel] : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        style ? style.chip : "bg-sand-200 text-ink-soft"
      } ${className}`}
    >
      {/* Cerrado y "sin datos" no llevan siluetas: dibujar una insinuaria un
          nivel de gente que justamente no conocemos. */}
      {style ? <CrowdDensityIcon count={style.count} size={16} /> : null}
      {label}
      {site.crowd_is_live ? (
        <span className="rounded-full bg-current/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          En vivo
        </span>
      ) : null}
    </span>
  );
}
