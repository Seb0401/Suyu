# Contrato de API — referencia para Persona B

> Todo lo que necesitas para maquetar sin leer `lib/`. Los tipos exactos estan
> en `lib/types.ts`; esto es la forma de cada respuesta y los parametros que
> acepta.
>
> **Estado: A1–A14 completos.** Ningun endpoint es stub, todos devuelven datos
> reales. Si algo de aqui no coincide con lo que ves, es un bug mio — avisame.

---

## Reglas que la UI tiene que respetar

Estas no son sugerencias de estilo, son parte del contrato (CLAUDE.md §2.1, §2.3):

1. **`source: "demo"`** significa datos locales, sin Supabase. No hace falta
   mostrarlo, pero tampoco mientas diciendo que son datos en vivo.
2. **`approximate: true`** en una ruta significa linea recta, no ruta peatonal
   real. **Hay que decirlo en pantalla.**
3. **`source: "offline"`** en el chat significa que respondio el motor de
   reglas, no Claude. **El campo `notice` va visible, sin excepcion.**
4. **`crowd_closed: true`** es CERRADO, no "poca gente". Son cosas distintas.
5. **`verified_by: null`** es un dato sin verificar. La UI lo dice
   ("Por verificar"), no lo omite.
6. **`formalized: false`** → mostrar `registry_label`, que ya viene con el texto
   correcto ("Registro por verificar").
7. Todo color de aforo va acompanado de su etiqueta de texto. Usa
   `lib/crowdUi.ts`, no inventes los labels.

---

## Helper que te ahorra trabajo: `lib/crowdUi.ts`

Es de mi capa pero esta pensado para que lo consumas: garantiza que la pantalla,
el copiloto y el panel digan exactamente lo mismo.

```ts
import { crowdPresentation, crowdLabel, verificationLabel } from "@/lib/crowdUi";

crowdPresentation(site);
// → { label: "Muy congestionado", colorVar: "var(--crowd-alto)", advice: "Conviene esperar o ir a otro sitio." }

verificationLabel(site);
// → "Verificado por el equipo" | "Reportado por viajeros" | "Por verificar"
```

Las variables de color (`--crowd-bajo`, `--crowd-medio`, `--crowd-alto`,
`--crowd-sin-datos`) las defines tu en `globals.css` — los valores exactos para
tema claro y oscuro estan en `PROYECTO-DESDE-CERO.md` §4.

Tambien te puede servir `accessibilityScore(site)` de `lib/filters.ts`: devuelve
0-100 segun cuantos de los cuatro rasgos comprobables tiene el sitio.

---

## Endpoints

### `GET /api/sites`

Parametros: `hour` (0-23, default hora de Arequipa), `accessible=true`.

```jsonc
{
  "sites": [{
    "id": "monasterio-de-santa-catalina",
    "name": "Monasterio de Santa Catalina",
    "lat": -16.395, "lng": -71.53667,
    "category": "museo",
    "wheelchair_accessible": false,
    "has_ramps": false,
    "has_accessible_bathroom": false,
    "has_rest_areas": false,
    "notes": "Sin rampas ni ascensores...",
    "verified_by": "equipo",        // | "usuario" | null
    "verified_at": "2026-08-03",
    "crowd_profile": [0, 0, /* 24 valores 0-100 */],
    "crowd_level": "alto",          // | "medio" | "bajo" | null (null = cerrado)
    "crowd_is_live": false,         // true = viene de un reporte, no del perfil
    "crowd_closed": false
  }],
  "source": "demo",                 // | "supabase"
  "hour": 16
}
```

> `crowd_profile` es lo que alimenta el grafico de B7: 24 valores, indice 0 =
> 00:00. Un 0 significa cerrado — esa barra no se pinta como "vacio".

**Categorias existentes:** `museo` (2), `mirador` (2), `plaza`, `iglesia`.

---

### `GET /api/crowd`

Parametros: `site` (**requerido**), `hour`, `accessible=true`.

El aviso anti-aforo de un sitio suelto — para "Estado del lugar" (B8).

```jsonc
{
  "site": { /* SiteWithCrowd */ },
  "saturated": true,
  "alternative": {                  // null si no esta saturado
    "site": { /* SiteWithCrowd */ },
    "reason": "misma_categoria",    // | "mas_cercano"
    "distance_m": 543,
    "walking_min": 9,
    "message": "Monasterio de Santa Catalina esta muy congestionado. Museo Santuarios Andinos es del mismo tipo, esta a 9 min a pie y ahora tiene menos gente."
  },
  "quiet_hour": { "hour": 18, "occupancy": 20, "level": "bajo" },  // null si no baja hoy
  "hour": 16,
  "source": "demo"
}
```

> `message` ya viene redactado y es el mismo texto que usa el copiloto. Puedes
> mostrarlo tal cual.

---

### `GET /api/route-finder` — el CORE (B6)

Parametros: `origin`, `destination` (**ambos requeridos**, ids de sitio),
`accessible=true`, `hour`.

