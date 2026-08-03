import Link from "next/link";
import type { Story } from "@/lib/types";

const TAG_STYLE: Record<string, string> = {
  accesibilidad: "bg-forest-50 text-forest-700",
  experiencia: "bg-clay-50 text-clay-700",
  consejo: "bg-[var(--color-amber-chip-bg)] text-[var(--color-amber-text)]",
};

export default function StoryCard({
  story,
  compact = false,
}: {
  story: Story;
  compact?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
            TAG_STYLE[story.tag] ?? "bg-sand-200 text-ink-soft"
          }`}
        >
          {story.tag}
        </span>
        <Link href={`/sitio/${story.site_id}`} className="text-xs font-semibold text-clay-600">
          {story.site_name}
        </Link>
      </div>

      <h3 className="mt-2 font-extrabold leading-tight text-ink">{story.title}</h3>

      <p className={`mt-1.5 text-sm leading-relaxed text-ink-soft ${compact ? "line-clamp-3" : ""}`}>
        {story.body}
      </p>

      <p className="mt-3 text-xs text-ink-muted">
        {story.author_name} · {story.created_at}
      </p>
    </article>
  );
}
