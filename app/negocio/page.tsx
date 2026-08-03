"use client";

import { useEffect, useState } from "react";
import BusinessProfileCard from "@/components/BusinessProfileCard";
import { BathroomIcon, PawIcon, RampIcon, WheelchairIcon } from "@/components/AccessibilityIcons";
import { CameraIcon, CheckIcon, CloseIcon } from "@/components/Icons";
import Mascot from "@/components/Mascot";
import { useSites } from "@/components/useSites";
import {
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  WHEELCHAIR_ACCESS_LEVELS,
  emptyProfileFor,
  getBusinessProfile,
  getCurrentBusinessAccount,
  loginBusinessAccount,
  logoutBusinessAccount,
  readFileAsDataUrl,
  registerBusinessAccount,
  saveBusinessProfile,
} from "@/lib/businessProfile";
import type {
  BusinessAccessibilityProfile,
  BusinessAccount,
  ExternalProfilePlatform,
} from "@/lib/businessProfile";
import type { ServiceCategory } from "@/lib/types";

const CATEGORIES: ServiceCategory[] = [
  "restaurante",
  "hospedaje",
  "guia",
  "agencia",
  "transporte",
  "artesania",
  "movilidad",
  "salud",
  "actividad",
];

const PLATFORM_OPTIONS: { value: ExternalProfilePlatform; label: string }[] = [
  { value: "google", label: "Google" },
  { value: "tripadvisor", label: "TripAdvisor" },
  { value: "otro", label: "Otro" },
];

