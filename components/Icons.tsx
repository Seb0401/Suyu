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

export function BriefcaseIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8" />
      <path d="M4 12.5h16" />
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

export function SearchIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function PinIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
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

export function BookIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A1.5 1.5 0 0 1 5.5 21H19" />
      <path d="M8 7.5h7M8 11h5" />
    </svg>
  );
}

export function SunIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function SendIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 4 3 10.5l7 2.5 2.5 7z" />
      <path d="m10 13.5 4-4" />
    </svg>
  );
}

export function OfflineIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 3l18 18" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <path d="M5 12a10 10 0 0 1 3.5-2.3M19 12a10 10 0 0 0-8.4-2.8" />
      <path d="M12 19h.01" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 4h6v6" />
      <path d="m20 4-8.5 8.5" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

/**
 * Iconos por categoria de servicio turistico (§6.7). Las 3 categorias nuevas
 * (movilidad, salud, actividad) reciben su icono propio en B18; hasta entonces
 * caen al generico, que es preferible a dejarlas sin nada.
 */
export const SERVICE_PATHS: Record<string, string> = {
  restaurante: "M7 3v8a2 2 0 0 0 2 2v8M7 3v5M10 3v5M17 3c-1.5 2-2 4-2 7h3v11",
  guia: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 7.5v5M9.5 10h5",
  agencia: "M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8",
  transporte: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8H4zM4 15h16v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM7.5 18v2M16.5 18v2",
  hospedaje: "M4 19V7M4 11h11a4 4 0 0 1 4 4v4M4 19h16M7.5 8.5h.01",
  artesania: "M6 21V9l6-5 6 5v12M10 21v-6h4v6M9 12h.01M15 12h.01",
};

const SERVICE_FALLBACK = "M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 8V6a3 3 0 0 1 6 0v2";

export function ServiceIcon({
  category,
  size = 24,
  className,
}: IconProps & { category: string }) {
  return (
    <svg {...base(size, className)}>
      <path d={SERVICE_PATHS[category] ?? SERVICE_FALLBACK} />
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
