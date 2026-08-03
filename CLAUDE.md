# CLAUDE.md — Wayki: compañero de viaje inteligente para Arequipa

> Contrato técnico del proyecto. Claude Code lee este archivo automáticamente.
> El plan de producto y el pitch viven en `plan_proyecto_wayki_turiston.md`.
> El reparto de trabajo y el plan de commits, en `docs/PLAN-EQUIPO.md`.
> Para reconstruir la app completa desde cero (assets necesarios, tokens de
> diseño exactos, checklist de fidelidad visual), ver `docs/REPLICA-DESDE-CERO.md`.

---

## 1. Qué estamos construyendo

App web (PWA) para TURISTON: Hackathon de Innovación Turística (Arequipa, 3–4 agosto 2026).

**Prioridad de desarrollo original — no te desvíes de este orden si estás recortando alcance:**

1. **Core:** buscador de ruta accesible + mapa. Tiene que funcionar sí o sí.
2. Copiloto conversacional con la API de Claude.
3. Recomendador anti-aforo.
4. Servicios turísticos formalizados.
5. Extras, solo si sobra tiempo.

**Regla de oro:** el jurado prefiere un core sólido y bien demostrado sobre cuatro
funcionalidades a medias.

### 1.1 Qué se construyó finalmente

El alcance creció más allá del MVP original porque el core (1–4) se cerró con
margen. Estado actual, todo funcional:

| Bloque | Estado |
|---|---|
| Ruta accesible + mapa (core) | ✅ |
| Copiloto conversacional (Claude, con motor de reglas offline) | ✅ |
| Recomendador anti-aforo | ✅ |
| Servicios turísticos formalizados | ✅ (9 categorías, ver §6.7) |
| Itinerario del día (planificador voraz) + progreso de visita | ✅ |
| Fichas técnicas por sitio ("Conoce más") | ✅ (§6.8) |
| Historias de viajeros (blog curado) | ✅ (§6.9) |
| Directorio de agencias de turismo aliadas | ✅ (§6.10) |
| Modo oscuro (toggle manual + persistente) | ✅ (§7.6) |
| Mascota ilustrada con 12 estados contextuales | ✅ (§7.5) |
| PWA instalable + service worker | ✅ |

Si vas a replicar el proyecto **desde cero**, `docs/PLAN-EQUIPO.md` tiene el plan
de commits completo para llegar a este mismo estado (no solo al MVP), dividido
entre 2 personas.

---

## 2. Las tres decisiones de arquitectura que mandan sobre todo lo demás

Si una decisión de implementación contradice alguna de estas, gana la de aquí.

### 2.1 Offline-first, mejora progresiva con conexión

La app **debe funcionar completa sin red y sin ninguna API key**. Todo lo esencial
vive en JSON local. La conexión *mejora* la experiencia, nunca es requisito.

| Función | Sin conexión / sin keys | Con conexión y keys |
|---|---|---|
| Sitios y accesibilidad | `data/seed-sites.json` | Supabase (datos editables en vivo) |
| Aforo | perfil horario local (`crowd_profile`) | + reportes manuales en `crowd_status` |
| Ruta | línea recta + haversine, marcada como aproximada | Mapbox Directions (ruta peatonal real) |
| Mapa | aviso de "mapa no disponible" | Mapbox GL |
| Copiloto | asistente por reglas, **etiquetado como tal** | Claude (`claude-sonnet-5`) |
| Servicios turísticos | `data/seed-services.json` | + enlaces externos del proveedor |
| Fichas técnicas, historias, agencias | `data/site-details.json`, `seed-stories.json`, `seed-agencies.json` | (sin backend propio, ver §6.8-6.10) |
| Reportes | almacén en memoria del proceso | tabla `accessibility_reports` |

**Nunca simules salida de IA.** Si no hay `ANTHROPIC_API_KEY` o no hay red, el
copiloto responde con el motor de reglas y lo dice en pantalla
("Modo sin conexión — respuestas basadas en reglas, sin IA"). Falsear respuestas
de un modelo frente a un jurado destruye la credibilidad del pitch.

Este mismo principio de honestidad aplica a **cualquier dato mostrado como
verificado**: si un dato no está confirmado de forma independiente (una
calificación, un registro formal, una cifra de impacto), la UI lo dice
explícitamente ("por verificar", "autoreportado por la agencia", etc.) en vez de
presentarlo como un hecho. Ver §6.10 para el caso concreto que motivó esta regla.

### 2.2 Contrato compartido: `lib/types.ts` + endpoints estables

