"use client";

import type { AccessNeedId } from "@/components/accessNeeds";
import type { TravelProfile } from "@/components/travelProfile";
import type { SiteAccessibilityDetail, SiteWithCrowd } from "@/lib/types";

/**
 * Traduce el perfil del usuario a avisos concretos sobre un sitio.
 *
 * Existe como modulo aparte, y no dentro de una pantalla, porque el mismo aviso
 * tiene que salir en la ficha del sitio y en cada parada del itinerario. Si
 * viviera en una de las dos, la otra terminaria con una copia que se desincroniza.
 *
 * TRES REGLAS que lo gobiernan:
 *
 * 1. Solo se emite un aviso cuando el usuario declaro esa necesidad. Nadie que
 *    no marco nada ve una pantalla llena de advertencias.
 * 2. Un aviso siempre dice POR QUE, con el dato concreto que lo dispara. "No
 *    apto" sin explicacion no le sirve a nadie para decidir.
 * 3. Cuando el dato no existe se emite igual, en tono "sin dato". Callar es
 *    peor: deja creer que se comprobo y salio bien (§2.1).
 */

export type AlertLevel = "bloqueo" | "atencion" | "sin-dato" | "favorable";

export interface ProfileAlert {
  id: string;
  need: AccessNeedId;
  level: AlertLevel;
  title: string;
  detail: string;
}

/** Altitud desde la que se avisa a quien declaro condicion cardiaca o respiratoria. */
const ALTITUDE_WARN_M = 3000;

