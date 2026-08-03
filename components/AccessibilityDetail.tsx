"use client";

import { useEffect, useState } from "react";
import RatingBar from "@/components/RatingBar";
import {
  BathroomIcon,
  FamilyBathroomIcon,
  GuideDogIcon,
  PetIcon,
  RampIcon,
  RestAreaIcon,
  StepsIcon,
  WheelchairIcon,
} from "@/components/AccessibilityIcons";
import { ExternalLinkIcon, HelpCircleIcon } from "@/components/Icons";
import { useT } from "@/components/i18n/LocaleProvider";
import type { SiteAccessibilityDetail } from "@/lib/types";

type Response = {
  detail: SiteAccessibilityDetail;
  guide_dog: { notice: string; law_url: string };
};

/**
 * Estado real de cada servicio de accesibilidad, con su nota y su fuente.
 *
 * Es la seccion que responde a "existe, pero ¿sirve?". Un booleano en verde no
 * distingue entre un baño adaptado completo y uno con la puerta demasiado
 * angosta para entrar con silla.
 */
export default function AccessibilityDetailSection({ siteId }: { siteId: string }) {
  const t = useT();
  const [data, setData] = useState<Response | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/accessibility?site=${siteId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  if (failed) return null;
  if (!data) return <div className="mt-4 h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />;

  const { detail, guide_dog } = data;

  const rows = [
    { key: "ramps", label: "Rampas", Icon: RampIcon, grade: detail.ramps },
    /* Gradas van justo despues de rampas: son las dos caras del mismo problema
       — una rampa buena compensa unas gradas malas, y verlas juntas es lo que
       deja leer eso de un vistazo. */
    { key: "steps", label: "Gradas y escalones", Icon: StepsIcon, grade: detail.steps },
    {
      key: "bathroom",
      label: "Baño adaptado",
      Icon: BathroomIcon,
      grade: detail.accessible_bathroom,
    },
    { key: "rest", label: "Zonas de descanso", Icon: RestAreaIcon, grade: detail.rest_areas },
    {
      key: "circulation",
      label: "Circulación en silla de ruedas",
      Icon: WheelchairIcon,
      grade: detail.wheelchair_circulation,
    },
  ];

  return (
    <section className="mt-4 rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <h2 className="font-extrabold text-ink">Estado de los servicios</h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        No solo si existen, sino en qué estado están. 1 es deficiente y 3 es en
        buen estado.
      </p>

      <ul className="mt-4 flex flex-col gap-4">
        {rows.map(({ key, label, Icon, grade }) => (
          <li key={key}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon size={17} className="text-ink-soft" />
                {label}
              </span>
              <RatingBar rating={grade.rating} />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{grade.note}</p>
            {/* La escala de gradas esta invertida respecto a las demas, y sin
                decirlo un 3 se leeria como "escaleras bonitas". */}
            {key === "steps" ? (
              <p className="mt-1 text-[11px] italic text-ink-muted">{t("a11y.gradasAyuda")}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-3 border-t border-sand-200 pt-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FamilyBathroomIcon size={17} className="text-ink-soft" />
            Baño familiar o cambiador
            {detail.has_family_bathroom === null ? (
              <span className="flex items-center gap-1 text-xs font-bold text-ink-muted">
                <HelpCircleIcon size={13} />
                Sin dato
              </span>
            ) : (
              <span
                className={`text-xs font-bold ${
                  detail.has_family_bathroom ? "text-forest-700" : "text-ink-muted"
                }`}
              >
                {detail.has_family_bathroom ? "Disponible" : "No disponible"}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{detail.family_bathroom_note}</p>
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <PetIcon size={17} className="text-ink-soft" />
            Mascotas
            <span
              className={`text-xs font-bold ${
                detail.pet_policy === "permitidas"
                  ? "text-forest-700"
                  : detail.pet_policy === "no-permitidas"
                    ? "text-[var(--color-danger-text)]"
                    : "text-ink-muted"
              }`}
            >
              {detail.pet_policy === "permitidas"
                ? "Permitidas"
                : detail.pet_policy === "no-permitidas"
                  ? "No permitidas"
                  : "Sin dato"}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-soft">{detail.pet_note}</p>
        </div>

        {/* El perro guia va aparte de "mascotas" porque es un derecho, no una
            cortesia del sitio. Mezclarlos desinformaria a quien depende de el. */}
        <p className="flex items-start gap-2 rounded-2xl bg-forest-50 p-3 text-xs text-forest-700">
          <GuideDogIcon size={17} className="mt-0.5 shrink-0" />
          <span>
            {guide_dog.notice}{" "}
            <a
              href={guide_dog.law_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold underline"
            >
              Ver la ley
              <ExternalLinkIcon size={11} />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </span>
        </p>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Fuente:{" "}
        {detail.source_url ? (
          <a
            href={detail.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-clay-600"
          >
            {detail.source_label}
            <ExternalLinkIcon size={12} />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        ) : (
          <span className="font-semibold">{detail.source_label}</span>
        )}
      </p>
    </section>
  );
}
