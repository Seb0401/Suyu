"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteCard from "@/components/SiteCard";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { SearchIcon } from "@/components/Icons";
import { useSites } from "@/components/useSites";
import { passesKidsFilter } from "@/components/kidsInfo";
import { FamilyBathroomIcon, PetIcon } from "@/components/AccessibilityIcons";
import type { SiteAccessibilityDetail } from "@/lib/types";
import { hasAccessibilityNeeds, readProfile, travelsWithKids } from "@/components/travelProfile";
import { accessibilityScore } from "@/lib/filters";
import type { SiteWithCrowd } from "@/lib/types";
import { categoryStyle } from "@/components/SiteThumbnail";
import { useT } from "@/components/i18n/LocaleProvider";
import type { TranslationKey } from "@/components/i18n/dictionary";

const A11Y_KEY: Record<string, TranslationKey> = {
  wheelchair_accessible: "a11y.sillaRuedas",
  has_ramps: "a11y.rampas",
  has_accessible_bathroom: "a11y.bano",
  has_rest_areas: "a11y.descansos",
};

type SortKey = "nombre" | "menos-gente" | "mas-accesible";

const CROWD_ORDER: Record<string, number> = { bajo: 0, medio: 1, alto: 2 };

/** Cerrado va al final: no es "poca gente", es que no se puede entrar (§6.3). */
function crowdRank(site: SiteWithCrowd) {
  if (site.crowd_closed) return 4;
  if (site.crowd_level === null) return 3;
  return CROWD_ORDER[site.crowd_level];
}

