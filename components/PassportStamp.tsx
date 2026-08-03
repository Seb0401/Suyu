"use client";

import { useId } from "react";
import { LockIcon } from "@/components/Icons";
import { categoryIcon } from "@/components/SiteThumbnail";

/**
 * Medalla del pasaporte: un escudo con acabado metalico (bronce/cobre/plata/
 * oro segun el nivel actual) cuando el sitio ya tiene estampa, o un contorno
 * punteado con candado cuando todavia no. Inspirado en la referencia visual
 * del equipo (medallas grabadas con forma de blason).
 *
 * El icono se compone SOBRE el SVG del escudo en vez de anidarlo adentro
 * (mas simple que un <svg> dentro de otro <svg>): un contenedor relativo con
 * el escudo de fondo y el icono centrado encima.
 */

const SHIELD_PATH =
  "M50 4 C24 4 10 16 10 32 C10 58 26 80 50 94 C74 80 90 58 90 32 C90 16 76 4 50 4 Z";

export default function PassportStamp({
  earned,
  category,
  metalFrom,
  metalTo,
  iconTone = "light",
  tilt = 0,
  size = 84,
}: {
  earned: boolean;
  category: string;
  metalFrom?: string;
  metalTo?: string;
  iconTone?: "light" | "dark";
  tilt?: number;
  size?: number;
}) {
  const gradientId = useId();
  const Icon = categoryIcon(category);
  const accent = iconTone === "dark" ? "var(--color-scrim)" : "var(--color-cream)";
  // Icons.tsx no acepta `style`, solo `className` — de ahi el color via clase
  // arbitraria en vez de pasarlo como estilo inline.
  const iconColorClass = iconTone === "dark" ? "text-[var(--color-scrim)]" : "text-cream";

  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        transform: earned && tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="absolute inset-0"
        aria-hidden
        focusable="false"
      >
        {earned ? (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={metalFrom} />
              <stop offset="100%" stopColor={metalTo} />
            </linearGradient>
          </defs>
        ) : null}
        <path
          d={SHIELD_PATH}
          fill={earned ? `url(#${gradientId})` : "var(--color-sand-100)"}
          stroke={earned ? accent : "var(--color-sand-300)"}
          strokeOpacity={earned ? 0.7 : 1}
          strokeWidth={earned ? 2 : 3}
          strokeDasharray={earned ? undefined : "5 4"}
        />
        {/* Fila de puntos, guiño al braille que ya usa la app para no cargar
            el significado solo en color (§2.3) — aca es puro ornamento. */}
        {earned ? (
          <g opacity={0.8}>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={38 + i * 8} cy={83} r={1.7} fill={accent} />
            ))}
          </g>
        ) : null}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pb-2">
        {earned ? (
          <Icon size={Math.round(size * 0.32)} className={iconColorClass} />
        ) : (
          <LockIcon size={Math.round(size * 0.26)} className="text-ink-muted" />
        )}
      </div>
    </div>
  );
}
