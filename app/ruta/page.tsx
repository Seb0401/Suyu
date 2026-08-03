"use client";

import MapView from "@/components/MapView";
import { useSites } from "@/components/useSites";

/*
 * B5 monta el mapa aqui para poder verlo funcionando. El buscador de ruta con
 * filtros, cabecera de accesibilidad y linea de tiempo llega en B6.
 */
export default function RutaPage() {
  const { sites, loading, error } = useSites();

  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Ruta accesible</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Mira dónde está cada lugar y cuánta gente hay ahora mismo.
      </p>

      <div className="mt-5">
        {loading ? (
          <div className="h-72 animate-pulse rounded-3xl bg-sand-200" aria-hidden />
        ) : error ? (
          <p className="rounded-2xl bg-clay-50 p-4 text-sm text-[var(--color-danger-text)]">
            {error} Revisa tu conexión e inténtalo de nuevo.
          </p>
        ) : (
          <MapView sites={sites} />
        )}
      </div>
    </div>
  );
}
