import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase SOLO para el navegador, usado unicamente para la sesion
 * de Auth (Pasaporte Arequipeño, §6.x).
 *
 * Deliberadamente separado del singleton de lib/supabase.ts: ese cliente vive
 * con `persistSession: false` porque lo comparten rutas de servidor (donde no
 * hay `window`) y lecturas anonimas, y no debe empezar a guardar sesiones de
 * usuario. Este archivo es la unica excepcion sancionada a la regla de "las
 * pantallas nunca tocan Supabase directo" (§2.2): la sesion de Auth es
 * inherentemente del navegador con el SDK de Supabase, no algo que tenga
 * sentido enrutar por un /api/* propio.
 */

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseAuthConfigured = Boolean(url && anonKey);

export const supabaseBrowser: SupabaseClient = createClient(
  url || PLACEHOLDER_URL,
  anonKey || PLACEHOLDER_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } },
);