function ExplorarContent() {
  const params = useSearchParams();
  const { sites, loading, error } = useSites();
  const t = useT();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [kidsOnly, setKidsOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("nombre");
  const [fromProfile, setFromProfile] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [familyOnly, setFamilyOnly] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);
  const [details, setDetails] = useState<SiteAccessibilityDetail[]>([]);

  useEffect(() => {
    fetch("/api/accessibility")
      .then((r) => (r.ok ? r.json() : { details: [] }))
      .then((d) => setDetails(d.details ?? []))
      .catch(() => setDetails([]));
  }, []);

  const detailById = useMemo(
    () => new Map(details.map((d) => [d.site_id, d])),
    [details],
  );

  /* Solo las categorias que existen en los datos: un filtro para una categoria
     vacia siempre devuelve cero y confunde. */
  const availableCategories = useMemo(
    () => [...new Set(sites.map((s) => s.category))].sort(),
    [sites],
  );

  /* Cuantos sitios tienen el dato CONFIRMADO. Si es 0, el filtro se deshabilita
     con su explicacion en vez de dejar que el usuario lo active y reciba una
     lista vacia que parece un error de la app. */
  const withFamilyBathroom = details.filter((d) => d.has_family_bathroom === true).length;
  const withPets = details.filter((d) => d.pet_policy === "permitidas").length;

  /* Los filtros se precargan del perfil de viaje, pero la pantalla lo DICE y
     deja quitarlos de un toque: filtrar en silencio por algo que el usuario
     respondio hace dias parece que faltan lugares. */
  useEffect(() => {
    const profile = readProfile();
    if (!profile.completed_at) return;

    const needs = hasAccessibilityNeeds(profile);
    const kids = travelsWithKids(profile);
    if (!needs && !kids) return;

    setActive({ ...(profile.needs as Record<string, boolean>) });
    setKidsOnly(kids);
    setFromProfile(true);
  }, []);

  function clearProfileFilters() {
    setActive({});
    setKidsOnly(false);
    setFromProfile(false);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = sites.filter((site) => {
      if (q && !site.name.toLowerCase().includes(q) && !site.category.toLowerCase().includes(q)) {
        return false;
      }
      if (categories.length > 0 && !categories.includes(site.category)) return false;
      if (kidsOnly && !passesKidsFilter(site.id)) return false;
      if (familyOnly && detailById.get(site.id)?.has_family_bathroom !== true) return false;
      if (petsOnly && detailById.get(site.id)?.pet_policy !== "permitidas") return false;
      return ACCESSIBILITY_FEATURES.every(({ key }) => !active[key] || site[key]);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "menos-gente") return crowdRank(a) - crowdRank(b);
      if (sort === "mas-accesible") return accessibilityScore(b) - accessibilityScore(a);
      return a.name.localeCompare(b.name, "es");
    });
  }, [sites, query, active, categories, kidsOnly, familyOnly, petsOnly, detailById, sort]);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-4xl">
      <h1 className="text-2xl font-extrabold text-ink">{t("explorar.titulo")}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {t("explorar.subtitulo")}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-sand-200 bg-sand-50 px-4 py-2.5">
        <SearchIcon size={18} className="shrink-0 text-ink-muted" />
        <label htmlFor="filtrar" className="sr-only">
          {t("explorar.filtrarLabel")}
        </label>
        <input
          id="filtrar"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("explorar.filtrarPlaceholder")}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      {fromProfile ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-forest-50 px-3 py-2 text-xs text-forest-700">
          <span className="font-semibold">{t("explorar.filtrosPerfil")}</span>
          <button type="button" onClick={clearProfileFilters} className="font-bold underline">
            {t("explorar.verTodosLugares")}
          </button>
        </p>
      ) : null}

      {/* Filtro por categoria. Usa los MISMOS iconos que marcan cada sitio en
          las tarjetas, asi que el simbolo ya viene aprendido de mirar el
          catalogo — por eso el icono sigue estando encima de la foto. */}
      <fieldset className="mt-4">
        <legend className="text-xs font-bold text-ink-soft">{t("explorar.categoria")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableCategories.map((cat) => {
            const on = categories.includes(cat);
            const { Icon } = categoryStyle(cat);
            const key = `cat.${cat}` as TranslationKey;
            return (
              <label
                key={cat}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  on
                    ? "border-clay-600 bg-clay-50 text-clay-700"
                    : "border-sand-200 bg-sand-50 text-ink-soft"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) =>
                    setCategories((prev) =>
                      e.target.checked ? [...prev, cat] : prev.filter((c) => c !== cat),
                    )
                  }
                  className="sr-only"
                />
                <Icon size={15} />
                {t(key)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-xs font-bold text-ink-soft">{t("explorar.necesito")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              kidsOnly
                ? "border-clay-600 bg-clay-50 text-clay-700"
                : "border-sand-200 bg-sand-50 text-ink-soft"
            }`}
          >
            <input
              type="checkbox"
              checked={kidsOnly}
              onChange={(e) => setKidsOnly(e.target.checked)}
              className="sr-only"
            />
            {t("explorar.aptoNinos")}
          </label>

          {/* Deshabilitados mientras ningun sitio tenga el dato confirmado.
              Dejarlos activables devolveria una lista vacia, que se lee como un
              fallo de la app y no como una falta de informacion nuestra. */}
          {[
            {
              id: "familia",
              labelKey: "explorar.banoFamiliar" as TranslationKey,
              Icon: FamilyBathroomIcon,
              on: familyOnly,
              set: setFamilyOnly,
              count: withFamilyBathroom,
            },
            {
              id: "mascotas",
              labelKey: "explorar.aceptaMascotas" as TranslationKey,
              Icon: PetIcon,
              on: petsOnly,
              set: setPetsOnly,
              count: withPets,
            },
          ].map(({ id, labelKey, Icon, on, set, count }) => (
            <label
              key={id}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                count === 0
                  ? "cursor-not-allowed border-sand-200 bg-sand-100 text-ink-muted opacity-60"
                  : on
                    ? "cursor-pointer border-forest-700 bg-forest-50 text-forest-700"
                    : "cursor-pointer border-sand-200 bg-sand-50 text-ink-soft"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={count === 0}
                onChange={(e) => set(e.target.checked)}
                className="sr-only"
              />
              <Icon size={15} />
              {t(labelKey)}
              {count === 0 ? (
                <span className="font-normal">{t("explorar.sinDatos")}</span>
              ) : null}
            </label>
          ))}

          {ACCESSIBILITY_FEATURES.map(({ key, Icon }) => {
            const on = Boolean(active[key]);
            return (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  on
                    ? "border-forest-700 bg-forest-50 text-forest-700"
                    : "border-sand-200 bg-sand-50 text-ink-soft"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setActive((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only"
                />
                <Icon size={15} />
                {t(A11Y_KEY[key])}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center gap-2">
        <label htmlFor="orden" className="text-xs font-bold text-ink-soft">
          {t("explorar.ordenar")}
        </label>
        <select
          id="orden"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs text-ink"
        >
          <option value="nombre">{t("explorar.ordenNombre")}</option>
          <option value="menos-gente">{t("explorar.ordenGente")}</option>
          <option value="mas-accesible">{t("explorar.ordenAccesible")}</option>
        </select>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-ink-soft">
        {loading
          ? t("common.cargando")
          : `${visible.length} ${t("explorar.de")} ${sites.length} ${t("explorar.resultados")}`}
      </p>

      {error ? (
        <p className="mt-3 rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">{error}</p>
      ) : null}

      {withFamilyBathroom === 0 || withPets === 0 ? (
        <p className="mt-2 rounded-2xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs text-ink-soft">
          {t("explorar.sinDatosAyuda")}
        </p>
      ) : null}

      {kidsOnly ? (
        <p className="mt-2 rounded-2xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs text-ink-soft">
          {t("explorar.aptoNinosAyuda")}
        </p>
      ) : null}

      {!loading && visible.length === 0 && !error ? (
        <p className="mt-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-soft">
          {t("explorar.sinResultados")}
        </p>
      ) : null}

      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {visible.map((site) => (
          <li key={site.id} className="contents">
            <SiteCard site={site} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-6 py-8" />}>
      <ExplorarContent />
    </Suspense>
  );
}
