"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CameraIcon, CloseIcon, StarIcon } from "@/components/Icons";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type { PassportStamp } from "@/lib/types";

/**
 * Check-in del Pasaporte Arequipeño (§6.x). Clon del patron modal de
 * ReportDialog.tsx (fondo, Escape, foco al abrir/cerrar, maquina de
 * estados) con dos diferencias: pide geolocalizacion antes de enviar, y el
 * body es FormData (foto opcional), no JSON.
 *
 * El servidor es la unica autoridad sobre la geocerca — este dialogo nunca
 * calcula ni muestra una distancia para decidir si habilita el envio, porque
 * cualquier valor calculado en el cliente es, por definicion, falseable.
 */

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

type DialogState = "idle" | "locating" | "sending" | "sent" | "error";

export default function CheckInDialog({
  siteId,
  siteName,
  open,
  onClose,
  onCheckedIn,
}: {
  siteId: string;
  siteName: string;
  open: boolean;
  onClose: () => void;
  onCheckedIn?: (stamp: PassportStamp) => void;
}) {
  const { session } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<DialogState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const firstFieldRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement;
    firstFieldRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (state !== "sent") return;
    const timer = window.setTimeout(() => {
      onClose();
      setState("idle");
      setRating(0);
      setReview("");
      setPhoto(null);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [state, onClose]);

  if (!open) return null;

  function locate(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Tu navegador no soporta ubicación. No podemos verificar tu visita."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        resolve,
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("Activa el permiso de ubicación para hacer check-in."));
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            reject(new Error("No pudimos obtener tu ubicación. Intenta de nuevo."));
          } else {
            reject(new Error("La ubicación tardó demasiado. Intenta de nuevo."));
          }
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_PHOTO_BYTES) {
      setErrorMsg("La foto es muy pesada. Prueba con otra (máx. 4MB).");
      setState("error");
      e.target.value = "";
      return;
    }
    setPhoto(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setErrorMsg("Inicia sesión para hacer check-in.");
      setState("error");
      return;
    }

    setState("locating");
    let position: GeolocationPosition;
    try {
      position = await locate();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No pudimos obtener tu ubicación.");
      setState("error");
      return;
    }

    setState("sending");
    try {
      // Token fresco al momento de enviar, no el valor de contexto que puede
      // haber quedado viejo si la pestaña estuvo abierta un rato.
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setErrorMsg("Tu sesión expiró. Vuelve a iniciar sesión.");
        setState("error");
        return;
      }

      const form = new FormData();
      form.set("site_id", siteId);
      form.set("lat", String(position.coords.latitude));
      form.set("lng", String(position.coords.longitude));
      form.set("accessibility_rating", String(rating));
      form.set("review", review);
      if (photo) form.set("photo", photo);

      // Sin Content-Type manual: el body es FormData, el navegador arma el
      // boundary del multipart solo. Fijarlo a mano rompe el parseo.
      const res = await fetch("/api/passport/checkin", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(body.error ?? "No pudimos registrar tu visita.");
        setState("error");
        return;
      }

      setState("sent");
      if (body.stamp) onCheckedIn?.(body.stamp as PassportStamp);
    } catch {
      setErrorMsg("No pudimos conectar con el servidor. Revisa tu conexión.");
      setState("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
      style={{ background: "color-mix(in srgb, var(--color-scrim) 60%, transparent)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-sand-200 bg-sand-50 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="checkin-titulo" className="font-extrabold text-ink">
              Marca tu visita
            </h2>
            <p className="text-xs text-ink-soft">{siteName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-ink-muted"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {state === "sent" ? (
          <div className="mt-4">
            <p className="rounded-2xl bg-forest-50 p-3 text-sm font-semibold text-forest-700">
              ¡Estampa conseguida! Ya quedó registrada en tu pasaporte.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-full bg-forest-700 px-5 py-2.5 font-bold text-cream"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-ink-soft">
                Calificación de accesibilidad —{" "}
                {rating > 0 ? `${rating} de 5` : "sin calificar"}
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    ref={value === 1 ? firstFieldRef : undefined}
                    onClick={() => setRating(value)}
                    aria-pressed={rating === value}
                    aria-label={`${value} de 5`}
                    className="rounded-full p-1 text-clay-600"
                  >
                    <StarIcon size={26} filled={value <= rating} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="resena" className="text-xs font-bold text-ink-soft">
                Cuéntanos cómo fue tu visita (opcional)
              </label>
              <textarea
                id="resena"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                maxLength={500}
                rows={3}
                className="rounded-2xl border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="foto"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-sand-300 bg-sand-100 px-4 py-3 text-sm font-semibold text-ink-soft"
              >
                <CameraIcon size={18} />
                {photo ? photo.name : "Agregar una foto (opcional)"}
              </label>
              <input id="foto" type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
            </div>

            {state === "error" ? (
              <p className="text-xs font-semibold text-[var(--color-danger-text)]">{errorMsg}</p>
            ) : null}

            <button
              type="submit"
              disabled={state === "locating" || state === "sending" || rating === 0}
              className="rounded-full bg-clay-600 px-5 py-2.5 font-bold text-cream disabled:opacity-50"
            >
              {state === "locating"
                ? "Buscando tu ubicación…"
                : state === "sending"
                  ? "Registrando…"
                  : "Marcar visita"}
            </button>
            <p className="text-center text-[11px] text-ink-muted">
              Verificamos que estés cerca del lugar antes de dar la estampa.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
