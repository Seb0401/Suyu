"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountSection from "@/components/AccountSection";
import Mascot from "@/components/Mascot";
import OnboardingDialog from "@/components/OnboardingDialog";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { useTheme } from "@/components/ThemeToggle";
import { ArrowRightIcon, MoonIcon } from "@/components/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { LOCALES, LOCALE_NAME, type Locale } from "@/components/i18n/locales";
import {
  EMPTY_PROFILE,
  readProfile,
  type TravelProfile,
} from "@/components/travelProfile";

import type { TranslationKey } from "@/components/i18n/dictionary";

const COMPANION_KEY: Record<string, TranslationKey> = {
  solo: "companion.solo",
  pareja: "companion.pareja",
  ninos: "companion.ninos",
  "adultos-mayores": "companion.mayores",
};

const INTEREST_KEY: Record<string, TranslationKey> = {
  cultura: "interest.cultura",
  gastronomia: "interest.gastronomia",
  naturaleza: "interest.naturaleza",
};

const A11Y_KEY: Record<string, TranslationKey> = {
  wheelchair_accessible: "a11y.sillaRuedas",
  has_ramps: "a11y.rampas",
  has_accessible_bathroom: "a11y.bano",
  has_rest_areas: "a11y.descansos",
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
      {children}
    </li>
  );
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<TravelProfile>(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  const needLabels = ACCESSIBILITY_FEATURES.filter(({ key }) => profile.needs[key]).map(
    ({ key }) => t(A11Y_KEY[key]),
  );
  const answered = Boolean(profile.completed_at);

  return (
    <div className="mx-auto max-w-md md:max-w-2xl">
      <section className="bg-night-800 px-6 pb-8 pt-8 text-center text-cream md:rounded-b-3xl">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-night-700 bg-night-900">
          <Mascot size={72} state="wave" />
        </span>
        <h1 className="mt-3 text-xl font-extrabold">{t("perfil.hola")}</h1>
        <p className="text-sm opacity-80">{t("perfil.editaPreferencias")}</p>
      </section>

      <section className="px-6 pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-extrabold text-ink">{t("perfil.tuPerfil")}</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-bold text-clay-600"
          >
            {answered ? t("common.editar") : t("common.responder")}
          </button>
        </div>

        {answered ? (
          <div className="mt-3 flex flex-col gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4">
            <div>
              <p className="text-xs font-bold text-ink-soft">{t("perfil.necesito")}</p>
              {needLabels.length > 0 ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {needLabels.map((l) => (
                    <Tag key={l}>{l}</Tag>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">{t("perfil.sinRequisitos")}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft">{t("perfil.viajo")}</p>
              {profile.companions.length > 0 ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.companions.map((c) => (
                    <Tag key={c}>{COMPANION_KEY[c] ? t(COMPANION_KEY[c]) : c}</Tag>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">{t("perfil.sinEspecificar")}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft">{t("perfil.tiempoIntereses")}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                <Tag>
                  {profile.hours} {t("common.horas")}
                </Tag>
                {profile.interests.map((i) => (
                  <Tag key={i}>{INTEREST_KEY[i] ? t(INTEREST_KEY[i]) : i}</Tag>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft">{t("perfil.ritmo")}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {profile.pace === "evitar-multitudes"
                  ? t("perfil.ritmoTranquilo")
                  : t("perfil.ritmoTodo")}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-3xl border border-dashed border-sand-300 bg-sand-50 p-4 text-sm text-ink-soft">
            {t("perfil.sinResponder")}
          </p>
        )}

        <p className="mt-2 px-1 text-xs text-ink-muted">
          {t("perfil.soloDispositivo")}
        </p>
      </section>

      <section className="px-6 pt-6">
        <AccountSection onProfilePulled={setProfile} />
      </section>

      <section className="px-6 pt-6">
        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
          className="flex w-full items-center justify-between gap-3 rounded-3xl border border-sand-200 bg-sand-50 px-4 py-3.5 text-left md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <MoonIcon size={18} className="text-ink-soft" />
            {t("perfil.temaOscuro")}
          </span>
          <span
            aria-hidden
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${
              theme === "dark" ? "bg-forest-700" : "bg-sand-300"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-cream transition-transform ${
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </button>
      </section>

      <section className="px-6 pt-6">
        <div className="flex items-center justify-between rounded-3xl border border-sand-200 bg-sand-50 px-4 py-3.5">
          <label htmlFor="idioma" className="text-sm font-semibold text-ink">
            {t("perfil.idioma")}
          </label>
          <select
            id="idioma"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1.5 text-sm text-ink"
          >
            {LOCALES.map((code) => (
              /* Cada idioma se nombra EN ese idioma: quien no lee espanol tiene
                 que poder encontrar el suyo en esta lista. */
              <option key={code} value={code} lang={code}>
                {LOCALE_NAME[code]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="px-6 pt-6">
        <Link
          href="/panel"
          className="flex items-center justify-between rounded-3xl border border-sand-200 bg-sand-50 px-4 py-3.5"
        >
          <span>
            <span className="block text-sm font-semibold text-ink">{t("perfil.estadoTuristico")}</span>
            <span className="block text-xs text-ink-muted">
              {t("perfil.estadoTuristicoAyuda")}
            </span>
          </span>
          <ArrowRightIcon size={18} className="shrink-0 text-ink-muted" />
        </Link>
      </section>

      <OnboardingDialog
        open={editing}
        initial={profile}
        onClose={() => setEditing(false)}
        onSaved={setProfile}
      />
    </div>
  );
}
