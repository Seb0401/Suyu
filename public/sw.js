/*
 * Service worker de Suyu, escrito a mano.
 *
 * Se registra SOLO en produccion (ver components/PwaProvider.tsx): en
 * desarrollo un SW cacheando chunks de Turbopack provoca 404 y errores de
 * hidratacion.
 *
 * Las estrategias siguen CLAUDE.md §5.1 y no son intercambiables — cada una
 * responde a que tan grave es servir un dato viejo.
 */

const VERSION = "suyu-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-data`;

/* Solo activos que no cambian de forma: las rutas de Next se cachean en
   caliente, precargarlas aqui obligaria a mantener una lista paralela. */
const PRECACHE = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/fonts/nunito-latin-400-normal.woff2",
  "/fonts/nunito-latin-600-normal.woff2",
  "/fonts/nunito-latin-700-normal.woff2",
  "/fonts/nunito-latin-800-normal.woff2",
  "/fonts/yellowtail-latin-400-normal.woff2",
];

/** Respuesta sintetica para que la pantalla no reviente sin red (§5.1). */
function offlinePayload(pathname) {
  const body = pathname.startsWith("/api/services")
    ? { services: [], source: "offline" }
    : { sites: [], source: "offline" };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== DATA_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  /* Los tiles de Mapbox no se cachean: sus terminos de uso lo limitan. Al no
     ser same-origin, simplemente no los interceptamos. */
  if (url.origin !== self.location.origin) return;

  /* Chat y reportes son solo-red. El chat cae al motor de reglas del cliente y
     un reporte no se puede inventar sin conexion. */
  if (url.pathname.startsWith("/api/chat") || url.pathname.startsWith("/api/reports")) {
    return;
  }

  /* Datos: red primero con copia en cache, porque un aforo viejo desinforma. */
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || offlinePayload(url.pathname)),
        ),
    );
    return;
  }

  /* Resto: cache primero con revalidacion en segundo plano. */
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
