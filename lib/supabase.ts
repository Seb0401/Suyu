import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase (CLAUDE.md §4).
 *
 * El placeholder no es cosmetico: createClient lanza si la URL esta vacia, y
 * eso rompe el BUILD entero, no solo el runtime. Con el placeholder la app
 * compila y arranca sin credenciales, que es exactamente lo que pide §2.1.
 */

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** Unica fuente de verdad para decidir si vale la pena intentar la consulta. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient = createClient(
  url || PLACEHOLDER_URL,
  anonKey || PLACEHOLDER_KEY,
  { auth: { persistSession: false } },
);

/**
 * Cliente con service role, server-only. Existe para uso futuro (cargas
 * masivas, moderacion de reportes); hoy ningun endpoint lo llama.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Envuelve una consulta para que ningun fallo de Supabase llegue al endpoint.
 * Timeout incluido: una consulta colgada es peor que no tener base de datos,
 * porque deja la pantalla girando en vez de mostrar la semilla.
 */
export async function trySupabase<T>(
  query: () => Promise<T | null>,
  timeoutMs = 3000,
): Promise<T | null> {
  if (!isSupabaseConfigured) return null;

  try {
    return await Promise.race([
      query(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
}