Las pantallas **nunca** importan de `data/` ni de Supabase directamente: siempre
consumen `/api/*`. Esto es lo que permite que dos personas trabajen en paralelo
sin bloquearse (ver §8).

Cambiar la **forma** de una respuesta de `/api/*` o un tipo de `lib/types.ts` es
un cambio de contrato: se avisa al equipo antes de commitear.

### 2.3 El color nunca carga el significado solo

La app trata sobre accesibilidad. La paleta de aforo está validada, pero queda en
la banda CVD 6–8 y el ámbar no llega a 3:1 de contraste. Por eso **todo** nivel de
aforo va acompañado de texto, altura de barra o vista de tabla. Ver §6.3.

Esto se extiende al modo oscuro (§7.6): los tokens de aforo se reinvirtieron por
separado para el tema oscuro, y cualquier color nuevo que se agregue debe
revisarse en **ambos** temas antes de commitear, no solo en claro.

---

## 3. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 15.5** (App Router, TypeScript, Turbopack) | Front + API en un proyecto, deploy trivial |
| React | **19.1** | Viene con Next 15.5 |
| Mapas | Mapbox GL JS (`mapbox-gl` ^3.27) + Static Images API | Free tier generoso, capas custom |
| Base de datos | Supabase (`@supabase/supabase-js` ^2.111, Postgres) | Setup rápido, dashboard para cargar datos a mano |
| IA | API de Anthropic — modelo `claude-sonnet-5`, **vía `fetch` directo** | Un solo endpoint, sin dependencia del SDK (`lib/anthropic.ts`) |
| Estilos | Tailwind CSS **v4** (`@tailwindcss/postcss`) | Rápido de maquetar; `@custom-variant dark` habilita el toggle manual |
| Deploy | Vercel | Integración nativa con Next.js |

> **Fija Next.js 15, no 16.** Next 16 exige Node ≥ 20.9 y el entorno del equipo
> puede correr una versión más vieja. Los warnings `EBADENGINE` de npm son ruido
> esperado si tu Node es más nuevo de lo que el `engines` del proyecto declara.
>
> ```bash
> npx create-next-app@15 wayki --typescript --tailwind --app --eslint --import-alias "@/*" --use-npm
> npm install @supabase/supabase-js mapbox-gl
> ```

No hay dependencia de `@anthropic-ai/sdk`: `lib/anthropic.ts` arma el `system
prompt` y llama `https://api.anthropic.com/v1/messages` directamente con
`fetch`, para no cargar el SDK completo por una sola llamada.

---

## 4. Cuentas y variables de entorno

Nada de esto bloquea el desarrollo (§2.1), pero hace falta para el demo completo.

