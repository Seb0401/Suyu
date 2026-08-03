"use client";

import { useCallback, useEffect, useState } from "react";
import { PROFILE_METADATA_KEY, getAuthClient, isAuthConfigured } from "@/components/authClient";
import { CheckIcon, HelpCircleIcon, ShieldCheckIcon } from "@/components/Icons";
import { readProfile, writeProfile, type TravelProfile } from "@/components/travelProfile";

type Status = "idle" | "sending" | "sent" | "error" | "syncing" | "synced";

/**
 * Cuenta OPCIONAL. Su unico proposito es llevarse el perfil de viaje a otro
 * dispositivo; nada de la app se bloquea sin ella (§2.1).
 *
 * Usa magic link (OTP por correo) en vez de contraseña: no hay que guardar ni
 * validar credenciales, y para un perfil de preferencias es suficiente.
 */
export default function AccountSection({
  onProfilePulled,
}: {
  onProfilePulled?: (profile: TravelProfile) => void;
}) {
  const [email, setEmail] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const pullRemoteProfile = useCallback(
    async (remote: unknown) => {
      if (!remote || typeof remote !== "object") return;
      const local = readProfile();
      // Solo adoptamos el remoto si aqui no hay nada respondido: pisar en
      // silencio lo que el usuario acaba de contestar en este equipo seria peor
      // que no sincronizar.
      if (local.completed_at) return;
      const profile = remote as TravelProfile;
      writeProfile(profile);
      onProfilePulled?.(profile);
    },
    [onProfilePulled],
  );

  useEffect(() => {
    const client = getAuthClient();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setSessionEmail(user.email ?? null);
      void pullRemoteProfile(user.user_metadata?.[PROFILE_METADATA_KEY]);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setSessionEmail(user?.email ?? null);
      if (user) void pullRemoteProfile(user.user_metadata?.[PROFILE_METADATA_KEY]);
    });

    return () => sub.subscription.unsubscribe();
  }, [pullRemoteProfile]);

  if (!isAuthConfigured) {
    return (
      <div className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <HelpCircleIcon size={18} className="text-ink-muted" />
          Cuenta no disponible
        </h2>
        {/* Decirlo es mejor que mostrar un formulario que no puede funcionar. */}
        <p className="mt-1.5 text-sm text-ink-soft">
          Este demo corre sin Supabase configurado, así que no hay inicio de
          sesión. Tu perfil de viaje se guarda solo en este dispositivo y la app
          funciona completa igual.
        </p>
      </div>
    );
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const client = getAuthClient();
    if (!client || !email.trim()) return;

    setStatus("sending");
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/perfil" },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage(null);
    }
  }

  async function pushProfile() {
    const client = getAuthClient();
    if (!client) return;
    setStatus("syncing");
    const { error } = await client.auth.updateUser({
      data: { [PROFILE_METADATA_KEY]: readProfile() },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("synced");
      setMessage(null);
    }
  }

  async function signOut() {
    const client = getAuthClient();
    if (!client) return;
    await client.auth.signOut();
    setSessionEmail(null);
    setStatus("idle");
  }

  if (sessionEmail) {
    return (
      <div className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <ShieldCheckIcon size={18} className="text-forest-700" />
          Sesión iniciada
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{sessionEmail}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pushProfile}
            disabled={status === "syncing"}
            className="rounded-full bg-forest-700 px-4 py-2 text-sm font-bold text-cream disabled:opacity-50"
          >
            {status === "syncing" ? "Guardando…" : "Guardar perfil en mi cuenta"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-sand-200 px-4 py-2 text-sm font-bold text-ink-soft"
          >
            Cerrar sesión
          </button>
        </div>

        {status === "synced" ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-forest-700">
            <CheckIcon size={14} />
            Perfil guardado en tu cuenta.
          </p>
        ) : null}
        {status === "error" && message ? (
          <p className="mt-2 text-xs font-semibold text-[var(--color-danger-text)]">{message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-sand-200 bg-sand-50 p-4">
      <h2 className="font-extrabold text-ink">Guardar en una cuenta (opcional)</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Solo sirve para llevar tus preferencias a otro dispositivo. No hace falta
        para usar nada de la app.
      </p>

      {status === "sent" ? (
        <p className="mt-3 rounded-2xl bg-forest-50 p-3 text-sm font-semibold text-forest-700">
          Te enviamos un enlace a {email}. Ábrelo en este dispositivo para
          iniciar sesión.
        </p>
      ) : (
        <form onSubmit={sendLink} className="mt-3 flex flex-col gap-2">
          <label htmlFor="correo" className="text-xs font-bold text-ink-soft">
            Tu correo
          </label>
          <input
            id="correo"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="rounded-2xl border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-night-800 px-5 py-2.5 font-bold text-cream disabled:opacity-50"
          >
            {status === "sending" ? "Enviando…" : "Enviarme un enlace de acceso"}
          </button>
          <p className="text-[11px] text-ink-muted">
            Sin contraseña: te llega un enlace de un solo uso al correo.
          </p>
        </form>
      )}

      {status === "error" && message ? (
        <p className="mt-2 text-xs font-semibold text-[var(--color-danger-text)]">{message}</p>
      ) : null}
    </div>
  );
}
