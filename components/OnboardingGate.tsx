"use client";

import { useEffect, useState } from "react";
import OnboardingDialog from "@/components/OnboardingDialog";
import { readProfile, type TravelProfile } from "@/components/travelProfile";

/** Para no volver a preguntar en cada navegacion si ya dijo "ahora no". */
const DISMISSED_KEY = "suyu:onboarding-dismissed";

/**
 * Muestra el cuestionario la primera vez que se entra a la app.
 *
 * Es un dialogo, no una pantalla previa: la app se puede usar entera sin
 * responderlo. Personalizar es una mejora, no un peaje (§2.1).
 */
export default function OnboardingGate() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<TravelProfile | undefined>(undefined);

  useEffect(() => {
    const current = readProfile();
    setProfile(current);

    if (current.completed_at) return;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      /* sessionStorage bloqueado: preferimos preguntar de mas antes que
         romper el arranque. */
    }
    if (!dismissed) setOpen(true);
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ver arriba */
    }
  }

  return (
    <OnboardingDialog
      open={open}
      initial={profile}
      onClose={close}
      onSaved={setProfile}
    />
  );
}
