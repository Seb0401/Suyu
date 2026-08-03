/**
 * Iconos de accesibilidad. Separados de Icons.tsx porque son el vocabulario
 * central de la app: aparecen en tarjetas, en la ruta y en el detalle del
 * sitio, y siempre van acompañados de su etiqueta de texto.
 */

import type { ComponentType } from "react";
import type { IconProps } from "@/components/Icons";

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    focusable: false as const,
  };
}

export function WheelchairIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6.5v5h4.5" />
      <circle cx="11" cy="16" r="5.5" />
      <path d="M16.5 11.5 19 18.5h2" />
    </svg>
  );
}

export function RampIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 19h18" />
      <path d="M20 19V8L4 19" />
      <path d="m9 15 2.5-1.8" />
    </svg>
  );
}

export function BathroomIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="15.2" cy="12" r="1.1" />
      <path d="M9 7.5h2.5" />
    </svg>
  );
}

export function RestAreaIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 11h18" />
      <path d="M4 7.5h16" />
      <path d="M5 11v7M19 11v7" />
      <path d="M5 15h14" />
    </svg>
  );
}

/** Las 4 dimensiones de accesibilidad que trae cada sitio, en orden fijo. */
export const ACCESSIBILITY_FEATURES: {
  key: "wheelchair_accessible" | "has_ramps" | "has_accessible_bathroom" | "has_rest_areas";
  label: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { key: "wheelchair_accessible", label: "Silla de ruedas", Icon: WheelchairIcon },
  { key: "has_ramps", label: "Rampas", Icon: RampIcon },
  { key: "has_accessible_bathroom", label: "Baño accesible", Icon: BathroomIcon },
  { key: "has_rest_areas", label: "Zonas de descanso", Icon: RestAreaIcon },
];
