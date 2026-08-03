"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mascot from "@/components/Mascot";
import { useTheme } from "@/components/ThemeToggle";
import { ArrowRightIcon, CheckIcon, MoonIcon, StampIcon } from "@/components/Icons";

const STORAGE_KEY = "suyu:prefs";

const PREFERENCES = [
  { key: "adultos-mayores", label: "Viajo con adultos mayores" },
  { key: "rutas-accesibles", label: "Necesito rutas accesibles" },
  { key: "cultura", label: "Cultura" },
  { key: "gastronomia", label: "Gastronomía" },
  { key: "aventura", label: "Aventura" },
];

export default function PerfilPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      /* localStorage puede estar bloqueado (modo privado). No es critico: las
         preferencias son comodidad, no requisito para usar la app. */
    }
    setLoaded(true);
  }, []);

  function toggle(key: string) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ver arriba */
      }
      return next;
    });
  }

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
        <h2 className="font-extrabold text-ink">Preferencias de viaje</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Se guardan solo en este dispositivo. No hay cuenta ni servidor detrás.
        </p>

        <ul className="mt-4 flex flex-col divide-y divide-sand-200 rounded-3xl border border-sand-200 bg-sand-50">
          {PREFERENCES.map(({ key, label }) => {
            const on = Boolean(prefs[key]);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-pressed={on}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-semibold text-ink">{label}</span>
                  {/* El check dentro del circulo duplica en forma lo que el
                      color indica (§2.3); aria-pressed lo expone al lector. */}
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      on
                        ? "border-forest-700 bg-forest-700 text-cream"
                        : "border-sand-300 text-transparent"
                    }`}
                  >
                    <CheckIcon size={14} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!loaded ? <p className="mt-2 text-xs text-ink-muted">Cargando preferencias…</p> : null}
      </section>

      {/* En movil no hay header de escritorio, asi que el toggle de tema vive
          aqui — si no, no habria forma de cambiarlo desde el celular (§7.6). */}
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
        {/* Decir que solo hay un idioma es mas honesto que ofrecer opciones que
            no traducen nada. */}
        <p className="mt-1.5 px-1 text-xs text-ink-muted">
          Por ahora la app está solo en español. El inglés está pendiente.
        </p>
      </section>

      <section className="px-6 pt-6">
        <Link
          href="/pasaporte"
          className="flex items-center justify-between rounded-3xl border border-sand-200 bg-sand-50 px-4 py-3.5"
        >
          <span className="flex items-center gap-2">
            <StampIcon size={18} className="text-forest-700" />
            <span>
              <span className="block text-sm font-semibold text-ink">Pasaporte Arequipeño</span>
              <span className="block text-xs text-ink-muted">
                Tus estampas, calificaciones y nivel
              </span>
            </span>
          </span>
          <ArrowRightIcon size={18} className="shrink-0 text-ink-muted" />
        </Link>
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

      <section className="px-6 pt-3">
        <Link
          href="/negocio"
          className="flex items-center justify-between rounded-3xl border border-sand-200 bg-sand-50 px-4 py-3.5"
        >
          <span>
            <span className="block text-sm font-semibold text-ink">¿Tienes un negocio?</span>
            <span className="block text-xs text-ink-muted">
              Registra tu local y su accesibilidad
            </span>
          </span>
          <ArrowRightIcon size={18} className="shrink-0 text-ink-muted" />
        </Link>
      </section>
    </div>
  );
}
