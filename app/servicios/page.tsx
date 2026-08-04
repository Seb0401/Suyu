"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ServiceCard, { type ServiceWithDistance } from "@/components/ServiceCard";
import { WheelchairIcon } from "@/components/AccessibilityIcons";
import { ChevronDownIcon, ServiceIcon } from "@/components/Icons";
import type { ServiceCategory } from "@/lib/types";
import { readProfile } from "@/components/travelProfile";
import {
  fitsDifficulty,
  getPersonality,
  type TravelerPersonality,
} from "@/components/travelerPersonalities";

/** Orden por utilidad real en un viaje, no alfabetico. */
const CATEGORIES: { value: ServiceCategory; label: string; hint: string }[] = [
  { value: "hospedaje", label: "Hoteles", hint: "Dónde dormir" },
  { value: "restaurante", label: "Restaurantes", hint: "Dónde comer" },
  { value: "transporte", label: "Transporte", hint: "Cómo moverte" },
  { value: "actividad", label: "Actividades", hint: "Qué hacer" },
  { value: "agencia", label: "Agencias", hint: "Tours armados" },
  { value: "guia", label: "Guías", hint: "Guías oficiales" },
  { value: "artesania", label: "Artesanía", hint: "Qué llevarte" },
  { value: "movilidad", label: "Movilidad", hint: "Sillas, muletas, apoyos" },
  { value: "salud", label: "Salud", hint: "Farmacias y clínicas" },
];

/**
 * Aviso propio de la categoria "actividad".
 *
 * Un reportaje de Diario El Pueblo (2023) conto solo 7 agencias formales
 * ofreciendo deportes de aventura en toda Arequipa. Es la problematica de
 * formalizacion de TURISTON, y callarla en la pantalla donde alguien elige con
 * quien va a bajar un rio seria lo contrario de lo que hace esta app.
 */
const ACTIVITY_WARNING =
  "En Arequipa muy pocas agencias formales ofrecen deportes de aventura. Antes de contratar, pide el registro del operador y verifica que entreguen equipo de seguridad. Nosotros no verificamos el registro de ninguno.";

