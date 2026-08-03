import { supabase } from "@/lib/supabase";

/**
 * Verificacion de sesion para las rutas de /api/passport/* (§6.x).
 *
 * `supabase.auth.getUser(token)` es una llamada SIN estado: valida el JWT
 * contra la API de Auth de Supabase sin tocar la sesion local del cliente
 * compartido, asi que es segura de usar sobre el singleton de lib/supabase.ts
 * aunque varias requests concurrentes la llamen a la vez.
 *
 * Deliberadamente NO usa trySupabase: un token invalido/expirado necesita su
 * propio mensaje honesto ("tu sesion expiro"), distinto de un timeout de red
 * generico que trySupabase colapsaria en el mismo `null`.
 */

const AUTH_TIMEOUT_MS = 5000;

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function getUserIdFromRequest(request: Request): Promise<AuthResult> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;

  if (!token) {
    return { ok: false, status: 401, error: "Inicia sesión para usar el pasaporte." };
  }

  try {
    const { data, error } = await Promise.race([
      supabase.auth.getUser(token),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), AUTH_TIMEOUT_MS),
      ),
    ]);

    if (error || !data.user) {
      return { ok: false, status: 401, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
    }

    return { ok: true, userId: data.user.id };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "No pudimos verificar tu sesión. Revisa tu conexión e intenta de nuevo.",
    };
  }
}
