"use client";

import { useEffect, useRef, useState } from "react";
import Mascot from "@/components/Mascot";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { ArrowRightIcon, CheckIcon, CloseIcon } from "@/components/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { TranslationKey } from "@/components/i18n/dictionary";
import { LOCALES, LOCALE_NAME, type Locale } from "@/components/i18n/locales";
import {
  EMPTY_PROFILE,
  writeProfile,
  type Companions,
  type Interest,
  type TravelProfile,
} from "@/components/travelProfile";

const COMPANIONS: { key: Companions; labelKey: TranslationKey; hintKey: TranslationKey }[] = [
  { key: "solo", labelKey: "companion.solo", hintKey: "companion.soloAyuda" },
  { key: "pareja", labelKey: "companion.pareja", hintKey: "companion.parejaAyuda" },
  { key: "ninos", labelKey: "companion.ninos", hintKey: "companion.ninosAyuda" },
  { key: "adultos-mayores", labelKey: "companion.mayores", hintKey: "companion.mayoresAyuda" },
];

const INTERESTS: { key: Interest; labelKey: TranslationKey }[] = [
  { key: "cultura", labelKey: "interest.cultura" },
  { key: "gastronomia", labelKey: "interest.gastronomia" },
  { key: "naturaleza", labelKey: "interest.naturaleza" },
];

const A11Y_KEY: Record<string, TranslationKey> = {
  wheelchair_accessible: "a11y.sillaRuedas",
  has_ramps: "a11y.rampas",
  has_accessible_bathroom: "a11y.bano",
  has_rest_areas: "a11y.descansos",
};

const STEP_TITLE: TranslationKey[] = [
  "onboarding.p1.titulo",
  "onboarding.p2.titulo",
  "onboarding.p3.titulo",
  "onboarding.p4.titulo",
];

const STEP_NAME: TranslationKey[] = [
  "onboarding.p1.paso",
  "onboarding.p2.paso",
  "onboarding.p3.paso",
  "onboarding.p4.paso",
];

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
        on
          ? "border-forest-700 bg-forest-50 text-forest-700"
          : "border-sand-200 bg-sand-50 text-ink-soft"
      }`}
    >
      <span className="flex-1">{children}</span>
      {/* El check duplica en forma lo que el color indica (§2.3). */}
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          on ? "border-forest-700 bg-forest-700 text-cream" : "border-sand-300 text-transparent"
        }`}
      >
        <CheckIcon size={12} />
      </span>
    </button>
  );
}

