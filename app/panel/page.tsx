"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import Meter from "@/components/Meter";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { useSites } from "@/components/useSites";
import { accessibilityScore } from "@/lib/filters";
import { crowdPresentation, verificationLabel } from "@/lib/crowdUi";
import type { AccessibilityReport } from "@/lib/types";

export default function PanelPage() {
  const { sites, source, hour, loading } = useSites();
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const t = useT();

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]));
  }, []);

  const total = sites.length;
  const saturated = sites.filter((s) => s.crowd_level === "alto").length;
  const verified = sites.filter((s) => s.verified_by !== null).length;

  const kpis = [
    { label: t("panel.sitios"), value: String(total) },
    { label: t("panel.saturados"), value: String(saturated) },
    { label: t("panel.verificados"), value: `${verified}/${total || 0}` },
    { label: t("panel.reportes"), value: String(reports.length) },
  ];

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-4xl">
      <h1 className="text-2xl font-extrabold text-ink">{t("panel.titulo")}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {t("panel.subtitulo")}
        {source ? (
          <>
            {" "}
            {t("panel.datos")}{" "}
            <span className="font-semibold text-ink">
              {source === "demo" ? t("panel.jsonLocal") : source}
            </span>
            {hour !== null ? ` · hora ${String(hour).padStart(2, "0")}:00` : ""}.
          </>
        ) : null}
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-3">
        {kpis.map(({ label, value }) => (
          <li key={label} className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
            <p className="text-2xl font-extrabold leading-none text-ink">{value}</p>
            <p className="mt-1 text-xs text-ink-soft">{label}</p>
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="font-extrabold text-ink">{t("panel.cobertura")}</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          {t("panel.coberturaAyuda")}
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {ACCESSIBILITY_FEATURES.map(({ key, label }) => {
            const n = sites.filter((s) => s[key]).length;
            return (
              <Meter
                key={key}
                label={label}
                value={n}
                max={total || 1}
                valueLabel={`${n} ${t("panel.deN")} ${total || 0}`}
              />
            );
          })}
        </div>
      </section>

      {/* La tabla completa por sitio es obligatoria (§6.3): es la via de lectura
          que no depende del color. */}
      <section className="mt-6">
        <h2 className="font-extrabold text-ink">{t("panel.estadoPorSitio")}</h2>
        <div className="mt-3 overflow-x-auto rounded-3xl border border-sand-200 bg-sand-50">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">
              {t("panel.tablaCaption")}
            </caption>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th scope="col" className="px-4 py-3">{t("panel.colSitio")}</th>
                <th scope="col" className="px-4 py-3">{t("panel.colOcupacion")}</th>
                <th scope="col" className="px-4 py-3">{t("panel.colNivel")}</th>
                <th scope="col" className="px-4 py-3">{t("panel.colAccesibilidad")}</th>
                <th scope="col" className="px-4 py-3">{t("panel.colDato")}</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t border-sand-200">
                  <th scope="row" className="px-4 py-3 font-semibold text-ink">
                    {site.name}
                  </th>
                  <td className="px-4 py-3 text-ink-soft">
                    {hour !== null ? `${site.crowd_profile[hour] ?? 0}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{crowdPresentation(site).label}</td>
                  <td className="px-4 py-3 text-ink-soft">{accessibilityScore(site)}%</td>
                  <td className="px-4 py-3 text-ink-soft">{verificationLabel(site)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? <p className="mt-2 text-xs text-ink-muted">{t("common.cargando")}</p> : null}
      </section>

      <section className="mt-6">
        <h2 className="font-extrabold text-ink">{t("panel.tituloReportes")}</h2>
        {reports.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-soft">
            {t("panel.sinReportes")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-3">
                <p className="text-sm font-bold text-ink">{r.site_name}</p>
                <p className="text-xs font-semibold text-[var(--color-danger-text)]">{r.issue}</p>
                {r.detail ? <p className="mt-1 text-xs text-ink-soft">{r.detail}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