```jsonc
{
  "geometry": { "type": "LineString", "coordinates": [[lng, lat], ...] },
  "distance_m": 1090,
  "duration_min": 18,
  "approximate": true,              // ← decirlo en pantalla
  "walkable": true,                 // false = mas de 2.5 km, sugerir transporte
  "accessibility_score": 50,        // el % de la cabecera verde del mockup
  "milestones": [
    { "site_id": "...", "site_name": "Mirador de Yanahuara",
      "label": "Rampa disponible", "ok": true }
  ],                                // 8 hitos: 4 por cada extremo
  "accessible_filter": true,
  "origin": { /* SiteWithCrowd */ },
  "destination": { /* SiteWithCrowd */ },
  "hour": 16,
  "saturated": false,
  "alternative": null,              // misma forma que en /api/crowd
  "quiet_hour": null
}
```

> `accessibility_score` es el **minimo** de los dos extremos, no el promedio.
> Una ruta con un extremo inaccesible no es "medio accesible".
>
> `milestones` son los items del timeline vertical del mockup. `ok: false` no es
> un error: es informacion util ("sin bano accesible confirmado").

Errores: `400` si falta origin/destination, `404` si el id no existe.

---

### `GET /api/itinerary` (B10)

Parametros: `hours` (default 4), `start` (0-23), `accessible=true`,
`from` (id del sitio donde arrancar).

```jsonc
{
  "stops": [{
    "site": { /* SiteWithCrowd */ },
    "arrive_hour": 10,
    "arrive_label": "10:00",
    "visit_minutes": 90,
    "travel_from_previous_min": null,   // null en la primera parada
    "travel_from_previous_m": null,
    "walkable": true,
    "crowd_at_arrival": "medio"
  }],
  "total_minutes": 206,
  "skipped": [
    { "site": { /* ... */ }, "reason": "No entra en el tiempo disponible." }
  ],
  "needs_transport": false,
  "start_hour": 9,
  "available_minutes": 300,
  "source": "demo"
}
```

> `skipped` no es descarte silencioso: mostralo. "Queda fuera X porque cierra a
> las 18:00" es informacion, no ruido.

---

### `GET /api/services` (B8, B18)

Parametros: `near` (id de sitio), `category`, `accessible=true`,
`formalized=true`.

```jsonc
{
  "services": [{
    "id": "chicha-por-gaston-acurio",
    "name": "Chicha por Gaston Acurio",
    "provider": "Chicha",
    "category": "restaurante",
    "near_site_id": "monasterio-de-santa-catalina",
    "lat": -16.39617, "lng": -71.53722,
    "wheelchair_accessible": false,
    "formalized": false,
    "registry_id": null,
    "registry_label": "Registro por verificar",   // ← usar esto, ya viene listo
    "url": "https://chicha.com.pe/",
    "price_range": "$$$",
    "notes": "...",
    "distance_m": 187,
    "walking_min": 3
  }],
  "source": "demo",
  "counts": { "restaurante": 3, "agencia": 4 }
}
```

**9 categorias, todas con datos** — necesitan icono propio en `Icons.tsx` (B18):
`restaurante` (3), `agencia` (4), `salud` (2), `actividad` (2), `artesania`,
`guia`, `hospedaje`, `movilidad`. `transporte` existe en el tipo pero todavia no
tiene entradas.

---

### `GET | POST /api/reports` (B11)

**GET** `?site=<id>` — devuelve tambien los motivos validos para el desplegable:

```jsonc
{
  "reports": [{ "id": "...", "site_id": "...", "site_name": "...",
                "issue": "...", "detail": "...", "created_at": "..." }],
  "source": "memoria",              // | "supabase"
  "issues": [
    "Rampa bloqueada o inexistente",
    "Bano accesible fuera de servicio",
    "Escalones sin alternativa",
    "Piso irregular o resbaladizo",
    "Falta senalizacion",
    "Otro"
  ]
}
```

**POST** con `{ site_id, issue, detail? }` → `201 { report, source }`.

> `issue` tiene que ser **exactamente** uno de los strings de `issues`. Cualquier
> otro devuelve `400`. Es una lista cerrada a proposito: el panel de la
> municipalidad necesita poder contar cuantas veces se reporto lo mismo.
>
> `source: "memoria"` significa que el reporte se pierde al reiniciar. Si quieres
> ser transparente en el toast de confirmacion, ese es el dato.

---

### `POST /api/chat` (B9)

Body: `{ messages: [{ role: "user" | "assistant", content: string }], hour?: number }`

Siempre `200`. Dos formas segun quien respondio:

```jsonc
// Con ANTHROPIC_API_KEY y red
{ "reply": "...", "source": "claude" }

// Sin key, sin red, o si la API falla
{
  "reply": "Monasterio de Santa Catalina: muy congestionado. Baja a 20% hacia las 18:00. Si no quieres esperar: Museo Santuarios Andinos, a 9 min a pie.",
  "source": "offline",
  "notice": "Modo sin conexion — respuestas basadas en reglas, sin IA.",
  "reason": "sin_key",            // | "sin_red" | "error_api" | "rechazado"
  "intent": "aforo"               // saludo | accesibilidad | aforo | itinerario
}                                 // | servicios | agradecimiento | desconocido
```

