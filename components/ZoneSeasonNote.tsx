"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, SunIcon } from "@/components/Icons";

type Zone = {
  id: string;
  name: string;
  current: "optimo" | "bueno" | "lleno" | "evitar" | "regular";
  sweet_spot_reason: string;
  avoid_reason: string;
  crowd_reason: string;
};

/**
 * Aviso de temporada en la ficha del sitio.
 *
 * Solo aparece cuando el mes actual dice algo: si estas en la mejor epoca, en
 * la peor, o en una buena pero saturada. En un mes "normal" no se muestra —
 * un aviso que sale siempre deja de leerse.
 */
export default function ZoneSeasonNote({ siteId }: { siteId: string }) {
  const [zone, setZone] = useState<Zone | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/zones?site=${siteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setZone(d?.zone ?? null))
      .catch(() => {
        /* Sin zona no hay aviso. No es un error que el usuario deba ver. */
      });
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  if (!zone) return null;

  const message =
    zone.current === "optimo"
      ? zone.sweet_spot_reason
      : zone.current === "evitar"
        ? zone.avoid_reason
        : zone.current === "lleno"
          ? zone.crowd_reason
          : null;

  if (!message) return null;

  const tone =
    zone.current === "optimo"
      ? "border-forest-700 bg-forest-50"
      : zone.current === "evitar"
        ? "border-sand-200 bg-clay-50"
        : "border-sand-200 bg-[var(--color-amber-chip-bg)]";

  const heading =
    zone.current === "optimo"
      ? "Estás en la mejor época"
      : zone.current === "evitar"
        ? "No es la mejor época"
        : "Buena época, pero llena";

  return (
    <Link
      href="/cuando-ir"
      className={`mt-4 flex items-start gap-3 rounded-3xl border p-4 ${tone}`}
    >
      <SunIcon size={20} className="mt-0.5 shrink-0 text-clay-600" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-ink">{heading}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
          {message}
        </span>
      </span>
      <ArrowRightIcon size={16} className="mt-1 shrink-0 text-ink-muted" />
    </Link>
  );
}
