"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import StoryCard from "@/components/StoryCard";
import type { Story } from "@/lib/types";

export default function HistoriasPage() {
  const t = useT();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setStories(d.stories ?? []))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">{t("historias.titulo")}</h1>

      {/* Decir quien escribe esto importa: son notas del equipo, no reseñas de
          usuarios. Presentarlas como testimonios ajenos seria falsear la
          procedencia igual que inventar una calificacion (§2.1). */}
      <p className="mt-1 text-sm text-ink-soft">
        {t("historias.subtitulo")}
      </p>

      {failed ? (
        <p className="mt-5 rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
          {t("historias.error")}
        </p>
      ) : null}

      {!stories && !failed ? (
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