1. **Anthropic**: [console.anthropic.com](https://console.anthropic.com) → API Keys. Requiere crédito.
2. **Mapbox**: [account.mapbox.com](https://account.mapbox.com) → Tokens → "Default public token".
3. **Supabase**: [supabase.com](https://supabase.com) → New Project → Settings → API.
4. **Vercel**: [vercel.com](https://vercel.com), conectado a GitHub.

`.env.local` (copiar de `.env.local.example`):

```bash
# Servidor — nunca exponer al cliente
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_SERVICE_ROLE_KEY=...

# Cliente — el prefijo NEXT_PUBLIC_ es obligatorio
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
```

En Vercel, las mismas variables en **Project Settings → Environment Variables**.

> `lib/supabase.ts` usa un placeholder válido cuando falta la URL: sin él,
> `createClient` lanza excepción y **rompe el build**, no solo el runtime.
> `getSupabaseAdmin()` (cliente con `SUPABASE_SERVICE_ROLE_KEY`) existe para uso
> futuro server-only; hoy ningún endpoint lo llama todavía.

---

## 5. Estructura de carpetas

```
wayki/
├── CLAUDE.md
├── README.md                    # arranque para humanos
├── docs/
│   ├── PLAN-EQUIPO.md           # reparto y plan de commits (MVP + todo lo agregado despues)
│   └── REPLICA-DESDE-CERO.md    # guia para reconstruir la app entera desde cero
├── img_ref_turiston.png         # mockup de referencia de UI (necesario para fidelidad visual)
├── material_proyecto/
│   └── WaikyIA.png              # hoja de referencia de la mascota, 12 poses (necesario)
├── data/
│   ├── seed-sites.json          # 6 sitios piloto
│   ├── seed-services.json       # servicios turisticos (9 categorias, ver §6.7)
│   ├── site-details.json        # fichas tecnicas por sitio (§6.8)
│   ├── seed-stories.json        # historias de viajeros curadas (§6.9)
│   └── seed-agencies.json       # agencias de turismo aliadas (§6.10)
├── supabase/schema.sql          # esquema completo + migración
├── lib/                         # ── PERSONA A ──
│   ├── types.ts                 # CONTRATO COMPARTIDO
│   ├── seed.ts                  # datos locales → SiteWithCrowd
│   ├── sites.ts                 # Supabase con fallback a seed
│   ├── services.ts               # servicios turísticos
│   ├── siteDetails.ts            # fichas tecnicas (solo seed, sin Supabase)
│   ├── stories.ts                 # historias de viajeros (solo seed, sin Supabase)
│   ├── agencies.ts                # agencias aliadas (solo seed, sin Supabase)
│   ├── crowdProfile.ts          # aforo por hora, hora tranquila
│   ├── crowd.ts                 # recomendador anti-aforo
│   ├── crowdUi.ts               # presentacion compartida del nivel de aforo (colores, labels)
│   ├── itinerary.ts             # planificador voraz
│   ├── offlineAssistant.ts      # copiloto por reglas
│   ├── geo.ts                   # haversine, tiempo a pie
│   ├── filters.ts               # filtros de accesibilidad
│   ├── reports.ts               # reportes (Supabase o memoria)
│   ├── anthropic.ts             # llamada directa a la API de Claude (sin SDK)
│   └── supabase.ts
├── app/
│   ├── api/                     # ── PERSONA A ──
│   │   ├── sites/route.ts
│   │   ├── services/route.ts
│   │   ├── site-details/route.ts
│   │   ├── stories/route.ts
│   │   ├── agencies/route.ts
│   │   ├── route-finder/route.ts
│   │   ├── reports/route.ts
│   │   └── chat/route.ts
│   ├── globals.css              # ── PERSONA B ── tokens de diseño, claro + oscuro
│   ├── layout.tsx               # ── PERSONA B ── incluye script anti-parpadeo de tema
│   ├── page.tsx                 # Inicio
│   ├── ruta/page.tsx             # CORE
│   ├── explorar/page.tsx
│   ├── sitio/[id]/page.tsx      # Estado del lugar + ficha tecnica + historias del sitio
│   ├── itinerario/page.tsx      # planificador + progreso de visita
│   ├── chat/page.tsx
│   ├── historias/page.tsx
│   ├── agencias/page.tsx
│   ├── panel/page.tsx           # municipalidad / operadores
│   └── perfil/page.tsx          # preferencias + toggle de tema
├── components/                  # ── PERSONA B ──
│   ├── Mascot.tsx                # 12 estados ilustrados (ver §7.5), no vectorial
│   ├── ThemeToggle.tsx            # toggle claro/oscuro + hook useTheme()
│   ├── Icons.tsx                 # iconografia propia (nada de emoji)
│   ├── PwaProvider.tsx           # registra el SW + aviso sin conexión
│   └── ServiceList.tsx
└── public/
    ├── manifest.json
    ├── sw.js                    # service worker escrito a mano
    ├── icon-192.png / icon-512.png / icon-maskable-512.png
    └── mascot/                  # 12 PNG, uno por MascotState (ver §7.5)
```

### 5.1 Notas del service worker

- Se registra **solo en producción** (`PwaProvider`): en desarrollo un SW
  cacheando chunks de Turbopack provoca 404 y errores de hidratación.
- `/api/sites` y `/api/services`: red primero con copia en caché; si todo falla,
  devuelve un JSON sintético `{ sites: [], services: [], source: "offline" }` en
  vez de romper la pantalla.
- `/api/chat` y `/api/reports`: **solo red**. El chat cae al motor de reglas del
  cliente; los reportes no se pueden inventar sin conexión.
- Tiles de Mapbox: **nunca se cachean**, sus términos de uso lo limitan (ni
  siquiera son same-origin, así que el SW los deja pasar directo a red).
- `/api/site-details`, `/api/stories`, `/api/agencies` no tienen estrategia
  especial: son contenido estático curado, cachean igual que cualquier otra
  ruta bajo la regla "cache-first con revalidación en segundo plano".

---

## 6. Modelo de datos y reglas de negocio

### 6.1 Tipos (contrato compartido — `lib/types.ts`)

```ts
export type CrowdLevel = "bajo" | "medio" | "alto";
export type VerifiedBy = "equipo" | "usuario";

export interface Site {
  id: string; name: string; lat: number; lng: number; category: string;
  wheelchair_accessible: boolean; has_ramps: boolean;
  has_accessible_bathroom: boolean; has_rest_areas: boolean;
  notes: string;
  verified_by: VerifiedBy | null;   // procedencia del dato
  verified_at: string | null;
  crowd_profile: number[];          // 24 valores 0-100, índice 0 = 00:00
}

export interface SiteWithCrowd extends Site {
  crowd_level: CrowdLevel | null;
  crowd_is_live: boolean;   // true si viene de un reporte, no del perfil
  crowd_closed: boolean;    // ocupación 0 = cerrado, NO "poca gente"
}

export type ServiceCategory =
  | "restaurante" | "guia" | "agencia" | "transporte" | "hospedaje" | "artesania"
  | "movilidad" | "salud" | "actividad";   // agregadas para el directorio ampliado (§6.7)

export interface TouristService {
  id: string; name: string; provider: string;
  category: ServiceCategory;
  near_site_id: string; lat: number; lng: number;
  wheelchair_accessible: boolean;
  formalized: boolean;      // registrado formalmente
  registry_id: string | null;
  url: string | null;       // enlace al proveedor
  price_range: "$" | "$$" | "$$$" | null;
  notes: string;
}

export interface AccessibilityReport {
  id: string; site_id: string; site_name: string;
  issue: string; detail: string; created_at: string;
}

export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface ChatMessage { role: "user" | "assistant"; content: string; }

/** Ficha tecnica curada de un sitio (§6.8). */
export interface SiteDetail {
  site_id: string; history: string; curiosity: string;
  best_time: string; recommended_visit_minutes: number;
}

/** Historia de viajero curada por el equipo, sin backend de usuarios (§6.9). */
export interface Story {
  id: string; site_id: string; site_name: string; author_name: string;
  title: string; body: string; tag: string; created_at: string;
}

/** Agencia de turismo real ya operando en Arequipa, no un afiliado (§6.10). */
export interface PartnerAgency {
  id: string; name: string; summary: string; sample_tours: string[];
  address: string | null; phone: string | null; url: string;
  reviews_note: string;
  reviews_source: "agencia" | "resenas" | "premio" | null;
  formalized: boolean; registry_id: string | null;
}
```

### 6.2 Esquema Supabase

Completo en `supabase/schema.sql` (incluye RLS y una sección de migración
comentada). Tablas: `sites`, `crowd_status`, `accessibility_reports`, `services`.

**Gap conocido:** el check constraint de `services.category` en
`supabase/schema.sql` solo permite `restaurante/guia/agencia/transporte/
hospedaje/artesania` — no incluye `movilidad/salud/actividad`, que sí existen en
`ServiceCategory` (lib/types.ts) y en `data/seed-services.json`. Mientras no se
corrija el `ALTER TABLE`, esas 3 categorías **solo funcionan en modo demo** (JSON
local); si se cargan a Supabase con esas categorías, el insert falla. Si estás
replicando desde cero, agrega las 3 al constraint desde el `CREATE TABLE`
inicial (ver `docs/REPLICA-DESDE-CERO.md`).

`site_details`, `stories` y `agencies` **no tienen tabla en Supabase todavía**:
viven solo como JSON curado (§6.8-6.10) y no se ofrecen para edición en vivo.
Es una decisión consciente, no un olvido — son contenido editorial, no datos
operativos que cambien en producción.

### 6.3 Aforo — la regla que más se malinterpreta

```ts
// Umbrales sobre crowd_profile[hora]
occupancy >= 70  → "alto"
occupancy >= 40  → "medio"
occupancy >   0  → "bajo"
occupancy === 0  → CERRADO   // ← no es "poca gente"
```

Un reporte manual en `crowd_status` **manda** sobre la predicción horaria y marca
`crowd_is_live = true`.

**Presentación (§2.3):** `CrowdBadge` siempre lleva etiqueta de texto
("Poca gente" / "Algo concurrido" / "Muy congestionado" / "Cerrado").
`CrowdChart` usa la altura de barra como codificación primaria y ofrece
"Ver tabla". El panel incluye la tabla completa por sitio.

### 6.4 Recomendador anti-aforo (`lib/crowd.ts`)

Si el sitio está en `alto`, busca alternativa: **primero misma categoría** con
menos gente; si no existe (varias categorías tienen un solo sitio), cae al **más
cercano menos congestionado**. Sin ese fallback la función nunca se dispara en el
demo. Opcionalmente filtra solo sitios accesibles.

Complemento: `nextQuietHour()` permite el mensaje *"está saturado ahora, a las
17:00 baja a 20%"*, que es más útil que solo desviar al usuario.

### 6.5 Ruta accesible (`/api/route-finder`)

Entrada: `origin`, `destination`, `accessible`, `hour`.
Salida: geometría, distancia, duración, `approximate`, origen, destino,
`alternative`, `quiet_hour`.

Sin token de Mapbox devuelve **línea recta + haversine** con `approximate: true`,
y la UI lo dice. No es una ruta óptima real: las anotaciones de accesibilidad se
superponen como hitos, no se calculan.

### 6.6 Copiloto

- **Con red y key:** `/api/chat` → `lib/anthropic.ts` llama a Claude
  (`claude-sonnet-5`) vía `fetch` directo con un system prompt que incluye los
  sitios resumidos (accesibilidad, aforo actual, próxima hora tranquila). Nunca
  le pases las 24 cifras crudas de cada perfil; resúmelas.
- **Sin red o sin key:** `lib/offlineAssistant.ts`. Detecta intención por
  palabras clave (silla de ruedas, rampas, baño, descanso, horas disponibles,
  categoría) vía `parseIntent()` y compone la respuesta reutilizando
  `buildItinerary()` y `suggestAlternative()`. **Siempre con el aviso de modo
  sin conexión** (`OFFLINE_NOTICE`).
- El widget (`components/ChatWidget.tsx`) además elige un estado de la mascota
  por mensaje según palabras clave del turno del usuario (saludo, ruta, aforo,
  agradecimiento) — ver §7.5. Es presentación, no cambia la lógica de la
  respuesta.

### 6.7 Servicios turísticos (`lib/services.ts`, `/api/services`)

Dataset curado de operadores cerca de cada sitio, con enlace al proveedor. El
campo `formalized` + `registry_id` es el diferenciador: conecta con la
problemática de digitalización y formalización de servicios de TURISTON, y es
honesto sobre la procedencia del dato — si no está confirmado, `formalized:
false, registry_id: null` y la UI muestra "Registro por verificar". **Nunca
inventes un número de registro real** (RUC, MINSA, etc.) solo para que se vea
más verificado: ya pasó una vez en este proyecto y hubo que revertirlo.

9 categorías (`ServiceCategory`, §6.1): las 6 originales (restaurante, guía,
agencia, transporte, hospedaje, artesanía) más 3 agregadas para reforzar la
tesis de accesibilidad: `movilidad` (alquiler de sillas de ruedas/bastones),
`salud` (farmacias/clínicas accesibles cerca de cada sitio), `actividad`
(tours y talleres accesibles). Cada categoría nueva tiene su propio icono en
`components/Icons.tsx` (`SERVICE_PATHS`).

No usamos APIs de afiliados (GetYourGuide, Viator): requieren aprobación previa
de días o semanas. Si más adelante se suma Google Places, va como
*enriquecimiento* opcional, nunca como requisito (§2.1).

### 6.8 Fichas técnicas (`lib/siteDetails.ts`, `/api/site-details`)

Contenido editorial curado a mano por sitio — historia breve, un dato curioso,
mejor momento para visitar y minutos recomendados de visita — pensado para
promover la curiosidad del turista antes de llegar. Vive en
`data/site-details.json`, un registro por `site_id`, sin tabla en Supabase
(§6.2): es texto que el equipo escribe una vez, no un dato operativo que cambie.

Se muestra en `/sitio/[id]` como la sección "Conoce más", siempre después de la
información de accesibilidad y aforo (que es la prioridad de la pantalla).

### 6.9 Historias de viajeros (`lib/stories.ts`, `/api/stories`, `/historias`)

Blog curado por el equipo, **no** un sistema de comentarios de usuarios: no hay
formulario de envío ni moderación, porque construir eso bien no entraba en el
alcance y publicar contenido sin moderar habría sido peor que no tenerlo. Vive
en `data/seed-stories.json` (4 historias, cada una ligada a un `site_id`, con
`author_name`, `tag` como "accesibilidad"/"experiencia"/"consejo").

`getSeedStories()` resuelve `site_name` cruzando con `getSeedSites()` en vez de
duplicar el nombre del sitio en el JSON de historias — si cambia el nombre de un
sitio, las historias no quedan desincronizadas.

Roadmap explícito (no construido): un backend real de historias de usuario
seguiría el mismo patrón que `accessibility_reports` — tabla en Supabase,
`crowd_is_live`-style flag, moderación antes de publicar, y alimentaría de vuelta
`verified_by: "usuario"` en los sitios.

### 6.10 Agencias de turismo aliadas (`lib/agencies.ts`, `/api/agencies`, `/agencias`)

Directorio informativo de operadores turísticos **reales, ya operando en
Arequipa** (Arequipa Tours Perú, Pablo Tour, Giardino Tours, Chacu Travel),
pensado para que el turista compare itinerarios y precios existentes contra el
plan que arma Wayki. Vive en `data/seed-agencies.json`, sin tabla en Supabase
(§6.2) ni integración de reservas: son enlaces de salida a cada operador.

**Regla de honestidad que originó §2.1 (párrafo de datos verificados):** no se
pudo obtener una calificación numérica verificada de forma independiente para
estas agencias (TripAdvisor y GetYourGuide bloquean scraping). En vez de
inventar una cifra, `reviews_note` siempre es texto que **declara su propia
procedencia**, y `reviews_source` la clasifica:

- `"agencia"` — dato autoreportado por la propia agencia (ej. "99.5% de reseñas
  positivas, según su sitio web").
- `"resenas"` — consenso cualitativo de reseñas públicas, sin cifra exacta.
- `"premio"` — una distinción pública verificable (ej. TripAdvisor Travelers'
  Choice), no una cifra que el equipo haya calculado.
- `null` — todavía no hay evidencia suficiente; la UI lo dice ("reseñas
  limitadas, confirmar antes de reservar") en vez de omitir el campo.

**Nunca muestres una calificación o precio que no puedas atribuir a una fuente
concreta.** Si no se puede verificar, se dice explícitamente — no se omite en
silencio ni se aproxima.

---

## 7. Sistema de diseño

La UI sigue el mockup `img_ref_turiston.png` (raíz del repo): app móvil de viajes,
**no** dashboard. Móvil primero; escritorio se ensancha.

### 7.1 Tokens (`app/globals.css`)

Tailwind v4: paleta base en un bloque `@theme`, tokens auxiliares (aforo,
gráficos, texto de alerta) en un bloque `:root` plano, y **todo** lo que debe
verse distinto en modo oscuro se redefine en un bloque `.dark` — nunca se
duplican los tokens de `@theme`, se sobreescribe el valor de la misma variable
CSS (ver §7.6 para por qué la separación importa).

```
sand-50  #fdfbf6   superficie de tarjeta       (oscuro: #1c1e29)
sand-100 #f8f2e7   fondo de página             (oscuro: #14151d)
sand-200 #ede3d2   bordes                      (oscuro: #2c2f3f)
sand-300 #dfd2bc   bordes fuertes / ícono mudo (oscuro: #454a60)
forest-700 #15664a acción primaria, accesibilidad (oscuro: #3aa877)
clay-600  #c9502a  marca, acento, estado activo   (oscuro: #dd6b42)
night-800 #262a4f  superficies del copiloto       (fijo, no invierte)
ink       #2e2a25  texto                          (oscuro: #f2ede4)
```

Aforo (validado contra `#fdfbf6` en claro, recalibrado para contraste en
oscuro): `--crowd-bajo`, `--crowd-medio`, `--crowd-alto` — valores distintos por
tema, ver `.dark` en `globals.css`.

Tokens **fijos** que nunca invierten con el tema (y por qué): `--color-cream`
(texto claro sobre botones/burbujas de color — invertirlo rompería el
contraste del botón), `--color-scrim` (fondo de modales/alertas), `--color-
forest-banner-from/to` (el degradado "Accesibilidad %" siempre necesita verde
oscuro + texto claro, sin importar el tema), y toda la familia `night-*`
(superficie del copiloto, deliberadamente oscura en ambos temas).

> Si cambias estos hexes, revisa el resultado en **ambos** temas — varios
> tokens de esta app se usan en dos roles distintos (fondo de botón Y texto
> suelto sobre superficie neutra) y lo que contrasta bien en uno puede romperse
> en el otro. Corre el validador de la skill `dataviz`
> (`scripts/validate_palette.js`, con `--surface "#fdfbf6"`) para la paleta de
> aforo en claro; en oscuro, revisa a ojo contra `#1c1e29`.

### 7.2 Tipografía

**Nunito** (cuerpo) + **Yellowtail** (wordmark), vía `next/font/google`.

> Las variables de fuente van en un bloque **`@theme inline`**, no en `@theme`.
> Con `@theme` a secas Tailwind resuelve el valor en build, cuando
> `--font-yellowtail` todavía no existe, y el utility sale vacío.

### 7.3 Formas y navegación

- Tarjetas `rounded-3xl`, botones pill (`rounded-full`).
- Banda textil andina: clase `.andean-band` (SVG data-uri, sin imágenes).
- **Móvil:** barra inferior fija con FAB central de la mascota → copiloto.
- **Escritorio (`md:`):** header superior con `ThemeToggle` a la derecha; la
  barra inferior se oculta.

### 7.4 Nada de emoji — iconografía propia

**No uses emoji en la interfaz.** Cambian de forma según el sistema operativo, no
heredan `currentColor` y rompen la coherencia visual. Todo icono sale de:

- `components/Icons.tsx` — saludo, densidad de gente, enlace externo, operador
  con registro, sin conexión, categorías de servicio (incluye las 3 nuevas de
  §6.7), reportar problema, sol/luna del toggle de tema.
- `components/AccessibilityIcons.tsx` — silla de ruedas, rampas, baño, descansos.

En `CrowdDensityIcon` la **cantidad de siluetas** (una, dos o tres) es la
codificación primaria; el color solo refuerza (§2.3).

### 7.5 Mascota — `components/Mascot.tsx`

**Ya no es un SVG vectorial de una sola pose.** Es una alpaca ilustrada con
chullo, recortada en 12 estados a partir de la hoja de referencia
`material_proyecto/WaikyIA.png` (500×500 px), cada uno guardado como PNG
individual en `public/mascot/`:

```ts
export type MascotState =
  | "wave" | "smile" | "look" | "back"       // saludo, sonrisa, perfil, espaldas
  | "laugh" | "calm" | "cheer" | "confused"  // riendo, tranquila (default), contenta, confundida
  | "search" | "map" | "chat" | "cool";      // lupa, mapa, telefono/chat, lentes de sol
```

`<Mascot size={40} state="wave" />` — mismo `size`/`className`/`title` de
siempre, `state` es nuevo y por defecto es `"calm"`. Como la API vieja
(`<Mascot size={n} />` sin `state`) sigue siendo válida, ningún call site se
rompe al agregar el prop.

**Dónde cambia según el contexto (el caso que motivó el prop):**
`components/ChatWidget.tsx` elige el estado por mensaje con
`pickMascotState(texto)`, una función de palabras clave (saludo → `wave`,
agradecimiento → `cheer`, ruta/mapa → `map`, buscar/aforo lleno → `search`,
resto → `chat`); el header cambia entre `chat` y `confused` según
`navigator.onLine`; el estado vacío usa `wave`; el indicador de "escribiendo"
usa `search`. Otras pantallas usan una pose fija que encaja con el momento
(`wave` en los saludos de Inicio/Perfil, `map` en la recomendación anti-aforo de
`/sitio/[id]`), y todo lo demás cae al default `calm`.

Si agregas una pantalla nueva con mascota, **no hace falta** justificar un
estado específico — `calm` es un default seguro. Solo elige un estado distinto
si el contexto lo pide con claridad (igual que los ejemplos de arriba).

Sigue siendo decorativa por defecto (`aria-hidden` salvo que pases `title`).

### 7.6 Modo oscuro

Toggle manual (no solo `prefers-color-scheme`), persistido en
`localStorage["wayki:theme"]`, sin parpadeo al cargar.

- `app/globals.css`: `@custom-variant dark (&:where(.dark, .dark *));` habilita
  `dark:` como variante de **clase**, no solo de preferencia del sistema.
- `components/ThemeToggle.tsx`: exporta `applyTheme(theme)` (aplica la clase +
  guarda en localStorage) y `useTheme()` (hook: lee la clase ya puesta por el
  script anti-parpadeo, expone `{ theme, toggle }`). El botón visible vive en el
  header de escritorio; en móvil, la fila "Tema oscuro" en `/perfil`.
- `app/layout.tsx`: un `<script>` inline (`THEME_INIT_SCRIPT`) en `<head>` lee
  `localStorage`/`prefers-color-scheme` y agrega la clase `dark` al `<html>`
  **antes** de que React hidrate. Por diseño, el HTML del servidor y el del
  cliente difieren en esa clase — por eso `<html suppressHydrationWarning>` es
  necesario ahí específicamente, no en el resto del árbol.

**La trampa que ya se resolvió una vez, para no repetirla:** varios tokens de
esta app se usan en dos roles incompatibles al mismo tiempo — por ejemplo
`sand-50` es tanto "superficie de tarjeta" (debe invertir a oscuro) como, en
otros componentes, "texto claro sobre un botón de color" (debe quedarse fijo,
si invierte el botón pierde contraste). Antes de reusar un token existente en
un lugar nuevo, confirma cuál de los dos roles aplica; si es el segundo, usa
`--color-cream`/`--color-scrim` (fijos) en vez del token de superficie.

### 7.7 Accesibilidad de la propia UI

No es opcional: es la tesis del proyecto y un jurado puede tabular por ella.

- Link "Saltar al contenido", foco visible siempre (`:focus-visible`).
- `aria-live` en resultados de ruta y en el chat.
- Labels asociados (`htmlFor`/`id`), `aria-current` en navegación.
- Estados nunca solo por color (§2.3).
- `prefers-reduced-motion` respetado — incluye la transición global de cambio
  de tema (§7.6), que se colapsa a ~0 igual que cualquier otra animación.
- Modales (`ReportDialog`) cierran con Escape y mueven el foco al abrirse.

---

## 8. Trabajo en paralelo sin bloqueos

Reparto **por capa**. El detalle y el plan de commits completo (MVP + todo lo
agregado después) están en `docs/PLAN-EQUIPO.md`; aquí queda la regla que lo
hace funcionar.

| | Persona A — datos y API | Persona B — UI y pantallas |
|---|---|---|
| **Posee** | `lib/`, `app/api/`, `supabase/`, `data/` | `components/`, `app/**/page.tsx`, `app/layout.tsx`, `app/globals.css`, `public/` |
| **No toca** | `components/`, `app/**/page.tsx` | `lib/`, `app/api/` |

**El mecanismo antibloqueo:** en el commit conjunto inicial se crean
`lib/types.ts`, los JSON semilla y los **endpoints stub** que ya devuelven esos
datos con la forma final. Desde el minuto 1:

- **B** programa contra endpoints que ya responden datos válidos y nunca espera a A.
- **A** valida sus endpoints con `curl` y nunca espera a B.
- A va reemplazando el interior de cada endpoint (seed → Supabase) **sin cambiar
  la forma de la respuesta**.

**Protocolo de conflictos:**
- Cambiar `lib/types.ts` o la forma de una respuesta → avisar antes de commitear.
- Agregar dependencias a `package.json` → avisar (es el archivo que más choca).
- Nadie commitea en la rama del otro. Merge en los puntos de sincronización.

---

## 9. Comandos

```bash
npm run dev      # desarrollo en http://localhost:3000 (Turbopack)
npm run build    # verificar que compila antes de cada push (Turbopack)
npm run start    # servir el build de produccion
npm run lint     # eslint
vercel --prod    # deploy
```

**Si el dev server se comporta raro** (404 de chunks, errores de hidratación,
`EPERM` sobre `.next/trace`): casi siempre es `.next` mezclando salida de
`build` con la de `dev`, o un dev server viejo vivo en el puerto.

```bash
# matar procesos node del proyecto, luego:
rm -rf .next && npm run dev
```

---

## 10. Reglas para Claude Code en este repo

- **No sobre-diseñar.** Que el core funcione de punta a punta antes de pulir o
  agregar — sigue valiendo aunque ya no estemos en el sprint de 2 días.
- Si algo de la §6 toma más de lo esperado, **simplifícalo** (hardcodear vale) en
  vez de bloquear el resto.
- **Respeta la propiedad de archivos de la §8.** Si el cambio pedido cae en la
  capa de la otra persona, dilo antes de tocarlo.
- Commits pequeños y frecuentes con mensajes claros: tiene que ser fácil volver
  atrás rápido.
- Ante ambigüedad de producto no cubierta aquí, resuelve a favor de lo más rápido
  de demostrar en vivo y **deja nota de la decisión** en el commit.
- Comentarios solo donde el *por qué* no sea obvio del código. Nada de comentar lo
  que el código ya dice.
- **No hacen falta tests.** Es un prototipo de demo. Sí hace falta que
  `npm run build` pase antes de cada push.
- Verifica la UI mirándola (capturas a 390 px, y también en modo oscuro), no
  solo compilando: los bugs que más han aparecido en este proyecto fueron
  visuales o de contraste entre temas, no de tipos.
- **Nunca fabriques un dato como si estuviera verificado** (calificación,
  número de registro, cifra de impacto) cuando no tienes una fuente concreta.
  Dilo explícitamente en la UI en vez de aproximar o inventar — ver §2.1 y §6.10.
