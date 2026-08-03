"use client";

import { useEffect, useState } from "react";
import { OfflineIcon } from "@/components/Icons";

/**
 * Registra el service worker y avisa cuando no hay conexion.
 *
 * El registro ocurre SOLO en produccion: en desarrollo un SW cacheando chunks
 * de Turbopack provoca 404 y errores de hidratacion (§5.1).
 */
export default function PwaProvider() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Si falla el registro la app sigue funcionando online; no hay nada
           que mostrarle al usuario sobre esto. */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-cream"
      style={{ background: "var(--color-scrim)" }}
    >
      <OfflineIcon size={15} />
      Sin conexión — sigues viendo los datos guardados
    </div>
  );
}
