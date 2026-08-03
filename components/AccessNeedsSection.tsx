"use client";

import { useState } from "react";
import {
  NEEDS_BY_TIER,
  SENSITIVE_INTRO,
  TIER_LABEL,
  type AccessNeedDefinition,
  type AccessNeedId,
} from "@/components/accessNeeds";
import type { TravelProfile } from "@/components/travelProfile";
import { CheckIcon, ChevronDownIcon, HelpCircleIcon } from "@/components/Icons";

/**
 * Necesidades de accesibilidad en Perfil.
 *
 * Las de movilidad y compañia estan a la vista. Las sensibles viven detras de
 * un boton que el usuario pulsa a proposito: preguntarle a cada turista que
 * abre la app si es sordo o si tiene una condicion cardiaca convierte el
 * onboarding en un formulario medico, y la mayoria no necesita ninguna.
 *
 * Cada opcion dice QUE HACE la app con ese dato. Pedir informacion personal sin
 * explicar para que se usa es lo que hace que la gente no la de — y aqui el
 * dato solo sirve si es cierto.
 *
 * NO lee ni escribe localStorage por su cuenta: recibe el perfil y notifica los
 * cambios. Cuando lo hacia solo, la pagina guardaba su propia copia y la ultima
 * escritura pisaba la otra — marcar una necesidad y luego elegir personalidad
 * borraba la necesidad.
 */
function NeedRow({
  need,
  on,
  onToggle,
}: {
  need: AccessNeedDefinition;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left ${
          on ? "border-forest-700 bg-forest-50" : "border-sand-200 bg-sand-50"
        }`}
      >
        {/* El check duplica en forma lo que el color indica (§2.3). */}
        <span
          aria-hidden
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            on
              ? "border-forest-700 bg-forest-700 text-cream"
              : "border-sand-300 text-transparent"
          }`}
        >
          <CheckIcon size={12} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-bold ${on ? "text-forest-700" : "text-ink"}`}
          >
            {need.label}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
            {need.effect}
          </span>

          {/* Si no tenemos el dato se dice aqui, no despues de que el usuario
              confie en un filtro que no existe (§2.1). */}
          {!need.has_data ? (
            <span className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--color-amber-text)]">
              <HelpCircleIcon size={12} className="mt-px shrink-0" />
              Todavía no tenemos este dato por sitio. Lo guardamos para avisarte
              cuando falte, no para filtrar.
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

export default function AccessNeedsSection({
  profile,
  onChange,
}: {
  profile: TravelProfile;
  onChange: (next: TravelProfile) => void;
}) {
  const [showSensitive, setShowSensitive] = useState(
    profile.sensitive_needs_enabled,
  );

  const toggle = (id: AccessNeedId) =>
    onChange({
      ...profile,
      needs: { ...profile.needs, [id]: !profile.needs[id] },
    });

  const openSensitive = () => {
    onChange({ ...profile, sensitive_needs_enabled: true });
    setShowSensitive(true);
  };

  const activeSensitive = NEEDS_BY_TIER.sensible.filter(
    (n) => profile.needs[n.id],
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {(["movilidad", "compania"] as const).map((tier) => (
        <div key={tier}>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
            {TIER_LABEL[tier]}
          </h3>
          <ul className="flex flex-col gap-2">
            {NEEDS_BY_TIER[tier].map((need) => (
              <NeedRow
                key={need.id}
                need={need}
                on={profile.needs[need.id] === true}
                onToggle={() => toggle(need.id)}
              />
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-muted">
          {TIER_LABEL.sensible}
        </h3>

        {!showSensitive ? (
          <button
            type="button"
            onClick={openSensitive}
            className="flex w-full items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">
                Añadir otras necesidades
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                {SENSITIVE_INTRO}
              </span>
            </span>
            <ChevronDownIcon size={20} className="shrink-0 text-ink-muted" />
          </button>
        ) : (
          <>
            <p className="mb-2 text-xs leading-relaxed text-ink-soft">
              {SENSITIVE_INTRO}
            </p>
            <ul className="flex flex-col gap-2">
              {NEEDS_BY_TIER.sensible.map((need) => (
                <NeedRow
                  key={need.id}
                  need={need}
                  on={profile.needs[need.id] === true}
                  onToggle={() => toggle(need.id)}
                />
              ))}
            </ul>
            {activeSensitive === 0 ? (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                No has activado ninguna, y está bien. Puedes volver cuando
                quieras.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
