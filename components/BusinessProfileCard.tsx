import { BathroomIcon, PawIcon, RampIcon, WheelchairIcon } from "@/components/AccessibilityIcons";
import { ExternalLinkIcon, HelpCircleIcon, ServiceIcon } from "@/components/Icons";
import { WHEELCHAIR_ACCESS_LEVELS } from "@/lib/businessProfile";
import type {
  BusinessAccessibilityProfile,
  ExternalProfilePlatform,
} from "@/lib/businessProfile";

const PLATFORM_LABELS: Record<ExternalProfilePlatform, string> = {
  google: "Perfil de Google",
  tripadvisor: "Perfil de TripAdvisor",
  otro: "Otro perfil",
};

function wheelchairLabel(level: BusinessAccessibilityProfile["wheelchair_access_level"]) {
  return WHEELCHAIR_ACCESS_LEVELS.find((l) => l.value === level)?.label ?? "Sin evaluar";
}

/**
 * Tarjeta de una ficha de negocio autoreportada (portal /negocio). Se usa
 * tanto en la vista previa del portal como, integrada en ServiceList, en la
 * ficha pública del sitio (§ "Conectar con la recomendación" del plan).
 *
 * Todo el contenido es declarado por el propio negocio y nunca se presenta
 * como verificado por Suyu — el badge de procedencia va primero, igual que
 * en /agencias (§6.10 de CLAUDE.md).
 */
export default function BusinessProfileCard({
  profile,
}: {
  profile: BusinessAccessibilityProfile;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-sand-50 p-3">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-700">
          <ServiceIcon category={profile.category} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{profile.business_name}</p>
          <p className="text-xs capitalize text-ink-muted">{profile.category}</p>

          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-ink-soft">
            <HelpCircleIcon size={13} className="text-ink-muted" />
            Autoreportado por el negocio · sin verificar
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-ink-soft">
        <li className="flex items-center gap-1">
          <WheelchairIcon size={14} />
          {wheelchairLabel(profile.wheelchair_access_level)}
        </li>
        {profile.floors_count !== null ? (
          <li>
            {profile.floors_count} {profile.floors_count === 1 ? "piso" : "pisos"}
          </li>
        ) : null}
        {profile.has_ramps ? (
          <li className="flex items-center gap-1">
            <RampIcon size={14} />
            Rampas
          </li>
        ) : null}
        {profile.has_accessible_bathroom ? (
          <li className="flex items-center gap-1">
            <BathroomIcon size={14} />
            Baño accesible
          </li>
        ) : null}
        {profile.pet_friendly ? (
          <li className="flex items-center gap-1">
            <PawIcon size={14} />
            Pet-friendly
          </li>
        ) : null}
      </ul>

      {profile.ruc || profile.administrator_name ? (
        <p className="mt-2 text-[11px] text-ink-muted">
          {profile.ruc ? `RUC ${profile.ruc} (autoreportado)` : null}
          {profile.ruc && profile.administrator_name ? " · " : null}
          {profile.administrator_name ? `Responsable: ${profile.administrator_name}` : null}
        </p>
      ) : null}

      {profile.notes ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{profile.notes}</p>
      ) : null}

      {profile.photos.length > 0 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {profile.photos.map((photo, i) => (
            <li key={i} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URLs locales, sin optimizacion de Next */}
              <img
                src={photo}
                alt=""
                className="h-16 w-16 rounded-xl border border-sand-200 object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {profile.external_profiles.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1">
          {profile.external_profiles.map((link, i) => (
            <li key={i}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-clay-600"
              >
                {PLATFORM_LABELS[link.platform]}
                <ExternalLinkIcon size={12} />
                <span className="sr-only">(se abre en una pestaña nueva, enlace autoreportado)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
