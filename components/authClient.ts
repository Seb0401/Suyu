"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase SOLO para la cuenta opcional.
 *
 * Por que no se reusa lib/supabase.ts: ese cliente es de la Persona A y crea la
 * sesion con `persistSession: false` a proposito, porque lo usan los endpoints
 * de datos, que son anonimos y no deben arrastrar sesion. La cuenta opcional
 * necesita justo lo contrario (persistir para que el login sobreviva a un
 * refresh), y cambiar el de A romperia su contrato (§8). Son dos usos distintos
 * del mismo backend, no una duplicacion por descuido.
 *
 * El perfil sincronizado vive en `user_metadata` del propio usuario de Auth, no
 * en una tabla: crear una tabla obligaria a tocar supabase/schema.sql, que
 * tambien es de A.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** Sin estas dos variables la cuenta no puede existir, y la UI lo dice. */
export const isAuthConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient | null {
  if (!isAuthConfigured) return null;
  if (!cached) {
    cached = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return cached;
}

export const PROFILE_METADATA_KEY = "suyu_travel_profile";
