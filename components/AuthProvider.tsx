"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseAuthConfigured, supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Sesion de usuario para el Pasaporte Arequipeño (§6.11). Mismo patron
 * hook/provider que useTheme() en components/ThemeToggle.tsx: un contexto
 * chico, sin store externo.
 *
 * MODO DE PRUEBA, a proposito (pedido explicito del equipo para poder probar
 * rapido calificar un sitio / sumarse a la red / ver el pasaporte, sin la
 * friccion de un login real): `enterAsGuestName(name)` deriva un correo
 * interno del nombre y entra SIEMPRE con una contraseña fija propia del
 * proyecto — la contraseña que la persona escriba en pantalla no se usa para
 * nada real. Cualquier nombre entra; el mismo nombre siempre vuelve a la
 * misma cuenta (recupera su pasaporte), un nombre nuevo crea una cuenta
 * nueva. Es una simplificacion deliberada, no autenticacion real: cualquiera
 * que escriba un nombre ya usado "entra" a esa cuenta. Aceptable hoy porque
 * el pasaporte no guarda nada sensible (fotos y reseñas de sitios turisticos
 * publicos) y el equipo lo pidio explicitamente para esta etapa.
 */

const DEMO_PASSWORD = "suyu-pasaporte-demo-2026";

function nameToDemoEmail(name: string): string {
  // Quita tildes descomponiendo (NFD) y filtrando los marcadores combinados
  // por su codigo de caracter (bloque Unicode 0x0300-0x036f), sin depender de
  // un literal de regex con rangos Unicode que es fragil de teclear a mano.
  const withoutAccents = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join("");

  const slug = withoutAccents.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // .invalid es el TLD reservado por RFC 2606 para direcciones que a
  // proposito no van a ningun lado.
  return `${slug || "viajero"}@pasaporte.local.invalid`;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  /** Entra (crea la cuenta si no existe) usando solo un nombre. Ver nota de modo de prueba arriba. */
  enterAsGuestName: (name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseAuthConfigured) {
      setLoading(false);
      return;
    }

    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function enterAsGuestName(name: string) {
    const email = nameToDemoEmail(name);

    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password: DEMO_PASSWORD,
    });
    if (!signInError) return null;

    // No existia esa cuenta todavia: la creamos con el mismo nombre.
    const { data: signUpData, error: signUpError } = await supabaseBrowser.auth.signUp({
      email,
      password: DEMO_PASSWORD,
      options: { data: { full_name: name.trim() } },
    });

    if (signUpError) {
      return "No pudimos entrar. Revisa tu conexión e intenta de nuevo.";
    }
    if (!signUpData.session) {
      // Pasa si el proyecto de Supabase pide confirmar el correo — con un
      // correo inventado (@pasaporte.local.invalid) esa confirmacion nunca
      // va a llegar. Es un paso de configuracion del dashboard, no un bug.
      return "Tu proyecto de Supabase pide confirmar el correo. Desactiva \"Confirm email\" en el dashboard para este modo de prueba.";
    }
    return null;
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        configured: isSupabaseAuthConfigured,
        enterAsGuestName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
