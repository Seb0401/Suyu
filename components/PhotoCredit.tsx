import { ExternalLinkIcon } from "@/components/Icons";
import { getSitePhoto } from "@/lib/photos";

/**
 * Credito de la foto.
 *
 * No es cortesia: las licencias CC BY y CC BY-SA EXIGEN nombrar al autor y la
 * licencia donde se muestra la obra. Por eso va pegado a la imagen y no en una
 * pagina de creditos que nadie abre.
 */
export default function PhotoCredit({ siteId }: { siteId: string }) {
  const photo = getSitePhoto(siteId);
  if (!photo) return null;

  return (
    <p className="mt-1.5 px-1 text-[11px] text-ink-muted">
      Foto: {photo.author} · {photo.license} ·{" "}
      <a
        href={photo.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-clay-600"
      >
        Wikimedia Commons
        <ExternalLinkIcon size={11} />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </a>
    </p>
  );
}
