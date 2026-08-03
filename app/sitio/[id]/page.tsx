"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccessibilityChecklist from "@/components/AccessibilityChecklist";
import CrowdBadge from "@/components/CrowdBadge";
import CrowdChart from "@/components/CrowdChart";
import SiteThumbnail from "@/components/SiteThumbnail";
import VerificationChip from "@/components/VerificationChip";
import type { SiteWithCrowd } from "@/lib/types";

type CrowdResponse = {
  site: SiteWithCrowd;
  saturated: boolean;
  alternative: SiteWithCrowd | null;
  quiet_hour: { hour: number; occupancy: number; level: string } | null;
  hour: number;
  source: string;
};

/*
 * B7 monta aqui el grafico de aforo. La recomendacion anti-aforo, los servicios
 * cercanos y la ficha tecnica llegan en B8 y B17.
 */
export default function SitioPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<CrowdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/crowd?site=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("No pudimos cargar este lugar."));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
      </div>
    );
  }

  const { site, quiet_hour, hour } = data;

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <SiteThumbnail category={site.category} className="h-36 w-full rounded-3xl" iconSize={52} />

      <h1 className="mt-4 text-2xl font-extrabold leading-tight text-ink">{site.name}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <CrowdBadge site={site} />
        <VerificationChip site={site} />
      </div>

      <section className="mt-5 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="font-extrabold text-ink">Accesibilidad</h2>
        <AccessibilityChecklist site={site} className="mt-3" />
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.notes}</p>
      </section>

      <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <CrowdChart
          profile={site.crowd_profile}
          currentHour={hour}
          quietHour={quiet_hour?.hour ?? null}
        />
        {quiet_hour ? (
          <p className="mt-3 text-sm font-semibold text-forest-700">
            La hora más tranquila es a las{" "}
            {String(quiet_hour.hour).padStart(2, "0")}:00, con {quiet_hour.occupancy}% de
            ocupación.
          </p>
        ) : null}
      </section>
    </div>
  );
}
