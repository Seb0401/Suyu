/**
 * Iconografia propia. Nada de emoji (§7.4): cambian de forma segun el sistema
 * operativo, no heredan `currentColor` y rompen la coherencia visual.
 *
 * Todos los iconos heredan el color del texto y son decorativos por defecto —
 * el texto que los acompaña es el que anuncia el significado.
 */

export type IconProps = {
  size?: number;
  className?: string;
};

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

export function HomeIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function RouteIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 4v13a3 3 0 0 0 3 3h6" />
      <path d="M20 20V9a3 3 0 0 0-3-3h-6" />
      <circle cx="4" cy="4" r="2" />
      <circle cx="20" cy="20" r="2" />
    </svg>
  );
}

export function CompassIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  );
}

export function UserIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function ChatIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.4A7.5 7.5 0 1 1 20 12Z" />
    </svg>
  );
}

export function CheckIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function CloseIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function HelpCircleIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.7-.8 1.2v.4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Densidad de gente. La CANTIDAD de siluetas es la codificacion primaria
 * (una, dos o tres); el color solo refuerza (§2.3, §7.4). Nunca se usa suelto:
 * CrowdBadge siempre le pone la etiqueta de texto al lado.
 */
export function CrowdDensityIcon({
  count,
  size = 24,
  className,
}: IconProps & { count: 1 | 2 | 3 }) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="7" r="2.6" />
      <path d="M7.8 19a4.2 4.2 0 0 1 8.4 0" />
      {count >= 2 ? (
        <>
          <circle cx="5" cy="9.5" r="2" />
          <path d="M2 19a3 3 0 0 1 2.2-2.9" />
        </>
      ) : null}
      {count >= 3 ? (
        <>
          <circle cx="19" cy="9.5" r="2" />
          <path d="M22 19a3 3 0 0 0-2.2-2.9" />
        </>
      ) : null}
    </svg>
  );
}

/** Iconos por categoria de sitio, para las miniaturas generadas. */
export function MuseumIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function ViewpointIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 18h18" />
      <path d="m4 18 5.5-8 3.5 4.5 2.5-3L21 18" />
      <circle cx="17" cy="6" r="2" />
    </svg>
  );
}

export function ChurchIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 2v4M10.5 3.5h3" />
      <path d="M12 6 6.5 10v11h11V10z" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    </svg>
  );
}

export function PlazaIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 21v-6" />
      <path d="M12 15a5 5 0 0 0 5-5 5 5 0 0 0-10 0 5 5 0 0 0 5 5Z" />
      <path d="M5 21h14" />
    </svg>
  );
}
