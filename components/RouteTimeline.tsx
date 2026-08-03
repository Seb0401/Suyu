"use client";

import {
  BathroomIcon,
  RampIcon,
  RestAreaIcon,
  WheelchairIcon,
} from "@/components/AccessibilityIcons";
import { CheckIcon, CloseIcon, PinIcon, type IconProps } from "@/components/Icons";
import { useT } from "@/components/i18n/LocaleProvider";
import type { ComponentType } from "react";

export type Milestone = {
  site_id: string;
  site_name: string;
  label: string;
  ok: boolean;
};

/**
 * El icono se elige por palabra clave de la etiqueta porque la API manda texto
 * ("Rampa disponible" / "Sin rampa"), no un codigo. Si no reconoce ninguna,
 * cae al pin generico en vez de quedarse sin icono.
 */
function iconFor(label: string): ComponentType<IconProps> {
  const l = label.toLowerCase();
  if (l.includes("silla")) return WheelchairIcon;
  if (l.includes("rampa")) return RampIcon;
  if (l.includes("bano") || l.includes("baño")) return BathroomIcon;
  if (l.includes("descanso")) return RestAreaIcon;
  return PinIcon;
}

function Endpoint({ name, role }: { name: string; role: string }) {
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      <span className="absolute left-[15px] top-8 h-full w-0.5 bg-sand-200 last:hidden" />
      <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night-800 text-cream">
        <PinIcon size={17} />
      </span>
      <span>
        <span className="block font-bold text-ink">{name}</span>
        <span className="block text-xs text-ink-muted">{role}</span>
      </span>
    </li>
  );
}

export default function RouteTimeline({
  originName,
  destinationName,
  milestones,
}: {
  originName: string;
  destinationName: string;
  milestones: Milestone[];
}) {
  const t = useT();

  return (
    <ol className="relative">
      <Endpoint name={originName} role={t("ruta.inicio")} />

      {milestones.map((m, i) => {
        const Icon = iconFor(m.label);
        return (
          <li key={`${m.site_id}-${i}`} className="relative flex gap-3 pb-6">
            <span className="absolute left-[15px] top-8 h-full w-0.5 bg-sand-200" />
            <span
              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.ok ? "bg-forest-100 text-forest-700" : "bg-sand-200 text-ink-muted"
              }`}
            >
              <Icon size={17} />
            </span>
            <span className="flex flex-1 items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-ink">{m.label}</span>
                <span className="block text-xs text-ink-muted">{m.site_name}</span>
              </span>
              {/* El aspa/check duplica en forma lo que el color ya dice (§2.3). */}
              <span className={m.ok ? "text-forest-700" : "text-ink-muted"}>
                {m.ok ? <CheckIcon size={16} /> : <CloseIcon size={16} />}
                <span className="sr-only">{m.ok ? "disponible" : "no disponible"}</span>
              </span>
            </span>
          </li>
        );
      })}

      <Endpoint name={destinationName} role={t("ruta.destino")} />
    </ol>
  );
}
