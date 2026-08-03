"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountSection from "@/components/AccountSection";
import Mascot from "@/components/Mascot";
import OnboardingDialog from "@/components/OnboardingDialog";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { useTheme } from "@/components/ThemeToggle";
import { ArrowRightIcon, MoonIcon } from "@/components/Icons";
import {
  EMPTY_PROFILE,
  readProfile,
  type TravelProfile,
} from "@/components/travelProfile";

const COMPANION_LABEL: Record<string, string> = {
  solo: "Viajo solo",
  pareja: "En pareja",
  ninos: "Con niños",
  "adultos-mayores": "Con adultos mayores",
};

const INTEREST_LABEL: Record<string, string> = {
  cultura: "Cultura e historia",
  gastronomia: "Gastronomía",
  naturaleza: "Naturaleza y miradores",
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

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  const needLabels = ACCESSIBILITY_FEATURES.filter(({ key }) => profile.needs[key]).map(
    ({ label }) => label,
  );
  const answered = Boolean(profile.completed_at);

  return (
    <div className="mx-auto max-w-md md:max-w-2xl">
      <section className="bg-night-800 px-6 pb-8 pt-8 text-center text-cream md:rounded-b-3xl">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-night-700 bg-night-900">
          <Mascot size={72} state="wave" />
        </span>
        <h1 className="mt-3 text-xl font-extrabold">¡Hola, viajero!</h1>
        <p className="text-sm opacity-80">Edita tus preferencias de viaje</p>
      </section>

      <section className="px-6 pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-extrabold text-ink">Tu perfil de viaje</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-bold text-clay-600"
          >
            {answered ? "Editar respuestas" : "Responder"}
          </button>
        </div>

        {answered ? (
          <div className="mt-3 flex flex-col gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4">
            <div>
              <p className="text-xs font-bold text-ink-soft">Necesito</p>
              {needLabels.length > 0 ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {needLabels.map((l) => (
                    <Tag key={l}>{l}</Tag>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">Sin requisitos de accesibilidad.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft">Viajo</p>
              {profile.companions.length > 0 ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.companions.map((c) => (
                    <Tag key={c}>{COMPANION_LABEL[c] ?? c}</Tag>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">Sin especificar.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft">Tiempo e intereses</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                <Tag>{profile.hours} horas</Tag>
                {profile.interests.map((i) => (
                  <Tag key={i}>{INTEREST_LABEL[i] ?? i}</Tag>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-ink-soft">Ritmo</p>
              <p className="mt-1 text-sm text-ink-soft">
                {profile.pace === "evitar-multitudes"
                  ? "Prefiero lugares tranquilos; te desviamos cuando algo esté saturado."
                  : "Sin preferencia; te avisamos del aforo pero no te desviamos."}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-3xl border border-dashed border-sand-300 bg-sand-50 p-4 text-sm text-ink-soft">
            Todavía no respondiste el cuestionario. Son cuatro preguntas y sirven
            para filtrar lugares y armar el itinerario a tu medida.
          </p>
        )}

        <p className="mt-2 px-1 text-xs text-ink-muted">
          Se guarda solo en este dispositivo, salvo que elijas una cuenta abajo.
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
            Tema oscuro
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
            Idioma
          </label>
          <select
            id="idioma"
            defaultValue="es"
            className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1.5 text-sm text-ink"
          >
            <option value="es">Español</option>
          </select>
        </div>
        <p className="mt-1.5 px-1 text-xs text-ink-muted">
          Por ahora la app está solo en español. El inglés está pendiente.
        </p>
      </section>

      <section className="px-6 pt-6">
        <Link
          href="/panel"
          className="flex items-center justify-between rounded-3xl border border-sand-200 bg-sand-50 px-4 py-3.5"
        >
          <span>
            <span className="block text-sm font-semibold text-ink">Estado turístico</span>
            <span className="block text-xs text-ink-muted">
              Vista para municipalidad y operadores
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