function hhmm(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function buildProfileAlerts(
  profile: TravelProfile,
  site: SiteWithCrowd,
  detail: SiteAccessibilityDetail | null,
  quietHour?: { hour: number; occupancy: number } | null,
): ProfileAlert[] {
  const needs = profile.needs;
  const alerts: ProfileAlert[] = [];

  // --- escaleras -------------------------------------------------------
  if (needs.avoid_steps) {
    const steps = detail?.steps;
    if (!steps || steps.rating === null) {
      alerts.push({
        id: "steps-sin-dato",
        need: "avoid_steps",
        level: "sin-dato",
        title: "No sabemos cuántos escalones tiene",
        detail:
          "No tenemos la calificación de escalones de este lugar, así que no podemos confirmarte que puedas entrar sin subir ninguno.",
      });
    } else if (steps.rating === 1) {
      /* La escala de gradas esta invertida: 1 es el PEOR caso (muchas gradas o
         muy altas), por eso dispara el aviso mas fuerte. */
      alerts.push({
        id: "steps-bloqueo",
        need: "avoid_steps",
        level: "bloqueo",
        title: "Tiene escalones difíciles de evitar",
        detail: steps.note,
      });
    } else if (steps.rating === 2) {
      alerts.push({
        id: "steps-atencion",
        need: "avoid_steps",
        level: "atencion",
        title: "Tiene algún escalón",
        detail: steps.note,
      });
    }
  }

  // --- pendientes ------------------------------------------------------
  if (needs.avoid_steep_slopes && detail) {
    const mentions = [detail.wheelchair_circulation.note, detail.ramps.note]
      .filter((n) => /pendiente|inclinaci|cuesta/i.test(n))
      .join(" ");
    if (mentions) {
      alerts.push({
        id: "pendiente",
        need: "avoid_steep_slopes",
        level: "atencion",
        title: "El acceso tiene pendiente",
        detail: mentions,
      });
    }
  }

  // --- altitud ---------------------------------------------------------
  if (needs.cardiac_or_respiratory) {
    if (!detail || detail.altitude_m === null) {
      alerts.push({
        id: "altitud-sin-dato",
        need: "cardiac_or_respiratory",
        level: "sin-dato",
        title: "No tenemos la altitud de este lugar",
        detail: "Consúltala antes de ir si la altura te afecta.",
      });
    } else if (detail.altitude_m >= ALTITUDE_WARN_M) {
      alerts.push({
        id: "altitud-alta",
        need: "cardiac_or_respiratory",
        level: "bloqueo",
        title: `Está a ${detail.altitude_m.toLocaleString("es-PE")} m de altura`,
        detail: `${detail.altitude_note} A esa altitud el aire tiene bastante menos oxígeno que en la ciudad. Consulta con tu médico antes de subir y considera dormir una noche en Arequipa para aclimatarte.`,
      });
    } else {
      alerts.push({
        id: "altitud-ciudad",
        need: "cardiac_or_respiratory",
        level: "atencion",
        title: `Está a ${detail.altitude_m.toLocaleString("es-PE")} m de altura`,
        detail: `${detail.altitude_note} Es la altitud normal de Arequipa: bastante más que el nivel del mar, pero muy por debajo del Colca.`,
      });
    }
  }

  // --- sensibilidad sensorial ------------------------------------------
  if (needs.sensory_sensitivity) {
    if (site.crowd_closed) {
      /* Cerrado no es "tranquilo": no se puede entrar. No se emite aviso. */
    } else if (site.crowd_level === "alto") {
      alerts.push({
        id: "sensorial-lleno",
        need: "sensory_sensitivity",
        level: "bloqueo",
        title: "Ahora mismo está muy concurrido",
        detail: quietHour
          ? `Si puedes esperar, a las ${hhmm(quietHour.hour)} baja a ${quietHour.occupancy}% de ocupación.`
          : "No encontramos una hora claramente más tranquila hoy.",
      });
    } else if (site.crowd_level === "medio") {
      alerts.push({
        id: "sensorial-medio",
        need: "sensory_sensitivity",
        level: "atencion",
        title: "Hay algo de gente",
        detail: quietHour
          ? `A las ${hhmm(quietHour.hour)} suele estar más tranquilo.`
          : "Se puede recorrer, pero no está vacío.",
      });
    }
  }

  // --- baño adaptado: existe pero no sirve -----------------------------
  if (needs.has_accessible_bathroom && detail) {
    const b = detail.accessible_bathroom;
    if (b.rating === 1) {
      alerts.push({
        id: "bano-inservible",
        need: "has_accessible_bathroom",
        level: "bloqueo",
        title: "El baño figura como adaptado, pero no cumple",
        detail: b.note,
      });
    } else if (b.rating === null) {
      alerts.push({
        id: "bano-sin-dato",
        need: "has_accessible_bathroom",
        level: "sin-dato",
        title: "No hay dato de baño adaptado",
        detail: b.note,
      });
    }
  }

  // --- baño familiar ---------------------------------------------------
  if (needs.family_bathroom && detail && detail.has_family_bathroom !== true) {
    alerts.push({
      id: "bano-familiar",
      need: "family_bathroom",
      level: "sin-dato",
      title: "Sin cambiador confirmado",
      detail: detail.family_bathroom_note,
    });
  }

  // --- mascotas --------------------------------------------------------
  if (needs.travels_with_pet && detail) {
    if (detail.pet_policy === "no-permitidas") {
      alerts.push({
        id: "mascotas-no",
        need: "travels_with_pet",
        level: "bloqueo",
        title: "No admite mascotas",
        detail: detail.pet_note,
      });
    } else if (detail.pet_policy === "sin-dato") {
      alerts.push({
        id: "mascotas-sin-dato",
        need: "travels_with_pet",
        level: "sin-dato",
        title: "No sabemos si admite mascotas",
        detail: detail.pet_note,
      });
    }
  }

  // --- perro guia: el unico aviso que es una buena noticia -------------
  if (needs.guide_dog) {
    alerts.push({
      id: "perro-guia",
      need: "guide_dog",
      level: "favorable",
      title: "Tu perro guía puede entrar",
      detail:
        "La Ley 29830 garantiza el acceso de perros guía a lugares de uso público, aunque el lugar no admita mascotas.",
    });
  }

  /* Lo mas grave primero. Sin esto el orden lo decide el orden en que estan
     escritos los bloques de arriba (escaleras, altitud, baño...), que no tiene
     nada que ver con la urgencia: un "sin dato" de mascotas puede quedar
     encima de un baño que no cumple. El sort de JS es estable, asi que dentro
     de un mismo nivel se conserva el orden tematico. */
  return alerts.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
}

const LEVEL_ORDER: AlertLevel[] = ["bloqueo", "atencion", "sin-dato", "favorable"];

/** El aviso mas grave del conjunto, para resumir una parada en una linea. */
export function worstLevel(alerts: ProfileAlert[]): AlertLevel | null {
  for (const level of LEVEL_ORDER) {
    if (alerts.some((a) => a.level === level)) return level;
  }
  return null;
}

export function hasAnyNeed(profile: TravelProfile): boolean {
  return Object.values(profile.needs).some(Boolean);
}
