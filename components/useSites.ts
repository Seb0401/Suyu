"use client";

import { useEffect, useState } from "react";
import type { SiteWithCrowd } from "@/lib/types";

type SitesState = {
  sites: SiteWithCrowd[];
  /** "demo" = JSON semilla, "supabase" = datos en vivo, "offline" = lo sirvio el SW. */
  source: string | null;
  hour: number | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fuente unica de sitios para las pantallas. Consume /api/sites y nunca
 * data/ ni Supabase directamente (§2.2).
 *
 * Se pide desde el cliente a proposito: asi el service worker (B12) puede
 * responder con su copia en cache cuando no hay red, que es justo el caso que
 * el proyecto promete cubrir (§2.1).
 */
export function useSites(hour?: number): SitesState {
  const [state, setState] = useState<SitesState>({
    sites: [],
    source: null,
    hour: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const url = hour === undefined ? "/api/sites" : `/api/sites?hour=${hour}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setState({
          sites: data.sites ?? [],
          source: data.source ?? null,
          hour: data.hour ?? null,
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          sites: [],
          source: null,
          hour: null,
          loading: false,
          error: "No pudimos cargar los sitios.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [hour]);

  return state;
}
