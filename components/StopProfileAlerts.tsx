"use client";

import { useState } from "react";
import ProfileAlertList, { LEVEL } from "@/components/ProfileAlertList";
import { ChevronDownIcon } from "@/components/Icons";
import { worstLevel, type ProfileAlert } from "@/components/profileAlerts";

/**
 * Avisos de una parada del itinerario.
 *
 * Aqui van PLEGADOS, al reves que en la ficha del sitio: un itinerario de seis
 * paradas con cuatro avisos cada una es ilegible. Se muestra una linea de
 * resumen que ya dice lo importante ("2 avisos · Importante") y el detalle se
 * abre a peticion.
 *
 * El resumen siempre nombra el nivel mas grave en palabras, no solo en color.
 */

export default function StopProfileAlerts({ alerts }: { alerts: ProfileAlert[] }) {
  const [open, setOpen] = useState(false);
  if (alerts.length === 0) return null;

  const worst = worstLevel(alerts);
  if (!worst) return null;
  const { word, chip, Icon } = LEVEL[worst];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip}`}
      >
        <Icon size={13} />
        {alerts.length} {alerts.length === 1 ? "aviso" : "avisos"} · {word}
        <ChevronDownIcon
          size={13}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? <ProfileAlertList alerts={alerts} className="mt-2" /> : null}
    </div>
  );
}
