"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileAlertList from "@/components/ProfileAlertList";
import { buildProfileAlerts, hasAnyNeed } from "@/components/profileAlerts";
import { EMPTY_PROFILE, readProfile, type TravelProfile } from "@/components/travelProfile";
import type { SiteAccessibilityDetail, SiteWithCrowd } from "@/lib/types";

/**
 * "Para ti" en la ficha del sitio.
 *
 * Va ARRIBA de la accesibilidad general: quien declaro que no puede con
 * escaleras necesita leer eso antes que la lista completa de rasgos, no
 * despues de recorrerla entera.
 *
 * Si el usuario no declaro ninguna necesidad, no se renderiza nada — ni un
 * hueco ni una invitacion. El perfil es opcional y la ficha ya funciona sin el.
 */
export default function SiteProfileAlerts({
  site,
  quietHour,
}: {
  site: SiteWithCrowd;
  quietHour?: { hour: number; occupancy: number } | null;
}) {
  const [profile, setProfile] = useState<TravelProfile>(EMPTY_PROFILE);
  const [detail, setDetail] = useState<SiteAccessibilityDetail | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/accessibility?site=${site.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setDetail(d?.detail ?? null);
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [site.id]);

  if (!hasAnyNeed(profile) || !loaded) return null;

  const alerts = buildProfileAlerts(profile, site, detail, quietHour);
  if (alerts.length === 0) return null;

  return (
    <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-extrabold text-ink">Para ti</h2>
        <Link href="/perfil" className="text-xs font-bold text-clay-600">
          Cambiar mis necesidades
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">
        Según lo que marcaste en tu perfil. Solo lo tienes tú, en este dispositivo.
      </p>

      <ProfileAlertList alerts={alerts} className="mt-3" />
    </section>
  );
}
