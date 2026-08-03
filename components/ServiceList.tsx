"use client";

import { useEffect, useState } from "react";
import {
  ExternalLinkIcon,
  ServiceIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
} from "@/components/Icons";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import BusinessProfileCard from "@/components/BusinessProfileCard";
import { getAllBusinessProfiles } from "@/lib/businessProfile";
import type { BusinessAccessibilityProfile } from "@/lib/businessProfile";
import type { TouristService } from "@/lib/types";

type ServiceWithDistance = TouristService & {
  distance_m?: number;
  walking_min?: number;
  registry_label?: string;
};

/**
 * Servicios turisticos cerca de un sitio.
 *
 * `formalized` + `registry_id` es el diferenciador del proyecto, y es honesto:
 * si el registro no esta confirmado la tarjeta dice "Registro por verificar" en
 * vez de callarse. Nunca se inventa un numero de registro para que se vea mas
 * serio (§6.7).
 */
export default function ServiceList({ siteId }: { siteId: string }) {
  const [services, setServices] = useState<ServiceWithDistance[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [businessProfiles, setBusinessProfiles] = useState<BusinessAccessibilityProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/services?near=${siteId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setServices(d.services ?? []))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  // Fichas autoreportadas por negocios desde el portal /negocio (§ "Conectar
  // con la recomendacion"). Viven solo en localStorage de este dispositivo,
  // asi que el cruce por near_site_id se hace en el cliente, no via /api/services.
  useEffect(() => {
    setBusinessProfiles(getAllBusinessProfiles().filter((p) => p.near_site_id === siteId));
  }, [siteId]);

  if (failed) return null;

  if (!services) {
    return <div className="h-24 animate-pulse rounded-2xl bg-sand-200" aria-hidden />;
  }

  if (services.length === 0 && businessProfiles.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Todavía no tenemos servicios registrados cerca de aquí.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {businessProfiles.map((profile) => (
        <li key={profile.account_id}>
          <BusinessProfileCard profile={profile} />
        </li>
      ))}
      {services.map((service) => {
        const label = service.registry_label ?? (service.formalized ? "Registro formal" : "Registro por verificar");
        const Badge = service.formalized ? ShieldCheckIcon : HelpCircleIcon;

        return (
          <li
            key={service.id}
            className="flex gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-700">
              <ServiceIcon category={service.category} size={20} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{service.name}</p>
              <p className="text-xs capitalize text-ink-muted">
                {service.category}
                {service.price_range ? ` · ${service.price_range}` : ""}
                {service.walking_min !== undefined ? ` · ${service.walking_min} min a pie` : ""}
              </p>

              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-ink-soft">
                <Badge size={13} className={service.formalized ? "text-forest-700" : "text-ink-muted"} />
                {label}
              </p>

              {service.wheelchair_accessible ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-forest-700">
                  <WheelchairIcon size={13} />
                  Accesible en silla de ruedas
                </p>
              ) : null}

              {service.url ? (
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-clay-600"
                >
                  Ver sitio del proveedor
                  <ExternalLinkIcon size={13} />
                  <span className="sr-only">(se abre en una pestaña nueva)</span>
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
