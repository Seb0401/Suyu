import type { ServiceCategory } from "@/lib/types";

/**
 * Portal de negocios: cuenta y ficha de accesibilidad que un restaurante,
 * hospedaje u otro local carga sobre sí mismo — 100% local al dispositivo
 * (localStorage), sin Supabase Auth ni Storage.
 *
 * Es una "cuenta de demostración", no autenticación real: no hay verificación
 * de identidad ni cifrado, y la UI lo dice explícitamente. Por la misma razón
 * este archivo NO vive en lib/types.ts — ese archivo es el contrato de
 * /api/* (§2.2 de CLAUDE.md) y estos datos nunca pasan por un endpoint.
 *
 * El RUC, el administrador y los enlaces externos son siempre autoreportados
 * por el negocio: nunca se marcan como verificados (§2.1, §6.10).
 */

export type WheelchairAccessLevel = "completo" | "parcial" | "no_accesible" | "sin_evaluar";

export const WHEELCHAIR_ACCESS_LEVELS: { value: WheelchairAccessLevel; label: string }[] = [
  { value: "completo", label: "Acceso completo" },
  { value: "parcial", label: "Acceso parcial" },
  { value: "no_accesible", label: "No accesible" },
  { value: "sin_evaluar", label: "Sin evaluar" },
];

export type ExternalProfilePlatform = "google" | "tripadvisor" | "otro";

export interface ExternalProfileLink {
  platform: ExternalProfilePlatform;
  url: string;
}

export interface BusinessAccount {
  id: string;
  email: string;
  business_name: string;
  created_at: string;
}

export interface BusinessAccessibilityProfile {
  account_id: string;
  business_name: string;
  category: ServiceCategory;
  /** Opcional: no todo negocio cae cerca de uno de los 6 sitios piloto. */
  near_site_id: string | null;
  ruc: string;
  administrator_name: string;
  phone: string;
  address: string;
  floors_count: number | null;
  wheelchair_access_level: WheelchairAccessLevel;
  has_ramps: boolean;
  has_accessible_bathroom: boolean;
  pet_friendly: boolean;
  notes: string;
  /** Data URLs (base64), locales al dispositivo — nunca suben a un servidor. */
  photos: string[];
  external_profiles: ExternalProfileLink[];
  updated_at: string;
}

const ACCOUNTS_KEY = "suyu:business-accounts";
const SESSION_KEY = "suyu:business-session";
const PROFILE_PREFIX = "suyu:business-profile:";

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // localStorage puede fallar en modo privado, o el valor puede estar
    // corrupto. En ambos casos preferimos el fallback a romper la pantalla.
    return fallback;
  }
}

function writeJson(key: string, value: unknown): string | null {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch {
    return "No se pudo guardar: el espacio local está lleno. Prueba con menos fotos o fotos más livianas.";
  }
}

function listAccounts(): (BusinessAccount & { password: string })[] {
  return readJson(ACCOUNTS_KEY, []);
}

function friendlyBusinessAuthError(kind: "email-taken" | "bad-credentials" | "weak-password"): string {
  switch (kind) {
    case "email-taken":
      return "Ya existe una cuenta de negocio con este correo.";
    case "bad-credentials":
      return "Correo o contraseña incorrectos.";
    case "weak-password":
      return "La contraseña necesita al menos 6 caracteres.";
  }
}

/** Registra una cuenta y abre sesión. Devuelve un mensaje de error o null. */
export function registerBusinessAccount(
  email: string,
  password: string,
  businessName: string,
): string | null {
  if (password.length < 6) return friendlyBusinessAuthError("weak-password");

  const accounts = listAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  if (accounts.some((a) => a.email === normalizedEmail)) {
    return friendlyBusinessAuthError("email-taken");
  }

  const account: BusinessAccount & { password: string } = {
    id: `biz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    business_name: businessName.trim(),
    created_at: new Date().toISOString(),
    password,
  };

  const writeErr = writeJson(ACCOUNTS_KEY, [...accounts, account]);
  if (writeErr) return writeErr;

  return setSession(account.id);
}

/** Inicia sesión con una cuenta existente. Devuelve un mensaje de error o null. */
export function loginBusinessAccount(email: string, password: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  const account = listAccounts().find((a) => a.email === normalizedEmail);
  if (!account || account.password !== password) {
    return friendlyBusinessAuthError("bad-credentials");
  }
  return setSession(account.id);
}

function setSession(accountId: string): string | null {
  return writeJson(SESSION_KEY, accountId);
}

export function logoutBusinessAccount() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Si localStorage no funciona, tampoco había sesión que cerrar. */
  }
}

export function getCurrentBusinessAccount(): BusinessAccount | null {
  const id = readJson<string | null>(SESSION_KEY, null);
  if (!id) return null;
  const account = listAccounts().find((a) => a.id === id);
  if (!account) return null;
  return { id: account.id, email: account.email, business_name: account.business_name, created_at: account.created_at };
}

export function getBusinessProfile(accountId: string): BusinessAccessibilityProfile | null {
  return readJson<BusinessAccessibilityProfile | null>(`${PROFILE_PREFIX}${accountId}`, null);
}

/** Guarda la ficha. Devuelve un mensaje de error (p.ej. cupo lleno) o null. */
export function saveBusinessProfile(profile: BusinessAccessibilityProfile): string | null {
  if (profile.photos.length > MAX_PHOTOS) {
    return `Máximo ${MAX_PHOTOS} fotos por ficha.`;
  }
  return writeJson(`${PROFILE_PREFIX}${profile.account_id}`, {
    ...profile,
    updated_at: new Date().toISOString(),
  });
}

export function emptyProfileFor(account: BusinessAccount): BusinessAccessibilityProfile {
  return {
    account_id: account.id,
    business_name: account.business_name,
    category: "restaurante",
    near_site_id: null,
    ruc: "",
    administrator_name: "",
    phone: "",
    address: "",
    floors_count: null,
    wheelchair_access_level: "sin_evaluar",
    has_ramps: false,
    has_accessible_bathroom: false,
    pet_friendly: false,
    notes: "",
    photos: [],
    external_profiles: [],
    updated_at: new Date().toISOString(),
  };
}

/** Todas las fichas guardadas en este dispositivo. Usado por ServiceList para
 *  cruzar por near_site_id — no pasa por ningún endpoint (§2.2 no aplica: no
 *  hay contrato de API involucrado, es lectura local del mismo dispositivo). */
export function getAllBusinessProfiles(): BusinessAccessibilityProfile[] {
  const profiles: BusinessAccessibilityProfile[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PROFILE_PREFIX)) continue;
      const profile = readJson<BusinessAccessibilityProfile | null>(key, null);
      if (profile) profiles.push(profile);
    }
  } catch {
    return [];
  }
  return profiles;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No pudimos leer la foto."));
    reader.readAsDataURL(file);
  });
}
