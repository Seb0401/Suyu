"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MedalIcon, StampIcon, StarIcon } from "@/components/Icons";
import Mascot from "@/components/Mascot";
import PassportRing from "@/components/PassportRing";
import PassportStamp from "@/components/PassportStamp";
import { passportPresentation } from "@/lib/passportUi";
import type { PassportSummary, SiteWithCrowd } from "@/lib/types";

/** Ligera variación de inclinación por sello, para que la colección se vea
 *  como sellos de tinta reales y no una grilla mecánica repetida. */
const STAMP_TILTS = [-4, 3, -3, 4, -2, 2];

/**
 * Pasaporte Arequipeño (§6.11). A diferencia del resto de la app, esta
 * pantalla SI necesita conexion y Supabase configurado — su honestidad
 * depende de verificar el GPS en vivo, asi que no tiene sentido offline
 * (mismo criterio que /chat y /reportes, §2.1, §5.1).
 */
export default function PasaportePage() {
  const { user, session, loading, configured, enterAsGuestName, signOut } = useAuth();
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [summary, setSummary] = useState<PassportSummary | null>(null);
  const [sites, setSites] = useState<SiteWithCrowd[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setDataError(null);

    Promise.all([
      fetch("/api/passport", { headers: { Authorization: `Bearer ${session.access_token}` } }),
      fetch("/api/sites"),
    ])
      .then(async ([passportRes, sitesRes]) => {
        if (cancelled) return;
        if (!passportRes.ok) {
          const body = await passportRes.json().catch(() => ({}));
          setDataError(body.error ?? "El pasaporte necesita conexión. Intenta más tarde.");
          return;
        }
        const passportBody = await passportRes.json();
        const sitesBody = sitesRes.ok ? await sitesRes.json() : { sites: [] };
        setSummary(passportBody.summary);
        setSites(sitesBody.sites ?? []);
      })
      .catch(() => {
        if (!cancelled) setDataError("El pasaporte necesita conexión. Intenta más tarde.");
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    const result = await enterAsGuestName(name);
    setAuthBusy(false);
    if (result) setAuthError(result);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <Mascot size={64} state="confused" />
        <p className="mt-3 rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
          El pasaporte necesita conexión con nuestros servidores. Todavía no está disponible en
          este modo.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-clay-600/50 bg-clay-50">
            <Mascot size={76} state="wave" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-ink">Pasaporte Arequipeño</h1>
          <p className="mt-1 max-w-xs text-sm text-ink-soft">
            Escribe tu nombre para calificar sitios, sumarte a la red y coleccionar tus estampas y
            recompensas.
          </p>
        </div>

        <div className="andean-band my-6" />

        <form onSubmit={submitAuth} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="nombre" className="text-xs font-bold text-ink-soft">
              Nombre
            </label>
            <input
              id="nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-2xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-sm text-ink"
            />
          </div>

          {authError ? (
            <p className="text-xs font-semibold text-[var(--color-danger-text)]">{authError}</p>
          ) : null}

          <button
            type="submit"
            disabled={authBusy || !name.trim()}
            className="rounded-full bg-forest-700 px-5 py-2.5 font-bold text-cream disabled:opacity-50"
          >
            {authBusy ? "Un momento…" : "Entrar a mi pasaporte"}
          </button>
        </form>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">{dataError}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-md px-6 py-8">
        <div className="h-40 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
      </div>
    );
  }

  const stampedIds = new Set(summary.stamps.map((s) => s.site_id));
  const presentation = passportPresentation(summary.stamps_count, summary.total_sites);
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "viajero";

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Pasaporte Arequipeño</h1>
          <p className="text-xs text-ink-muted">Hola, {fullName}</p>
        </div>
        <button type="button" onClick={signOut} className="text-xs font-semibold text-ink-muted">
          Cerrar sesión
        </button>
      </div>

      {/* Tapa del pasaporte: rojo-granate + dorado, fijo en ambos temas —
          es la tapa de un documento, no una superficie de la interfaz
          (§7.6, mismo criterio que el banner de accesibilidad verde). */}
      <section
        className="mt-4 overflow-hidden rounded-3xl px-5 py-5 text-cream"
        style={{
          background:
            "linear-gradient(135deg, var(--color-passport-cover-from), var(--color-passport-cover-to))",
        }}
      >
        <div className="flex items-center gap-4">
          <PassportRing
            value={summary.stamps_count}
            max={summary.total_sites}
            colorVar="var(--color-passport-gold)"
            size={88}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--color-passport-gold)" }}
            >
              Nivel {presentation.metalLabel}
            </p>
            <p className="flex items-center gap-1.5 text-base font-extrabold">
              <MedalIcon size={17} />
              {presentation.label}
            </p>
            {presentation.nextTierAt !== null ? (
              <p className="mt-1 text-xs leading-snug opacity-85">
                Te faltan {presentation.nextTierAt - summary.stamps_count} estampa
                {presentation.nextTierAt - summary.stamps_count === 1 ? "" : "s"} para el
                siguiente nivel.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-snug opacity-85">¡Completaste el pasaporte!</p>
            )}
          </div>
          <Mascot size={44} state="cheer" className="shrink-0" />
        </div>
      </section>

      <div className="andean-band my-4" />

      <section
        className="flex items-center gap-3 rounded-3xl border-2 border-dashed p-4"
        style={{ borderColor: presentation.metalTo, background: "var(--color-sand-50)" }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-cream"
          style={{
            background: `linear-gradient(135deg, ${presentation.metalFrom}, ${presentation.metalTo})`,
          }}
        >
          <MedalIcon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-ink">Tu beneficio actual</h2>
          <p className="mt-0.5 text-sm text-ink-soft">{presentation.benefit}</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-extrabold text-ink">Tu colección</h2>
        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {sites.map((site, i) => {
            const earned = stampedIds.has(site.id);
            const tilt = STAMP_TILTS[i % STAMP_TILTS.length];
            const badge = (
              <PassportStamp
                earned={earned}
                category={site.category}
                metalFrom={presentation.metalFrom}
                metalTo={presentation.metalTo}
                iconTone={presentation.iconTone}
                tilt={tilt}
              />
            );

            return earned ? (
              <a
                key={site.id}
                href={`#estampa-${site.id}`}
                className="flex flex-col items-center gap-1.5"
              >
                {badge}
                <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-ink">
                  {site.name}
                </span>
              </a>
            ) : (
              <Link
                key={site.id}
                href={`/sitio/${site.id}`}
                className="flex flex-col items-center gap-1.5 opacity-80"
              >
                {badge}
                <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-ink-soft">
                  {site.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-extrabold text-ink">Tus visitas</h2>
        {summary.stamps.length === 0 ? (
          <p className="text-xs text-ink-muted">
            Aún no tienes estampas. Visita un lugar y marca tu visita desde su ficha para empezar
            tu colección.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {summary.stamps.map((stamp) => (
              <div
                key={stamp.id}
                id={`estampa-${stamp.site_id}`}
                className="scroll-mt-20 rounded-3xl border border-sand-200 bg-sand-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cream"
                    style={{
                      background: `linear-gradient(135deg, ${presentation.metalFrom}, ${presentation.metalTo})`,
                    }}
                  >
                    <StampIcon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{stamp.site_name}</p>
                    <div
                      className="mt-0.5 flex items-center gap-0.5 text-clay-600"
                      aria-label={`Calificación de accesibilidad: ${stamp.accessibility_rating} de 5`}
                    >
                      {[1, 2, 3, 4, 5].map((v) => (
                        <StarIcon key={v} size={13} filled={v <= stamp.accessibility_rating} />
                      ))}
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {new Date(stamp.created_at).toLocaleDateString("es-PE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {stamp.review ? (
                  <p className="mt-2 text-sm text-ink-soft">{stamp.review}</p>
                ) : null}
                {stamp.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- foto externa de Supabase Storage, sin dominio configurado para next/image.
                  <img
                    src={stamp.photo_url}
                    alt=""
                    className="mt-3 h-32 w-full rounded-2xl object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
