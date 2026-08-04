"use client";

import { AlertIcon, HelpCircleIcon, ShieldCheckIcon } from "@/components/Icons";
import type { AlertLevel, ProfileAlert } from "@/components/profileAlerts";

/**
 * Avisos personalizados de un sitio.
 *
 * El nivel NUNCA se codifica solo con color (§2.3): cada uno trae su icono y su
 * palabra ("Importante", "Ten en cuenta", "Sin dato", "A favor"), asi que se
 * distingue en escala de grises y con daltonismo.
 *
 * `LEVEL` se exporta porque `StopProfileAlerts` resume una parada con el nivel
 * mas grave: si tuviera su propia tabla, el chip plegado podria decir una
 * palabra y el detalle desplegado otra.
 */

export const LEVEL: Record<
  AlertLevel,
  { word: string; box: string; chip: string; Icon: typeof AlertIcon }
> = {
  bloqueo: {
    word: "Importante",
    box: "border-[var(--color-danger-text)]/40 bg-clay-50 text-[var(--color-danger-text)]",
    chip: "bg-clay-50 text-[var(--color-danger-text)]",
    Icon: AlertIcon,
  },
  atencion: {
    word: "Ten en cuenta",
    box: "border-sand-300 bg-[var(--color-amber-chip-bg)] text-[var(--color-amber-text)]",
    chip: "bg-[var(--color-amber-chip-bg)] text-[var(--color-amber-text)]",
    Icon: AlertIcon,
  },
  "sin-dato": {
    word: "Sin dato",
    box: "border-sand-200 bg-sand-100 text-ink-soft",
    chip: "bg-sand-200 text-ink-soft",
    Icon: HelpCircleIcon,
  },
  favorable: {
    word: "A favor",
    box: "border-forest-700/30 bg-forest-50 text-forest-700",
    chip: "bg-forest-50 text-forest-700",
    Icon: ShieldCheckIcon,
  },
};

export default function ProfileAlertList({
  alerts,
  className = "",
}: {
  alerts: ProfileAlert[];
  className?: string;
}) {
  if (alerts.length === 0) return null;

  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {alerts.map((alert) => {
        const { word, box, Icon } = LEVEL[alert.level];
        return (
          <li key={alert.id} className={`rounded-2xl border p-3 ${box}`}>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
              <Icon size={13} />
              {word}
            </p>
            <p className="mt-1 text-sm font-bold">{alert.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-90">{alert.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
