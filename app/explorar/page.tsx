"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteCard from "@/components/SiteCard";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { SearchIcon } from "@/components/Icons";
import { useSites } from "@/components/useSites";
import { accessibilityScore } from "@/lib/filters";
import type { SiteWithCrowd } from "@/lib/types";

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

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<SortKey>("nombre");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = sites.filter((site) => {
      if (q && !site.name.toLowerCase().includes(q) && !site.category.toLowerCase().includes(q)) {
        return false;
      }
      return ACCESSIBILITY_FEATURES.every(({ key }) => !active[key] || site[key]);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "menos-gente") return crowdRank(a) - crowdRank(b);
      if (sort === "mas-accesible") return accessibilityScore(b) - accessibilityScore(a);
      return a.name.localeCompare(b.name, "es");
    });
  }, [sites, query, active, sort]);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-4xl">
      <h1 className="text-2xl font-extrabold text-ink">Explora Arequipa</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Filtra por lo que necesitas para moverte con tranquilidad.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-sand-200 bg-sand-50 px-4 py-2.5">
        <SearchIcon size={18} className="shrink-0 text-ink-muted" />
        <label htmlFor="filtrar" className="sr-only">
          Filtrar por nombre o categoría
        </label>
        <input
          id="filtrar"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre o categoría"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-bold text-ink-soft">Necesito</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCESSIBILITY_FEATURES.map(({ key, label, Icon }) => {
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
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center gap-2">
        <label htmlFor="orden" className="text-xs font-bold text-ink-soft">
          Ordenar por
        </label>
        <select
          id="orden"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs text-ink"
        >
          <option value="nombre">Nombre</option>
          <option value="menos-gente">Menos gente ahora</option>
          <option value="mas-accesible">Más accesible</option>
        </select>
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-ink-soft">
        {loading ? "Cargando lugares…" : `${visible.length} de ${sites.length} lugares`}
      </p>

      {error ? (
        <p className="mt-3 rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">{error}</p>
      ) : null}

      {!loading && visible.length === 0 && !error ? (
        <p className="mt-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-soft">
          Ningún lugar cumple todo lo que marcaste. Prueba quitando un filtro —
          preferimos decírtelo antes que mostrarte algo que no cumple.
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
