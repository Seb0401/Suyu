"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon } from "@/components/Icons";

/**
 * Reporte de un problema de accesibilidad.
 *
 * Modal con las tres cosas que §7.7 exige y que casi siempre se olvidan: cierra
 * con Escape, mueve el foco al abrirse y lo devuelve al cerrarse.
 */
export default function ReportDialog({
  siteId,
  siteName,
  open,
  onClose,
}: {
  siteId: string;
  siteName: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [issues, setIssues] = useState<string[]>([]);
  const [issue, setIssue] = useState("");
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
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

  /**
   * Auto-cierre tras enviar. 2.5 s alcanza para leer la confirmacion sin
   * obligar a buscar el boton de cerrar, y el usuario puede cerrar antes con
   * Escape o el boton si ya lo leyo.
   *
   * Solo se dispara en "sent": un error se queda en pantalla hasta que la
   * persona decida, porque ahi si hay algo que hacer.
   */
  useEffect(() => {
    if (state !== "sent") return;
    const timer = window.setTimeout(() => {
      onClose();
      setState("idle");
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [state, onClose]);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : { issues: [] }))
      .then((d) => {
        const list: string[] = d.issues ?? [];
        setIssues(list);
        setIssue((prev) => prev || list[0] || "");
      })
      .catch(() => setIssues([]));
  }, []);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId, issue, detail }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
      setDetail("");
    } catch {
      /* Los reportes son solo-red a proposito (§5.1): no se pueden inventar sin
         conexion, asi que se dice que no se envio en vez de fingir que si. */
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
        aria-labelledby="reporte-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-sand-200 bg-sand-50 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reporte-titulo" className="font-extrabold text-ink">
              {t("reporte.titulo")}
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
              {t("reporte.gracias")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-full bg-forest-700 px-5 py-2.5 font-bold text-cream"
            >
              {t("reporte.listo")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="motivo" className="text-xs font-bold text-ink-soft">
                {t("reporte.queEncontraste")}
              </label>
              <select
                id="motivo"
                ref={firstFieldRef}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="rounded-2xl border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink"
              >
                {issues.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="detalle" className="text-xs font-bold text-ink-soft">
                {t("reporte.cuentanos")}
              </label>
              <textarea
                id="detalle"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                className="rounded-2xl border border-sand-200 bg-sand-100 px-4 py-2.5 text-sm text-ink"
              />
            </div>

            {state === "error" ? (
              <p className="text-xs font-semibold text-[var(--color-danger-text)]">
                {t("reporte.errorEnvio")}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={state === "sending" || !issue}
              className="rounded-full bg-clay-600 px-5 py-2.5 font-bold text-cream disabled:opacity-50"
            >
              {state === "sending" ? t("reporte.enviando") : t("reporte.enviar")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
