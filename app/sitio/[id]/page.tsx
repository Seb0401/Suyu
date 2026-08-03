"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccessibilityChecklist from "@/components/AccessibilityChecklist";
import CrowdBadge from "@/components/CrowdBadge";
import CrowdChart from "@/components/CrowdChart";
import Mascot from "@/components/Mascot";
import ReportDialog from "@/components/ReportDialog";
import ServiceList from "@/components/ServiceList";
import SiteThumbnail from "@/components/SiteThumbnail";
import VerificationChip from "@/components/VerificationChip";
import { ArrowRightIcon, CrowdDensityIcon, PinIcon } from "@/components/Icons";
import { crowdPresentation } from "@/lib/crowdUi";
import type { SiteWithCrowd } from "@/lib/types";

type CrowdResponse = {
  site: SiteWithCrowd;
  saturated: boolean;
  alternative: SiteWithCrowd | null;
  quiet_hour: { hour: number; occupancy: number; level: string } | null;
  hour: number;
  source: string;
};

function hhmm(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function SitioPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<CrowdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

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

  const { site, saturated, alternative, quiet_hour, hour } = data;
  const occupancy = site.crowd_profile[hour] ?? 0;
  const presentation = crowdPresentation(site);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <SiteThumbnail category={site.category} className="h-36 w-full rounded-3xl" iconSize={52} />

      <h1 className="mt-4 text-2xl font-extrabold leading-tight text-ink">{site.name}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <CrowdBadge site={site} />
        <VerificationChip site={site} />
      </div>

      <section className="mt-5 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="font-extrabold text-ink">Estado del lugar</h2>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-extrabold leading-none text-ink">{occupancy}%</p>
            {/* Mostramos la ocupacion estimada, no un "tiempo de espera" en
                minutos: el perfil horario es una simulacion y convertirlo en
                minutos concretos daria una precision que el dato no tiene. */}
            <p className="mt-1 text-sm text-ink-soft">
              Ocupación estimada a las {hhmm(hour)} · {presentation.label}
            </p>
          </div>
          <CrowdDensityIcon
            count={site.crowd_closed || site.crowd_level === null ? 1 : site.crowd_level === "alto" ? 3 : site.crowd_level === "medio" ? 2 : 1}
            size={44}
            className="shrink-0 text-ink-muted"
          />
        </div>
        <p className="mt-2 text-sm text-ink-soft">{presentation.advice}</p>
      </section>

      {saturated ? (
        <section className="mt-4 rounded-3xl border border-sand-200 bg-clay-50 p-4">
          <div className="flex items-start gap-3">
            <Mascot size={56} state="map" />
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold text-ink">Suyu recomienda</h2>

              {quiet_hour ? (
                <p className="mt-1 text-sm font-semibold text-forest-700">
                  Si puedes esperar, a las {hhmm(quiet_hour.hour)} baja a{" "}
                  {quiet_hour.occupancy}% de ocupación.
                </p>
              ) : null}

              {alternative ? (
                <>
                  <Link
                    href={`/sitio/${alternative.id}`}
                    className="mt-3 flex items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-3"
                  >
                    <PinIcon size={18} className="shrink-0 text-forest-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{alternative.name}</span>
                      <span className="block text-xs text-ink-soft">
                        {crowdPresentation(alternative).label} · alternativa cercana
                      </span>
                    </span>
                    <ArrowRightIcon size={16} className="text-ink-muted" />
                  </Link>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold text-clay-600">
                      ¿Por qué esta recomendación?
                    </summary>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                      Este lugar está saturado ahora mismo. Buscamos primero otro
                      sitio de la misma categoría con menos gente y, si no hay,
                      el más cercano que esté menos congestionado.
                    </p>
                  </details>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">
                  No encontramos una alternativa menos concurrida cerca.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="font-extrabold text-ink">Accesibilidad</h2>
        <AccessibilityChecklist site={site} className="mt-3" />
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.notes}</p>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="mt-4 w-full rounded-full border-2 border-clay-600 px-4 py-2.5 text-sm font-bold text-clay-700"
        >
          Reportar un problema aquí
        </button>
      </section>

      <ReportDialog
        siteId={site.id}
        siteName={site.name}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <CrowdChart
          profile={site.crowd_profile}
          currentHour={hour}
          quietHour={quiet_hour?.hour ?? null}
        />
      </section>

      <section className="mt-4">
        <h2 className="mb-3 font-extrabold text-ink">Servicios cerca</h2>
        <ServiceList siteId={site.id} />
      </section>

      <Link
        href="/ruta"
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-night-800 px-5 py-3 font-bold text-cream"
      >
        Ver cómo llegar
      </Link>
    </div>
  );
}
