"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AccessibilityChecklist from "@/components/AccessibilityChecklist";
import AccessibilityDetailSection from "@/components/AccessibilityDetail";
import CrowdBadge from "@/components/CrowdBadge";
import CrowdChart from "@/components/CrowdChart";
import Mascot from "@/components/Mascot";
import PhotoCredit from "@/components/PhotoCredit";
import ReportDialog from "@/components/ReportDialog";
import ServiceList from "@/components/ServiceList";
import SiteDetailSection from "@/components/SiteDetailSection";
import SiteThumbnail from "@/components/SiteThumbnail";
import StoryCard from "@/components/StoryCard";
import VerificationChip from "@/components/VerificationChip";
import type { Story } from "@/lib/types";
import {
  ArrowRightIcon,
  CrowdDensityIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  PinIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import { getKidsInfo } from "@/components/kidsInfo";
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

/**
 * Aptitud para ir con niños. Siempre muestra de dónde salió el dato y, cuando
 * no está confirmado, lo dice en vez de omitir la sección (§2.1).
 */
const KIDS_KEY = {
  apto: "kids.apto",
  "con-reservas": "kids.conReservas",
  "sin-dato": "kids.sinDato",
} as const;

function KidsSection({ siteId }: { siteId: string }) {
  const t = useT();
  const info = getKidsInfo(siteId);
  if (!info) return null;

  const Badge = info.confirmed ? ShieldCheckIcon : HelpCircleIcon;

  return (
    <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <h2 className="font-extrabold text-ink">{t("sitio.irConNinos")}</h2>

      <p
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
          info.suitability === "apto"
            ? "bg-forest-50 text-forest-700"
            : info.suitability === "con-reservas"
              ? "bg-[var(--color-amber-chip-bg)] text-[var(--color-amber-text)]"
              : "bg-sand-200 text-ink-soft"
        }`}
      >
        <Badge size={14} />
        {t(KIDS_KEY[info.suitability])}
      </p>

      <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{info.note}</p>

      <p className="mt-2 text-xs text-ink-muted">
        {info.has_kids_area ? `${t("sitio.conZonaJuegos")} ` : `${t("sitio.sinZonaJuegos")} `}
        {info.confirmed ? `${t("common.fuente")} ` : `${t("sitio.datoSinConfirmar")} `}
        {info.source_url ? (
          <a
            href={info.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-clay-600"
          >
            {info.source_label}
            <ExternalLinkIcon size={12} />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        ) : (
          <span className="font-semibold">{info.source_label}</span>
        )}
      </p>
    </section>
  );
}

export default function SitioPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<CrowdResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetch(`/api/stories?site=${params.id}`)
      .then((r) => (r.ok ? r.json() : { stories: [] }))
      .then((d) => setStories(d.stories ?? []))
      .catch(() => setStories([]));
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/crowd?site=${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (failed) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
          {t("sitio.errorCarga")}
        </p>
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
      <SiteThumbnail
        siteId={site.id}
        siteName={site.name}
        category={site.category}
        className="h-48 w-full rounded-3xl"
        iconSize={52}
      />
      <PhotoCredit siteId={site.id} />

      <h1 className="mt-4 text-2xl font-extrabold leading-tight text-ink">{site.name}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <CrowdBadge site={site} />
        <VerificationChip site={site} />
      </div>

      <section className="mt-5 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="font-extrabold text-ink">{t("sitio.estadoLugar")}</h2>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-extrabold leading-none text-ink">{occupancy}%</p>
            {/* Mostramos la ocupacion estimada, no un "tiempo de espera" en
                minutos: el perfil horario es una simulacion y convertirlo en
                minutos concretos daria una precision que el dato no tiene. */}
            <p className="mt-1 text-sm text-ink-soft">
              {t("sitio.ocupacion")} {hhmm(hour)} · {presentation.label}
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
              <h2 className="font-extrabold text-ink">{t("sitio.recomienda")}</h2>

              {quiet_hour ? (
                <p className="mt-1 text-sm font-semibold text-forest-700">
                  {t("sitio.siPuedesEsperar")} {hhmm(quiet_hour.hour)}{" "}
                  {t("sitio.bajaA")} {quiet_hour.occupancy}% {t("sitio.deOcupacion")}
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
                        {crowdPresentation(alternative).label} ·{" "}
                        {t("sitio.alternativaCercana")}
                      </span>
                    </span>
                    <ArrowRightIcon size={16} className="text-ink-muted" />
                  </Link>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-bold text-clay-600">
                      {t("sitio.porQue")}
                    </summary>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                      {t("sitio.porQueTexto")}
                    </p>
                  </details>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">
                  {t("sitio.sinAlternativa")}
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <KidsSection siteId={site.id} />

      <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="font-extrabold text-ink">{t("sitio.accesibilidad")}</h2>
        <AccessibilityChecklist site={site} className="mt-3" />
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.notes}</p>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="mt-4 w-full rounded-full border-2 border-clay-600 px-4 py-2.5 text-sm font-bold text-clay-700"
        >
          {t("sitio.reportar")}
        </button>
      </section>

      {/* El detalle 1-3 va justo despues de la checklist booleana: primero
          "que hay", inmediatamente despues "en que estado esta". */}
      <AccessibilityDetailSection siteId={site.id} />

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

      {/* "Conoce mas" va DESPUES de accesibilidad y aforo, nunca antes (§6.8):
          la prioridad de esta pantalla es si puedes entrar y si esta lleno. La
          historia es para generar ganas, no para responder eso. */}
      <SiteDetailSection siteId={site.id} />

      {stories.length > 0 ? (
        <section className="mt-4">
          <h2 className="mb-1 font-extrabold text-ink">{t("sitio.historiasLugar")}</h2>
          <p className="mb-3 text-xs text-ink-muted">
            {t("sitio.historiasAyuda")}
          </p>
          <div className="flex flex-col gap-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-4">
        <h2 className="mb-3 font-extrabold text-ink">{t("sitio.serviciosCerca")}</h2>
        <ServiceList siteId={site.id} />
      </section>

      <Link
        href="/ruta"
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-night-800 px-5 py-3 font-bold text-cream"
      >
        {t("sitio.verComoLlegar")}
      </Link>
    </div>
  );
}