export default function ServiciosPage() {
  const [services, setServices] = useState<ServiceWithDistance[] | null>(null);
  const [error, setError] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [personality, setPersonality] = useState<TravelerPersonality | null>(null);
  /**
   * Deja ver las actividades que la personalidad descarta.
   *
   * El filtro NUNCA esconde en silencio: cuando oculta algo lo dice y ofrece
   * este escape. "Sin prisa" descarta el ascenso al Misti por defecto, pero
   * quien eligio esa personalidad hace tres dias sigue teniendo derecho a
   * verlo sin ir a cambiar su perfil.
   */
  const [showAllDifficulties, setShowAllDifficulties] = useState(false);

  useEffect(() => {
    setPersonality(readProfile().personality);
  }, []);
  /**
   * Acordeon con estado propio en vez de <details> nativo: hay que poder
   * cerrar todo cuando cambia el filtro de accesibilidad, y <details> guarda
   * su estado en el DOM donde React no lo alcanza.
   */
  const [open, setOpen] = useState<ServiceCategory | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => !cancelled && setServices(d.services ?? []))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Cuantas actividades quedan fuera por la dificultad que tolera la
   * personalidad. Se cuenta aparte del filtrado para poder decir el numero: un
   * "3 ocultas" es lo que convierte un filtro invisible en una decision que el
   * usuario puede revisar.
   */
  const hiddenByDifficulty = useMemo(() => {
    if (!personality || showAllDifficulties) return 0;
    return (services ?? []).filter(
      (s) =>
        (!accessibleOnly || s.wheelchair_accessible) &&
        !fitsDifficulty(personality, s.details?.difficulty),
    ).length;
  }, [services, personality, showAllDifficulties, accessibleOnly]);

  const byCategory = useMemo(() => {
    const map = new Map<ServiceCategory, ServiceWithDistance[]>();
    for (const s of services ?? []) {
      if (accessibleOnly && !s.wheelchair_accessible) continue;
      if (!showAllDifficulties && !fitsDifficulty(personality, s.details?.difficulty)) {
        continue;
      }
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [services, accessibleOnly, personality, showAllDifficulties]);

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Servicios</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dónde dormir, comer, moverte y qué hacer.{" "}
        <Link href="/explorar" className="font-semibold text-clay-600">
          Los lugares turísticos están en Lugares.
        </Link>
      </p>

      <label className="mt-4 flex items-center gap-2.5 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={accessibleOnly}
          onChange={(e) => {
            setAccessibleOnly(e.target.checked);
            setOpen(null);
          }}
          className="h-5 w-5 accent-[var(--color-forest-700)]"
        />
        <WheelchairIcon size={18} className="text-forest-700" />
        Solo con acceso confirmado
      </label>

      {/* El filtro por personalidad se anuncia y se puede deshacer aqui mismo.
          Un filtro que esconde sin decirlo se lee como catalogo incompleto. */}
      {hiddenByDifficulty > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-forest-50 px-3 py-2 text-xs text-forest-700">
          <span>
            Ocultamos <strong>{hiddenByDifficulty}</strong>{" "}
            {hiddenByDifficulty === 1 ? "actividad exigente" : "actividades exigentes"} porque
            elegiste el perfil <strong>{getPersonality(personality)?.label}</strong>.
          </span>
          <button
            type="button"
            onClick={() => {
              setShowAllDifficulties(true);
              setOpen(null);
            }}
            className="font-bold underline"
          >
            Ver todas
          </button>
        </p>
      ) : null}

      {/* bg-sand-50 + borde, no bg-sand-100: sand-100 ES el fondo de pagina en
          ambos temas, asi que ahi el aviso se leia como texto suelto sin caja. */}
      {showAllDifficulties && personality ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs text-ink-soft">
          <span>Mostrando también las actividades exigentes.</span>
          <button
            type="button"
            onClick={() => {
              setShowAllDifficulties(false);
              setOpen(null);
            }}
            className="font-bold underline"
          >
            Volver a mi perfil
          </button>
        </p>
      ) : null}

      <div aria-live="polite" className="mt-5">
        {error ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
            No pudimos cargar los servicios.
          </p>
        ) : null}

        {!services && !error ? (
          <div className="h-64 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
        ) : null}

        {services ? (
          <ul className="flex flex-col gap-3">
            {CATEGORIES.map(({ value, label, hint }) => {
              const items = byCategory.get(value) ?? [];
              const isOpen = open === value;
              const empty = items.length === 0;
              const panelId = `panel-${value}`;

              return (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : value)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    disabled={empty}
                    className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition-colors ${
                      isOpen
                        ? "border-clay-600 bg-clay-50"
                        : "border-sand-200 bg-sand-50"
                    } ${empty ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isOpen
                          ? "bg-clay-600 text-cream"
                          : "bg-sand-100 text-clay-600"
                      }`}
                    >
                      <ServiceIcon category={value} size={24} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold text-ink">{label}</span>
                      <span className="block text-xs text-ink-muted">
                        {empty
                          ? accessibleOnly
                            ? "Sin acceso confirmado todavía"
                            : "Sin entradas"
                          : `${hint} · ${items.length}`}
                      </span>
                    </span>

                    {/* La flecha rota: el estado abierto/cerrado no puede viajar
                        solo en el color de fondo (§2.3). */}
                    <ChevronDownIcon
                      size={20}
                      className={`shrink-0 text-ink-muted transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen ? (
                    <div id={panelId} className="mt-2 flex flex-col gap-2 pl-3">
                      {value === "actividad" ? (
                        <p className="rounded-2xl border border-sand-200 bg-[var(--color-amber-chip-bg)] p-3 text-xs leading-relaxed text-[var(--color-amber-text)]">
                          {ACTIVITY_WARNING}
                        </p>
                      ) : null}

                      {items.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {services && accessibleOnly ? (
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Las categorías atenuadas no tienen ningún servicio con acceso
            confirmado. Eso no significa que no sean accesibles: significa que
            no lo hemos podido verificar.
          </p>
        ) : null}
      </div>
    </div>
  );
}
