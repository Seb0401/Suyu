import ServiceDetailChips from "@/components/ServiceDetailChips";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import {
  ExternalLinkIcon,
  HelpCircleIcon,
  PinIcon,
  ServiceIcon,
} from "@/components/Icons";
import type { TouristService } from "@/lib/types";

export type ServiceWithDistance = TouristService & {
  distance_m: number | null;
  walking_min: number | null;
  distance_from: string | null;
  registry_label: string;
};

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

export default function ServiceCard({
  service,
}: {
  service: ServiceWithDistance;
}) {
  return (
    <div className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-ink-soft">
          <ServiceIcon category={service.category} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight text-ink">{service.name}</h3>
          <p className="text-xs text-ink-muted">
            {service.provider}
            {service.price_range ? ` · ${service.price_range}` : ""}
          </p>
        </div>

        {service.wheelchair_accessible ? (
          <WheelchairIcon size={18} className="shrink-0 text-forest-700" />
        ) : null}
      </div>

      <ServiceDetailChips details={service.details} className="mt-3" />

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">{service.notes}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* El registro nunca se omite: si no esta confirmado, se dice. */}
        <span className="flex items-center gap-1.5 rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-soft">
          <HelpCircleIcon size={13} />
          {service.registry_label}
        </span>

        {service.details?.phone ? (
          <a
            href={`tel:${service.details.phone.replace(/\s/g, "")}`}
            className="rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-clay-600"
          >
            {service.details.phone}
          </a>
        ) : null}

        {/* La distancia siempre con su referencia: "194 m" a secas no responde
            "de donde", y en una lista de toda la ciudad esa es la pregunta. */}
        {service.distance_m !== null && service.distance_from ? (
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <PinIcon size={13} />
            {formatDistance(service.distance_m)} de {service.distance_from}
          </span>
        ) : null}

        {service.url ? (
          <a
            href={service.url}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-clay-600"
          >
            Ver más
            <ExternalLinkIcon size={13} />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