export default function OnboardingDialog({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: TravelProfile;
  onClose: () => void;
  onSaved?: (profile: TravelProfile) => void;
}) {
  const { locale, setLocale, t } = useLocale();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TravelProfile>(initial ?? EMPTY_PROFILE);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ?? EMPTY_PROFILE);
    setStep(0);
    openerRef.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open, initial, onClose]);

  // Mover el foco al titulo en cada paso: si no, el lector de pantalla se queda
  // leyendo el paso anterior y el usuario no sabe que avanzo.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open, step]);

  if (!open) return null;

  function toggleCompanion(key: Companions) {
    setDraft((d) => ({
      ...d,
      companions: d.companions.includes(key)
        ? d.companions.filter((c) => c !== key)
        : [...d.companions, key],
    }));
  }

  function toggleInterest(key: Interest) {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(key)
        ? d.interests.filter((c) => c !== key)
        : [...d.interests, key],
    }));
  }

  function finish() {
    const saved: TravelProfile = { ...draft, completed_at: new Date().toISOString() };
    writeProfile(saved);
    onSaved?.(saved);
    onClose();
  }

  const last = step === STEP_TITLE.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4"
      style={{ background: "color-mix(in srgb, var(--color-scrim) 65%, transparent)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-titulo"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-sand-200 bg-sand-100 p-5 md:rounded-3xl"
      >
        {/* El selector de idioma va ARRIBA del cuestionario, no escondido en
            Perfil: quien llega y no lee espanol no puede navegar hasta alli
            para encontrarlo. */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <label htmlFor="onboarding-idioma" className="sr-only">
            {t("onboarding.idioma")}
          </label>
          <select
            id="onboarding-idioma"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs font-semibold text-ink"
          >
            {LOCALES.map((code) => (
              <option key={code} value={code} lang={code}>
                {LOCALE_NAME[code]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("onboarding.cerrarDespues")}
            className="rounded-full p-1 text-ink-muted"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Mascot size={48} state="wave" />
          <div>
            <h2
              id="onboarding-titulo"
              ref={headingRef}
              tabIndex={-1}
              className="font-extrabold text-ink outline-none"
            >
              {t(STEP_TITLE[step])}
            </h2>
            <p className="text-xs text-ink-soft">
              {t("onboarding.paso")} {step + 1} {t("onboarding.de")} {STEP_TITLE.length} ·{" "}
              {t(STEP_NAME[step])}
            </p>
          </div>
        </div>

        {/* Progreso: ademas de la barra, el texto "Paso N de 4" de arriba lo
            dice, para no depender solo de la forma. */}
        <div
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEP_TITLE.length}
          aria-label={t("onboarding.progreso")}
          className="mt-4 flex gap-1"
        >
          {STEP_TITLE.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-forest-700" : "bg-sand-200"}`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {step === 0 ? (
            <>
              <p className="text-sm text-ink-soft">{t("onboarding.p1.ayuda")}</p>
              {ACCESSIBILITY_FEATURES.map(({ key, Icon }) => (
                <Chip
                  key={key}
                  on={Boolean(draft.needs[key])}
                  onClick={() =>
                    setDraft((d) => ({ ...d, needs: { ...d.needs, [key]: !d.needs[key] } }))
                  }
                >
                  <span className="flex items-center gap-2">
                    <Icon size={17} />
                    {t(A11Y_KEY[key])}
                  </span>
                </Chip>
              ))}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="text-sm text-ink-soft">{t("onboarding.p2.ayuda")}</p>
              {COMPANIONS.map(({ key, labelKey, hintKey }) => (
                <Chip
                  key={key}
                  on={draft.companions.includes(key)}
                  onClick={() => toggleCompanion(key)}
                >
                  <span className="block">{t(labelKey)}</span>
                  <span className="block text-xs font-normal text-ink-muted">{t(hintKey)}</span>
                </Chip>
              ))}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="ob-horas" className="text-xs font-bold text-ink-soft">
                  {t("onboarding.p3.horas")}
                </label>
                <select
                  id="ob-horas"
                  value={draft.hours}
                  onChange={(e) => setDraft((d) => ({ ...d, hours: Number(e.target.value) }))}
                  className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-sm text-ink"
                >
                  {[2, 3, 4, 6, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} {t("common.horas")}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{t("onboarding.p3.intereses")}</p>
              {INTERESTS.map(({ key, labelKey }) => (
                <Chip
                  key={key}
                  on={draft.interests.includes(key)}
                  onClick={() => toggleInterest(key)}
                >
                  {t(labelKey)}
                </Chip>
              ))}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Chip
                on={draft.pace === "evitar-multitudes"}
                onClick={() => setDraft((d) => ({ ...d, pace: "evitar-multitudes" }))}
              >
                <span className="block">{t("onboarding.p4.tranquilo")}</span>
                <span className="block text-xs font-normal text-ink-muted">
                  {t("onboarding.p4.tranquiloAyuda")}
                </span>
              </Chip>
              <Chip
                on={draft.pace === "sin-preferencia"}
                onClick={() => setDraft((d) => ({ ...d, pace: "sin-preferencia" }))}
              >
                <span className="block">{t("onboarding.p4.todo")}</span>
                <span className="block text-xs font-normal text-ink-muted">
                  {t("onboarding.p4.todoAyuda")}
                </span>
              </Chip>
            </>
          ) : null}
        </div>

        <p className="mt-4 text-[11px] text-ink-muted">{t("onboarding.soloDispositivo")}</p>

        <div className="mt-4 flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-sand-200 px-4 py-2.5 text-sm font-bold text-ink-soft"
            >
              {t("common.atras")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2.5 text-sm font-bold text-ink-muted"
            >
              {t("common.ahoraNo")}
            </button>
          )}

          <button
            type="button"
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 font-bold text-cream"
          >
            {last ? t("common.guardar") : t("common.siguiente")}
            {last ? null : <ArrowRightIcon size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
