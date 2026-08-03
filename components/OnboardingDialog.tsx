"use client";

import { useEffect, useRef, useState } from "react";
import Mascot from "@/components/Mascot";
import { ACCESSIBILITY_FEATURES } from "@/components/AccessibilityIcons";
import { ArrowRightIcon, CheckIcon, CloseIcon } from "@/components/Icons";
import {
  EMPTY_PROFILE,
  writeProfile,
  type Companions,
  type Interest,
  type TravelProfile,
} from "@/components/travelProfile";

const COMPANIONS: { key: Companions; label: string; hint: string }[] = [
  { key: "solo", label: "Solo", hint: "Máxima libertad de horario" },
  { key: "pareja", label: "En pareja", hint: "Ritmo tranquilo" },
  { key: "ninos", label: "Con niños", hint: "Te avisamos si un lugar no es apto" },
  { key: "adultos-mayores", label: "Con adultos mayores", hint: "Priorizamos descansos" },
];

const INTERESTS: { key: Interest; label: string }[] = [
  { key: "cultura", label: "Cultura e historia" },
  { key: "gastronomia", label: "Gastronomía" },
  { key: "naturaleza", label: "Naturaleza y miradores" },
];

const STEPS = ["Movilidad", "Compañía", "Tiempo", "Ritmo"] as const;

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
        on
          ? "border-forest-700 bg-forest-50 text-forest-700"
          : "border-sand-200 bg-sand-50 text-ink-soft"
      }`}
    >
      <span className="flex-1">{children}</span>
      {/* El check duplica en forma lo que el color indica (§2.3). */}
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          on ? "border-forest-700 bg-forest-700 text-cream" : "border-sand-300 text-transparent"
        }`}
      >
        <CheckIcon size={12} />
      </span>
    </button>
  );
}

export default function OnboardingDialog({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: TravelProfile;
  onClose: () => void;
  onSaved?: (profile: TravelProfile) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TravelProfile>(initial ?? EMPTY_PROFILE);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ?? EMPTY_PROFILE);
    setStep(0);
    openerRef.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open, initial, onClose]);

  // Mover el foco al titulo en cada paso: si no, el lector de pantalla se queda
  // leyendo el paso anterior y el usuario no sabe que avanzo.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open, step]);

  if (!open) return null;

  function toggleCompanion(key: Companions) {
    setDraft((d) => ({
      ...d,
      companions: d.companions.includes(key)
        ? d.companions.filter((c) => c !== key)
        : [...d.companions, key],
    }));
  }

  function toggleInterest(key: Interest) {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(key)
        ? d.interests.filter((c) => c !== key)
        : [...d.interests, key],
    }));
  }

  function finish() {
    const saved: TravelProfile = { ...draft, completed_at: new Date().toISOString() };
    writeProfile(saved);
    onSaved?.(saved);
    onClose();
  }

  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4"
      style={{ background: "color-mix(in srgb, var(--color-scrim) 65%, transparent)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-titulo"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-sand-200 bg-sand-100 p-5 md:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Mascot size={48} state="wave" />
            <div>
              <h2
                id="onboarding-titulo"
                ref={headingRef}
                tabIndex={-1}
                className="font-extrabold text-ink outline-none"
              >
                {step === 0 ? "¿Cómo te movés?" : null}
                {step === 1 ? "¿Con quién viajas?" : null}
                {step === 2 ? "¿Cuánto tiempo tienes?" : null}
                {step === 3 ? "¿Prefieres evitar multitudes?" : null}
              </h2>
              <p className="text-xs text-ink-soft">
                Paso {step + 1} de {STEPS.length} · {STEPS[step]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar y responder después"
            className="rounded-full p-1 text-ink-muted"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Progreso: ademas de la barra, el texto "Paso N de 4" de arriba lo
            dice, para no depender solo de la forma. */}
        <div
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label="Progreso del cuestionario"
          className="mt-4 flex gap-1"
        >
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-forest-700" : "bg-sand-200"}`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {step === 0 ? (
            <>
              <p className="text-sm text-ink-soft">
                Marca lo que necesitas. Filtraremos los lugares que no lo cumplen.
              </p>
              {ACCESSIBILITY_FEATURES.map(({ key, label, Icon }) => (
                <Chip
                  key={key}
                  on={Boolean(draft.needs[key])}
                  onClick={() =>
                    setDraft((d) => ({ ...d, needs: { ...d.needs, [key]: !d.needs[key] } }))
                  }
                >
                  <span className="flex items-center gap-2">
                    <Icon size={17} />
                    {label}
                  </span>
                </Chip>
              ))}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="text-sm text-ink-soft">Puedes elegir más de una.</p>
              {COMPANIONS.map(({ key, label, hint }) => (
                <Chip key={key} on={draft.companions.includes(key)} onClick={() => toggleCompanion(key)}>
                  <span className="block">{label}</span>
                  <span className="block text-xs font-normal text-ink-muted">{hint}</span>
                </Chip>
              ))}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="ob-horas" className="text-xs font-bold text-ink-soft">
                  Horas disponibles
                </label>
                <select
                  id="ob-horas"
                  value={draft.hours}
                  onChange={(e) => setDraft((d) => ({ ...d, hours: Number(e.target.value) }))}
                  className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-sm text-ink"
                >
                  {[2, 3, 4, 6, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} horas
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-ink-soft">¿Qué te interesa?</p>
              {INTERESTS.map(({ key, label }) => (
                <Chip key={key} on={draft.interests.includes(key)} onClick={() => toggleInterest(key)}>
                  {label}
                </Chip>
              ))}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Chip
                on={draft.pace === "evitar-multitudes"}
                onClick={() => setDraft((d) => ({ ...d, pace: "evitar-multitudes" }))}
              >
                <span className="block">Sí, prefiero lugares tranquilos</span>
                <span className="block text-xs font-normal text-ink-muted">
                  Te desviamos cuando un sitio esté saturado
                </span>
              </Chip>
              <Chip
                on={draft.pace === "sin-preferencia"}
                onClick={() => setDraft((d) => ({ ...d, pace: "sin-preferencia" }))}
              >
                <span className="block">Me da igual, quiero verlo todo</span>
                <span className="block text-xs font-normal text-ink-muted">
                  Igual te avisamos del aforo, sin desviarte
                </span>
              </Chip>
            </>
          ) : null}
        </div>

        <p className="mt-4 text-[11px] text-ink-muted">
          Se guarda solo en este dispositivo. No hay cuenta obligatoria ni se
          envía a ningún servidor.
        </p>

        <div className="mt-4 flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-sand-200 px-4 py-2.5 text-sm font-bold text-ink-soft"
            >
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2.5 text-sm font-bold text-ink-muted"
            >
              Ahora no
            </button>
          )}

          <button
            type="button"
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 font-bold text-cream"
          >
            {last ? "Guardar preferencias" : "Siguiente"}
            {last ? null : <ArrowRightIcon size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
