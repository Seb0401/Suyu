"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StoryCard from "@/components/StoryCard";
import type { Story } from "@/lib/types";
import HeroArt from "@/components/HeroArt";
import Logo from "@/components/Logo";
import Mascot from "@/components/Mascot";
import SiteCard from "@/components/SiteCard";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatIcon,
  CrowdDensityIcon,
  SearchIcon,
} from "@/components/Icons";
import { useSites } from "@/components/useSites";

const QUICK_ACCESS = [
  { href: "/ruta", label: "Ruta accesible", tile: "bg-forest-700 text-cream", Icon: WheelchairIcon },
  { href: "/chat", label: "Suyu IA", tile: "bg-night-800 text-cream", Icon: ChatIcon },
  { href: "/panel", label: "Estado turístico", tile: "bg-clay-600 text-cream", Icon: CrowdIcon },
  { href: "/itinerario", label: "Itinerario", tile: "bg-sand-200 text-ink", Icon: CalendarIcon },
];

function CrowdIcon({ size, className }: { size?: number; className?: string }) {
  return <CrowdDensityIcon count={3} size={size} className={className} />;
}

export default function Home() {
  const { sites, loading, error } = useSites();
  const [query, setQuery] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => (r.ok ? r.json() : { stories: [] }))
      .then((d) => setStories((d.stories ?? []).slice(0, 2)))
      .catch(() => setStories([]));
  }, []);

  return (
    <div className="mx-auto max-w-md md:max-w-5xl">
      <section className="relative">
        <HeroArt className="absolute inset-x-0 top-0 h-64 w-full" />

        <div className="relative px-6 pt-8">
          <Logo size="lg" withTagline />

          {/* La tarjeta monta sobre el paisaje, como en el mockup. */}
          <div className="mt-40 rounded-3xl border border-sand-200 bg-sand-50 p-5 shadow-lg">
            <p className="text-center font-extrabold text-ink">¡Hola, viajero!</p>
            <p className="mt-0.5 text-center text-sm text-ink-soft">
              ¿A dónde quieres ir hoy?
            </p>

            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(query.trim() ? `/explorar?q=${encodeURIComponent(query.trim())}` : "/explorar");
              }}
            >
              <label htmlFor="buscar-sitio" className="sr-only">
                Busca un lugar o atractivo
              </label>
              <div className="flex items-center gap-2 rounded-full border border-sand-200 bg-sand-100 px-4 py-2.5">
                <SearchIcon size={18} className="shrink-0 text-ink-muted" />
                <input
                  id="buscar-sitio"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca un lugar o atractivo"
                  className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>

              {/* El buscador filtra el catalogo; el boton lleva al planificador
                  de ruta. Son dos acciones distintas y el mockup las muestra
                  juntas, asi que cada una dice a donde va. */}
              <button
                type="submit"
                className="rounded-full border-2 border-forest-700 px-5 py-2.5 text-sm font-bold text-forest-700"
              >
                Ver sitios que coincidan
              </button>
            </form>

            <Link
              href="/ruta"
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-clay-600 px-5 py-3 font-bold text-cream"
            >
              <WheelchairIcon size={20} />
              Buscar ruta accesible
            </Link>
          </div>
        </div>
      </section>

      <div className="andean-band mt-6" />

      <section className="px-6 pt-6" aria-labelledby="explora-titulo">
        <div className="flex items-baseline justify-between">
          <h2 id="explora-titulo" className="text-lg font-extrabold text-ink">
            Explora Arequipa
          </h2>
          <Link
            href="/explorar"
            className="flex items-center gap-1 text-sm font-semibold text-clay-600"
          >
            Ver todos
            <ArrowRightIcon size={16} />
          </Link>
        </div>

        {loading ? (
          <ul className="mt-4 flex gap-3 overflow-hidden" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-52 w-44 shrink-0 animate-pulse rounded-3xl bg-sand-200" />
            ))}
          </ul>
        ) : error ? (
          <p className="mt-4 rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
            {error} Revisa tu conexión e inténtalo de nuevo.
          </p>
        ) : (
          <ul className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
            {sites.map((site) => (
              <li key={site.id} className="md:contents">
                <SiteCard site={site} variant="carousel" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-6 pt-8" aria-labelledby="accesos-titulo">
        <h2 id="accesos-titulo" className="text-lg font-extrabold text-ink">
          Accesos rápidos
        </h2>
        <ul className="mt-4 grid grid-cols-4 gap-3">
          {QUICK_ACCESS.map(({ href, label, tile, Icon }) => (
            <li key={href}>
              <Link href={href} className="flex flex-col items-center gap-2 text-center">
                <span className={`flex h-16 w-full items-center justify-center rounded-2xl ${tile}`}>
                  <Icon size={26} />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-ink-soft">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {stories.length > 0 ? (
        <section className="px-6 pt-8" aria-labelledby="historias-titulo">
          <div className="flex items-baseline justify-between">
            <h2 id="historias-titulo" className="text-lg font-extrabold text-ink">
              Historias de viajeros
            </h2>
            <Link
              href="/historias"
              className="flex items-center gap-1 text-sm font-semibold text-clay-600"
            >
              Ver todas
              <ArrowRightIcon size={16} />
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:grid md:grid-cols-2">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="px-6 pt-8" aria-labelledby="consejo-titulo">
        <div className="flex items-center gap-4 rounded-3xl border border-sand-200 bg-clay-50 p-4">
          <Mascot size={64} state="wave" />
          <div>
            <h2 id="consejo-titulo" className="font-extrabold text-ink">
              Consejo de Suyu
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Lleva agua y bloqueador solar. En Arequipa el sol pega fuerte aunque
              el día esté fresco.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
