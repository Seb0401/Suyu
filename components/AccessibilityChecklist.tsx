import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { CheckIcon, CloseIcon } from "@/components/Icons";
import type { SiteWithCrowd } from "@/lib/types";

/**
 * Las 4 dimensiones de accesibilidad de un sitio.
 *
 * Un "no" se dibuja explicitamente con su aspa, nunca se omite la fila: que un
 * sitio no tenga baño accesible es justo el dato que el viajero necesita antes
 * de salir, y esconderlo lo dejaria suponer que si lo tiene.
 */
export default function AccessibilityChecklist({
  site,
  compact = false,
  className = "",
}: {
  site: SiteWithCrowd;
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {ACCESSIBILITY_FEATURES.map(({ key, label, Icon }) => {
        const has = site[key];
        return (
          <li
            key={key}
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              has ? "text-forest-700" : "text-ink-muted"
            }`}
          >
            <Icon size={compact ? 15 : 18} />
            {compact ? null : <span>{label}</span>}
            {has ? <CheckIcon size={13} /> : <CloseIcon size={13} />}
            <span className="sr-only">
              {compact ? label : ""} {has ? "disponible" : "no disponible"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