const inputClass = "rounded-2xl border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink";
const labelClass = "text-xs font-bold text-ink-soft";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function NegocioPage() {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<BusinessAccount | null>(null);
  const [profile, setProfile] = useState<BusinessAccessibilityProfile | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [linkPlatform, setLinkPlatform] = useState<ExternalProfilePlatform>("google");
  const [linkUrl, setLinkUrl] = useState("");

  const { sites } = useSites();

  useEffect(() => {
    const acc = getCurrentBusinessAccount();
    setAccount(acc);
    if (acc) setProfile(getBusinessProfile(acc.id) ?? emptyProfileFor(acc));
    setReady(true);
  }, []);

  function updateProfile(patch: Partial<BusinessAccessibilityProfile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaveState("idle");
  }

  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const err =
      authMode === "register"
        ? registerBusinessAccount(email, password, businessName)
        : loginBusinessAccount(email, password);
    if (err) {
      setAuthError(err);
      return;
    }
    const acc = getCurrentBusinessAccount();
    if (!acc) {
      setAuthError("No pudimos iniciar sesión. Intenta de nuevo.");
      return;
    }
    setAccount(acc);
    setProfile(getBusinessProfile(acc.id) ?? emptyProfileFor(acc));
    setEmail("");
    setPassword("");
    setBusinessName("");
  }

  function handleLogout() {
    logoutBusinessAccount();
    setAccount(null);
    setProfile(null);
    setSaveState("idle");
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!profile) return;
    setPhotoError(null);

    let current = profile.photos;
    for (const file of files) {
      if (current.length >= MAX_PHOTOS) {
        setPhotoError(`Máximo ${MAX_PHOTOS} fotos por ficha.`);
        break;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setPhotoError("Una foto pesaba demasiado (máx. 1.5MB) y se omitió.");
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        current = [...current, dataUrl];
      } catch {
        setPhotoError("No pudimos leer una de las fotos.");
      }
    }
    updateProfile({ photos: current });
  }

  function removePhoto(index: number) {
    if (!profile) return;
    updateProfile({ photos: profile.photos.filter((_, i) => i !== index) });
  }

  function addLink() {
    if (!profile || !linkUrl.trim()) return;
    updateProfile({
      external_profiles: [...profile.external_profiles, { platform: linkPlatform, url: linkUrl.trim() }],
    });
    setLinkUrl("");
  }

  function removeLink(index: number) {
    if (!profile) return;
    updateProfile({ external_profiles: profile.external_profiles.filter((_, i) => i !== index) });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const err = saveBusinessProfile(profile);
    if (err) {
      setSaveError(err);
      setSaveState("error");
    } else {
      setSaveState("saved");
    }
  }

  return (
    <div className="mx-auto max-w-md pb-10 md:max-w-2xl">
      <section className="bg-night-800 px-6 pb-8 pt-8 text-center text-cream md:rounded-b-3xl">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-night-700 bg-night-900">
          <Mascot size={72} state="wave" />
        </span>
        <h1 className="mt-3 text-xl font-extrabold">
          {account ? account.business_name : "Portal de negocios"}
        </h1>
        <p className="text-sm opacity-80">
          {account ? "Edita tu ficha de accesibilidad" : "Registra tu local y su accesibilidad"}
        </p>
      </section>

      {!ready ? (
        <div className="px-6 pt-6">
          <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
        </div>
      ) : null}

      {ready && !account ? (
        <section className="px-6 pt-6">
          <div className="flex rounded-full border border-sand-200 bg-sand-100 p-1">
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              aria-pressed={authMode === "register"}
              className={`flex-1 rounded-full py-2 text-sm font-bold ${
                authMode === "register" ? "bg-clay-600 text-cream" : "text-ink-soft"
              }`}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              aria-pressed={authMode === "login"}
              className={`flex-1 rounded-full py-2 text-sm font-bold ${
                authMode === "login" ? "bg-clay-600 text-cream" : "text-ink-soft"
              }`}
            >
              Iniciar sesión
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="mt-4 flex flex-col gap-3">
            {authMode === "register" ? (
              <div className="flex flex-col gap-1">
                <label htmlFor="nombre-negocio" className={labelClass}>
                  Nombre del negocio
                </label>
                <input
                  id="nombre-negocio"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-1">
              <label htmlFor="correo" className={labelClass}>
                Correo
              </label>
              <input
                id="correo"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="clave" className={labelClass}>
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {authError ? (
              <p className="text-xs font-semibold text-[var(--color-danger-text)]">{authError}</p>
            ) : null}

            <button
              type="submit"
              className="rounded-full bg-clay-600 px-5 py-2.5 font-bold text-cream"
            >
              {authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            Cuenta de demostración: se guarda solo en este dispositivo, sin
            verificación de identidad real. No compartas contraseñas que uses
            en otros servicios.
          </p>
        </section>
      ) : null}

      {ready && account && profile ? (
        <>
          <section className="px-6 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold text-clay-600"
            >
              Cerrar sesión
            </button>
          </section>

          <form onSubmit={handleSave} className="flex flex-col gap-4 px-6 pt-4">
            <section className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
              <h2 className="font-extrabold text-ink">Datos del negocio</h2>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="nombre-comercial" className={labelClass}>
                    Nombre comercial
                  </label>
                  <input
                    id="nombre-comercial"
                    value={profile.business_name}
                    onChange={(e) => updateProfile({ business_name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="categoria" className={labelClass}>
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    value={profile.category}
                    onChange={(e) => updateProfile({ category: e.target.value as ServiceCategory })}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {capitalize(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="sitio-cercano" className={labelClass}>
                    Sitio turístico más cercano (opcional)
                  </label>
                  <select
                    id="sitio-cercano"
                    value={profile.near_site_id ?? ""}
                    onChange={(e) => updateProfile({ near_site_id: e.target.value || null })}
                    className={inputClass}
                  >
                    <option value="">Ninguno</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-ink-muted">
                    Si eliges uno, tu ficha aparece en &ldquo;Servicios cerca&rdquo; de ese lugar.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="direccion" className={labelClass}>
                    Dirección
                  </label>
                  <input
                    id="direccion"
                    value={profile.address}
                    onChange={(e) => updateProfile({ address: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="telefono" className={labelClass}>
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    value={profile.phone}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="ruc" className={labelClass}>
                    RUC (autoreportado, sin verificar)
                  </label>
                  <input
                    id="ruc"
                    value={profile.ruc}
                    onChange={(e) => updateProfile({ ruc: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="administrador" className={labelClass}>
                    Nombre del administrador o responsable
                  </label>
                  <input
                    id="administrador"
                    value={profile.administrator_name}
                    onChange={(e) => updateProfile({ administrator_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
              <h2 className="font-extrabold text-ink">Accesibilidad</h2>

              <div className="mt-3 flex flex-col gap-1">
                <label htmlFor="pisos" className={labelClass}>
                  Número de pisos del local
                </label>
                <input
                  id="pisos"
                  type="number"
                  min={1}
                  value={profile.floors_count ?? ""}
                  onChange={(e) =>
                    updateProfile({
                      floors_count: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className={`${inputClass} w-24`}
                />
              </div>

              <fieldset className="mt-4">
                <legend className={labelClass}>Nivel de acceso en silla de ruedas</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WHEELCHAIR_ACCESS_LEVELS.map(({ value, label }) => {
                    const on = profile.wheelchair_access_level === value;
                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          on
                            ? "border-forest-700 bg-forest-50 text-forest-700"
                            : "border-sand-200 bg-sand-100 text-ink-soft"
                        }`}
                      >
                        <input
                          type="radio"
                          name="nivel-silla"
                          checked={on}
                          onChange={() => updateProfile({ wheelchair_access_level: value })}
                          className="sr-only"
                        />
                        <WheelchairIcon size={15} />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-4">
                <legend className={labelClass}>Otras características</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { key: "has_ramps", label: "Rampas", Icon: RampIcon },
                      { key: "has_accessible_bathroom", label: "Baño accesible", Icon: BathroomIcon },
                      { key: "pet_friendly", label: "Pet-friendly", Icon: PawIcon },
                    ] as const
                  ).map(({ key, label, Icon }) => {
                    const on = profile[key];
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          on
                            ? "border-forest-700 bg-forest-50 text-forest-700"
                            : "border-sand-200 bg-sand-100 text-ink-soft"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => updateProfile({ [key]: e.target.checked })}
                          className="sr-only"
                        />
                        <Icon size={15} />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-4 flex flex-col gap-1">
                <label htmlFor="notas" className={labelClass}>
                  Notas de accesibilidad (opcional)
                </label>
                <textarea
                  id="notas"
                  rows={3}
                  value={profile.notes}
                  onChange={(e) => updateProfile({ notes: e.target.value })}
                  className={inputClass}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
              <h2 className="font-extrabold text-ink">Fotos</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Hasta {MAX_PHOTOS} fotos, máx. 1.5MB cada una. Se guardan solo en
                este dispositivo.
              </p>

              {profile.photos.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {profile.photos.map((photo, i) => (
                    <li key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs locales */}
                      <img
                        src={photo}
                        alt=""
                        className="h-16 w-16 rounded-xl border border-sand-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Quitar foto"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-night-800 text-cream"
                      >
                        <CloseIcon size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {profile.photos.length < MAX_PHOTOS ? (
                <div className="mt-3 flex flex-col gap-1">
                  <label
                    htmlFor="fotos"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-sand-300 bg-sand-100 px-4 py-3 text-sm font-semibold text-ink-soft"
                  >
                    <CameraIcon size={18} />
                    Agregar fotos
                  </label>
                  <input
                    id="fotos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotos}
                    className="sr-only"
                  />
                </div>
              ) : null}

              {photoError ? (
                <p className="mt-2 text-xs font-semibold text-[var(--color-danger-text)]">{photoError}</p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
              <h2 className="font-extrabold text-ink">Perfiles externos</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Pega el enlace a tu perfil de Google o TripAdvisor. Se muestra
                como autoreportado — Suyu no verifica ni extrae datos de esas
                plataformas.
              </p>

              {profile.external_profiles.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {profile.external_profiles.map((link, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-sand-100 px-3 py-2 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-bold text-ink">
                          {PLATFORM_OPTIONS.find((p) => p.value === link.platform)?.label}
                        </span>{" "}
                        <span className="text-ink-muted">{link.url}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        aria-label="Quitar enlace"
                        className="shrink-0 text-ink-muted"
                      >
                        <CloseIcon size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-3 flex gap-2">
                <select
                  value={linkPlatform}
                  onChange={(e) => setLinkPlatform(e.target.value as ExternalProfilePlatform)}
                  className={`${inputClass} w-32 shrink-0`}
                  aria-label="Plataforma"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  aria-label="URL del perfil"
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="shrink-0 rounded-full bg-sand-200 px-3 text-sm font-bold text-ink"
                >
                  Agregar
                </button>
              </div>
            </section>

            {saveState === "error" ? (
              <p className="text-xs font-semibold text-[var(--color-danger-text)]">{saveError}</p>
            ) : null}

            <button
              type="submit"
              className="rounded-full bg-forest-700 px-5 py-2.5 font-bold text-cream"
            >
              Guardar ficha
            </button>

            {saveState === "saved" ? (
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-forest-700">
                <CheckIcon size={14} /> Ficha guardada en este dispositivo
              </p>
            ) : null}
          </form>

          <section className="px-6 pt-6">
            <h2 className="mb-1 font-extrabold text-ink">Vista previa</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Así se verá tu ficha para un viajero.
            </p>
            <BusinessProfileCard profile={profile} />
          </section>
        </>
      ) : null}
    </div>
  );
}
