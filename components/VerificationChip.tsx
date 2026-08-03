import { HelpCircleIcon, ShieldCheckIcon } from "@/components/Icons";
import { verificationLabel } from "@/lib/crowdUi";
import type { SiteWithCrowd } from "@/lib/types";

/**
 * Procedencia del dato de accesibilidad. Un sitio sin verificar tiene que
 * decirlo en pantalla, no quedarse callado (§2.1) — de ahi que el estado "Por
 * verificar" tenga su propio icono y no sea simplemente la ausencia del chip.
 */
export default function VerificationChip({
  site,
  className = "",
}: {
  site: SiteWithCrowd;
  className?: string;
}) {
  const label = verificationLabel(site);
  const verified = site.verified_by !== null;
  const Icon = verified ? ShieldCheckIcon : HelpCircleIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
        verified ? "text-forest-700" : "text-ink-muted"
      } ${className}`}
    >
      <Icon size={14} />
      {label}
      {verified && site.verified_at ? (
        <span className="font-normal text-ink-muted">· {site.verified_at}</span>
      ) : null}
    </span>
  );
}
