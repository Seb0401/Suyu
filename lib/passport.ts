import { haversineMeters } from "@/lib/geo";
import { passportPresentation } from "@/lib/passportUi";
import { getSite, getSites } from "@/lib/sites";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { PassportStamp, PassportSummary } from "@/lib/types";

/**
 * Pasaporte Arequipeño: check-in verificado por GPS (§6.x).
 *
 * A diferencia de lib/reports.ts, esto NO tiene fallback en memoria: una
 * estampa es un registro permanente ligado a una cuenta real, asi que si
 * Supabase no esta configurado el pasaporte falla cerrado con un mensaje
 * honesto en vez de simular una estampa que despues desaparece.
 *
 * Toda lectura/escritura usa el cliente de service role DESPUES de que la
 * ruta ya verifico el JWT (lib/authServer.ts) — por eso cada query de aca
 * lleva `.eq("user_id", userId)` explicito: el cliente admin bypassea RLS, y
 * sin ese filtro un usuario veria estampas de otro.
 */

const PASSPORT_GEOFENCE_METERS = 300;
const MAX_REVIEW_LENGTH = 500;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const PHOTOS_BUCKET = "passport-photos";

export interface NewCheckIn {
  site_id: unknown;
  lat: unknown;
  lng: unknown;
  accessibility_rating: unknown;
  review?: unknown;
  photo?: File | null;
}

type CheckInValidation =
  | {
      ok: true;
      site_id: string;
      lat: number;
      lng: number;
      rating: number;
      review: string;
      photo: File | null;
    }
  | { ok: false; error: string };

function validateCheckIn(input: NewCheckIn): CheckInValidation {
  const { site_id, lat, lng, accessibility_rating, review, photo } = input;

  if (typeof site_id !== "string" || !site_id.trim()) {
    return { ok: false, error: "Falta el sitio del check-in." };
  }

  const latNum = typeof lat === "string" ? Number(lat) : lat;
  const lngNum = typeof lng === "string" ? Number(lng) : lng;
  if (
    typeof latNum !== "number" ||
    typeof lngNum !== "number" ||
    !Number.isFinite(latNum) ||
    !Number.isFinite(lngNum)
  ) {
    return { ok: false, error: "No pudimos leer tu ubicación." };
  }

  const ratingNum =
    typeof accessibility_rating === "string" ? Number(accessibility_rating) : accessibility_rating;
  if (
    typeof ratingNum !== "number" ||
    !Number.isInteger(ratingNum) ||
    ratingNum < 1 ||
    ratingNum > 5
  ) {
    return { ok: false, error: "La calificación de accesibilidad debe ser de 1 a 5." };
  }

  const reviewText = typeof review === "string" ? review.trim().slice(0, MAX_REVIEW_LENGTH) : "";

  let photoFile: File | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: "La foto es muy pesada. Prueba con otra (máx. 4MB)." };
    }
    photoFile = photo;
  }

  return {
    ok: true,
    site_id: site_id.trim(),
    lat: latNum,
    lng: lngNum,
    rating: ratingNum,
    review: reviewText,
    photo: photoFile,
  };
}

export async function checkIn(
  userId: string,
  input: NewCheckIn,
): Promise<{ ok: true; stamp: PassportStamp } | { ok: false; status: number; error: string }> {
  const admin = getSupabaseAdmin();
  if (!isSupabaseConfigured || !admin) {
    return {
      ok: false,
      status: 503,
      error: "El pasaporte necesita conexión con nuestros servidores. Intenta más tarde.",
    };
  }

  const validated = validateCheckIn(input);
  if (!validated.ok) {
    return { ok: false, status: 400, error: validated.error };
  }

  const site = await getSite(validated.site_id);
  if (!site) {
    return { ok: false, status: 404, error: "Sitio desconocido." };
  }

  // El servidor es la unica autoridad: la distancia se recalcula aca, nunca
  // se confia en un "verificado" que mande el cliente.
  const distance = haversineMeters(
    { lat: validated.lat, lng: validated.lng },
    { lat: site.lat, lng: site.lng },
  );

  if (distance > PASSPORT_GEOFENCE_METERS) {
    return {
      ok: false,
      status: 422,
      error: `Estás a ~${Math.round(distance)} m de ${site.name}. Acércate para hacer check-in.`,
    };
  }

  let photoPath: string | null = null;
  if (validated.photo) {
    const ext = (validated.photo.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    photoPath = `${userId}/${validated.site_id}-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await validated.photo.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(PHOTOS_BUCKET)
      .upload(photoPath, bytes, { contentType: validated.photo.type || "image/jpeg" });

    if (uploadError) {
      return { ok: false, status: 502, error: "No pudimos guardar tu foto. Intenta de nuevo." };
    }
  }

  const { data, error } = await admin
    .from("passport_stamps")
    .insert({
      user_id: userId,
      site_id: validated.site_id,
      accessibility_rating: validated.rating,
      review: validated.review,
      photo_path: photoPath,
      lat: validated.lat,
      lng: validated.lng,
      distance_m: distance,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique_violation. Se captura aca ademas del pre-check implicito
    // de getPassportSummary, porque un doble-tap del submit es una carrera
    // real que solo la base puede resolver de forma atomica.
    if (error.code === "23505") {
      return { ok: false, status: 409, error: "Ya tienes esta estampa en este sitio." };
    }
    return { ok: false, status: 500, error: "No pudimos registrar tu visita. Intenta de nuevo." };
  }

  return {
    ok: true,
    stamp: {
      id: data.id,
      site_id: data.site_id,
      site_name: site.name,
      accessibility_rating: data.accessibility_rating,
      review: data.review,
      photo_url: photoPath
        ? admin.storage.from(PHOTOS_BUCKET).getPublicUrl(photoPath).data.publicUrl
        : null,
      created_at: data.created_at,
    },
  };
}

export async function getPassportSummary(
  userId: string,
): Promise<{ ok: true; summary: PassportSummary } | { ok: false; status: number; error: string }> {
  const admin = getSupabaseAdmin();
  if (!isSupabaseConfigured || !admin) {
    return {
      ok: false,
      status: 503,
      error: "El pasaporte necesita conexión con nuestros servidores. Intenta más tarde.",
    };
  }

  const [{ sites }, stampsResult] = await Promise.all([
    getSites(),
    admin
      .from("passport_stamps")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (stampsResult.error) {
    return { ok: false, status: 500, error: "No pudimos cargar tu pasaporte. Intenta de nuevo." };
  }

  const siteNames = new Map(sites.map((s) => [s.id, s.name]));

  const stamps: PassportStamp[] = (stampsResult.data ?? []).map((row) => ({
    id: row.id,
    site_id: row.site_id,
    site_name: siteNames.get(row.site_id) ?? row.site_id,
    accessibility_rating: row.accessibility_rating,
    review: row.review,
    photo_url: row.photo_path
      ? admin.storage.from(PHOTOS_BUCKET).getPublicUrl(row.photo_path).data.publicUrl
      : null,
    created_at: row.created_at,
  }));

  const presentation = passportPresentation(stamps.length, sites.length);

  return {
    ok: true,
    summary: {
      stamps,
      tier: presentation.tier,
      tier_label: presentation.label,
      stamps_count: presentation.stampsCount,
      total_sites: presentation.totalSites,
      next_tier_at: presentation.nextTierAt,
      benefit: presentation.benefit,
      benefit_is_simulated: presentation.benefitIsSimulated,
    },
  };
}
