import Link from "next/link";
import AccessibilityChecklist from "@/components/AccessibilityChecklist";
import CrowdBadge from "@/components/CrowdBadge";
import SiteThumbnail from "@/components/SiteThumbnail";
import VerificationChip from "@/components/VerificationChip";
import type { SiteWithCrowd } from "@/lib/types";

/**
 * Tarjeta de sitio. `variant="carousel"` es la del carrusel horizontal del
 * Inicio (ancho fijo); `variant="list"` es la de la grilla de Explorar.
 */
export default function SiteCard({
  site,
  variant = "list",
}: {
  site: SiteWithCrowd;
  variant?: "carousel" | "list";
}) {
  const isCarousel = variant === "carousel";

  return (
    <Link
      href={`/sitio/${site.id}`}
      className={`flex flex-col overflow-hidden rounded-3xl border border-sand-200 bg-sand-50 shadow-sm transition-shadow hover:shadow-md ${
        isCarousel ? "w-44 shrink-0 snap-start" : "w-full"
      }`}
    >
      <SiteThumbnail
        siteId={site.id}
        siteName={site.name}
        category={site.category}
        className={isCarousel ? "h-28 w-full" : "h-32 w-full"}
        iconSize={isCarousel ? 36 : 44}
      />

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-sm font-extrabold leading-tight text-ink">{site.name}</h3>

        <CrowdBadge site={site} className="self-start" />

        <AccessibilityChecklist site={site} compact className="mt-auto" />

        {isCarousel ? null : <VerificationChip site={site} />}
      </div>
    </Link>
  );
}