> **`notice` va visible siempre que exista.** Falsear salida de IA frente a un
> jurado destruye el pitch.
>
> `intent` te sirve para `pickMascotState` en B14 sin volver a parsear el texto:
> el motor de reglas ya clasifico la pregunta. Con `source: "claude"` no viene —
> ahi si tendras que mirar palabras clave.

El historial se corta a los ultimos 12 mensajes y cada uno a 2000 caracteres.
Primer mensaje tiene que ser `user`.

---

### `GET /api/site-details` (B17)

`?site=<id>` → `{ detail }`. Sin parametro → `{ details: [...] }`.

```jsonc
{
  "detail": {
    "site_id": "museo-santuarios-andinos",
    "history": "Abrio en 1997 en la Casa del Fundador...",
    "curiosity": "Su pieza central es Juanita, la Dama de Ampato...",
    "best_time": "Al abrir, a las 9:00...",
    "recommended_visit_minutes": 90
  }
}
```

Los 6 sitios tienen ficha. `404` si pides un id que no existe.

---

### `GET /api/stories` (B15)

`?site=<id>` para filtrar. Ordenadas de mas reciente a mas antigua.

```jsonc
{
  "stories": [{
    "id": "santa-catalina-silla-de-ruedas",
    "site_id": "monasterio-de-santa-catalina",
    "site_name": "Monasterio de Santa Catalina",   // resuelto al vuelo
    "author_name": "Equipo Suyu",
    "title": "Lo que el monasterio no te dice antes de entrar",
    "body": "...",
    "tag": "accesibilidad",        // | "consejo" | "experiencia"
    "created_at": "2026-07-20"
  }],
  "curated_by": "equipo"
}
```

> Son 4 historias, todas firmadas por el equipo. **No las presentes como
> testimonios de usuarios** — no hay sistema de envio ni moderacion, y fingir
> que hay comunidad es un dato falso. `curated_by` esta ahi para eso.

---

### `GET /api/agencies` (B16)

```jsonc
{
  "agencies": [{
    "id": "pablo-tour",
    "name": "Pablo Tour",
    "summary": "Operador especializado en el Canon del Colca...",
    "sample_tours": ["Colca de 2 y 3 dias con trekking", "..."],
    "address": "Calle Jerusalen 400, AB-1, Arequipa",
    "phone": "+51 941 414 048",     // null en tres de las cuatro
    "url": "https://www.pablotour.com/",
    "reviews_note": "Resenas publicas en TripAdvisor consistentemente positivas...",
    "reviews_source": "resenas",    // | "agencia" | "premio" | null
    "reviews_source_label": "Segun resenas publicas",   // ← usar esto
    "formalized": false,
    "registry_id": null,
    "registry_label": "Registro por verificar"
  }],
  "disclaimer": "Directorio informativo. No tenemos convenio ni comision..."
}
```

> **No hay ninguna calificacion numerica.** No se pudo verificar ninguna de
> forma independiente, asi que `reviews_note` es texto que declara su propia
> procedencia y `reviews_source_label` la clasifica. **No conviertas eso en
> estrellas** — seria inventar el dato que decidimos no inventar.
>
> `disclaimer` va visible en la pantalla.

---

## Lo que NO existe todavia

- **Endpoint de mapa**: usa `sites[].lat/lng` directo. Los tiles los sirve
  OpenFreeMap sin API key, asi que el mapa ya no depende de ninguna variable
  de entorno; el placeholder de "mapa no disponible" sigue siendo tuyo (B5),
  pero ahora solo aparece si falla la red o no hay WebGL.
- **Datos de aforo en vivo**: `crowd_is_live` siempre viene `false` sin
  Supabase. La tabla `crowd_status` ya existe en `supabase/schema.sql`.
- **Categoria `transporte`**: existe en el tipo, sin entradas.
- **Endpoint de perfil**: las preferencias van en `localStorage` (B11), no hay
  backend de usuarios.

---

## Aviso: Google Fonts no carga desde esta red

`fonts.googleapis.com` falla el handshake TLS desde el entorno del equipo, y eso
**rompe `npm run build`**, no solo el dev server. Por eso quite Geist del
scaffold (nota en `app/layout.tsx`).

Cuando montes Nunito + Yellowtail en B1 vas a chocar con lo mismo. Dos salidas:
probar desde otra red, o autohospedar los `.woff2` en `public/fonts/` con
`@font-face`. La segunda es mas segura para el dia del pitch.

## Si el dev server se comporta raro

404 de chunks o errores de hidratacion casi siempre es `.next` mezclando salida
de `build` con la de `dev`. Mata los procesos node y:

```bash
rm -rf .next && npm run dev
```
