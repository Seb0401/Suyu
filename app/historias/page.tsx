"use client";

import { useEffect, useState } from "react";
import StoryCard from "@/components/StoryCard";
import type { Story } from "@/lib/types";

export default function HistoriasPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setStories(d.stories ?? []))
      .catch(() => setError("No pudimos cargar las historias."));
  }, []);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Historias de viajeros</h1>

      {/* Decir quien escribe esto importa: son notas del equipo, no reseñas de
          usuarios. Presentarlas como testimonios ajenos seria falsear la
          procedencia igual que inventar una calificacion (§2.1). */}
      <p className="mt-1 text-sm text-ink-soft">
        Notas cortas escritas por el equipo de Suyu tras visitar cada lugar.
        Todavía no hay envíos de viajeros: publicar textos sin moderar habría
        sido peor que no tenerlos.
      </p>

      {error ? (
        <p className="mt-5 rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
          {error}
        </p>
      ) : null}

      {!stories && !error ? (
        <div className="mt-5 flex flex-col gap-3" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-sand-200" />
          ))}
        </div>
      ) : null}

      {stories ? (
        <div className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
