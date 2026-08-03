# Plan de equipo — Wayki

> Reparto de trabajo y plan de commits para 2 personas.
> El contrato técnico está en `CLAUDE.md`. El pitch, en `plan_proyecto_wayki_turiston.md`.
> Para una guía de reconstrucción desde cero con checklist de fidelidad visual y
> lista de assets necesarios, ver `docs/REPLICA-DESDE-CERO.md`.

> **Este documento cubre dos cosas:** el plan original de 2 días de hackathon
> (§3-§6, commits A1-A10 / B1-B12) **y** todo lo que se agregó después una vez
> que el core cerró con margen (§6.1, commits A11-A14 / B13-B18). Si estás
> replicando la app **desde cero** y quieres el estado actual completo (no solo
> el MVP), ejecuta ambos bloques de commits en orden — el segundo bloque
> depende de que el primero ya esté en `main`.

---

## 1. La idea en una frase

Dos personas trabajan **por capa**: A construye datos y API, B construye UI.
Ninguna espera a la otra porque el **commit 0** deja los tipos, los datos semilla
y los endpoints stub ya funcionando.

---

## 2. Quién posee qué

| | **Persona A — Datos y API** | **Persona B — UI y pantallas** |
|---|---|---|
| Carpetas | `lib/`, `app/api/`, `supabase/`, `data/` | `components/`, `app/**/page.tsx`, `app/layout.tsx`, `app/globals.css`, `public/` |
| Verifica con | `curl` a los endpoints | navegador a 390 px |
| No toca | `components/`, `app/**/page.tsx` | `lib/`, `app/api/` |

**Archivos compartidos** (avisar antes de tocar): `lib/types.ts`, `package.json`,
`CLAUDE.md`.

**Ramas:** `track/a-datos` y `track/b-ui`, ambas salen de `main`. Merge a `main`
solo en los puntos de sincronización (§5).

---

## 3. Commit 0 — juntos, antes de dividirse

**~45 min. Nadie empieza su track hasta que esto esté en `main`.**

```
chore: scaffold Next.js 15 + contrato compartido
```

Contenido:

1. `npx create-next-app@15 wayki --typescript --tailwind --app --eslint --import-alias "@/*" --use-npm`
2. `npm install @supabase/supabase-js mapbox-gl`
3. `lib/types.ts` completo (copiar de `CLAUDE.md` §6.1)
4. `data/seed-sites.json` — 6 sitios con `crowd_profile` de 24 valores,
   `verified_by`, `verified_at`
5. `data/seed-services.json` — servicios formalizados
6. `lib/seed.ts` — JSON → `SiteWithCrowd[]` (ids por slug del nombre, estables)
7. **Endpoints stub** que ya devuelven la forma final:
   - `GET /api/sites` → `{ sites, source: "demo", hour }`
   - `GET /api/services` → `{ services }`
   - `GET /api/route-finder` → línea recta + haversine
   - `GET|POST /api/reports` → almacén en memoria
   - `POST /api/chat` → 503 con mensaje explicativo
8. `.env.local.example`
9. `CLAUDE.md`, `docs/PLAN-EQUIPO.md`, `README.md`

**Criterio de listo:** `npm run build` pasa y
`curl localhost:3000/api/sites` devuelve los 6 sitios.

> A partir de aquí B nunca ve una pantalla vacía y A nunca necesita la UI.

> **Si estás construyendo el estado actual completo (no solo el MVP):** define
> el check constraint de `services.category` en `supabase/schema.sql` con las
> **9 categorías desde el inicio** (`restaurante, guia, agencia, transporte,
> hospedaje, artesania, movilidad, salud, actividad`), no solo las 6
> originales. En el proyecto real ese constraint se quedó corto cuando se
> agregaron las 3 categorías nuevas en A14 y quedó como deuda técnica
> documentada en `CLAUDE.md` §6.2 — evítala de entrada si estás empezando de
> cero.

---

## 4. Los dos tracks

Cada commit es autocontenido: al terminarlo, `npm run build` pasa y la app sigue
levantando. Si un commit no cumple eso, es demasiado grande.

### Track A — Datos y API

| # | Commit | Qué entra | Est. |
|---|---|---|---|
| A1 | `feat(data): aforo por hora y procedencia del dato` | `lib/crowdProfile.ts` (umbrales, `nextQuietHour`, `bestHour`, `isClosedAt`). Umbral 0 = **cerrado**, no "bajo" | 1 h |
| A2 | `feat(api): sitios con aforo calculado por hora` | `lib/sites.ts` con fallback, param `?hour=` en `/api/sites` | 45 min |
| A3 | `feat(api): ruta accesible con fallback sin Mapbox` | `lib/geo.ts`, Directions API, `approximate: true` si no hay token | 1 h |
| A4 | `feat(api): recomendador anti-aforo` | `lib/crowd.ts` con fallback a "más cercano menos congestionado" | 45 min |
| A5 | `feat(api): servicios turísticos formalizados` | `lib/services.ts`, `/api/services?near=<siteId>` | 45 min |
| A6 | `feat(api): reportes de accesibilidad` | `lib/reports.ts` (Supabase → memoria), `GET|POST /api/reports` | 45 min |
| A7 | `feat(lib): planificador de itinerario` | `lib/itinerary.ts`: voraz, duración por categoría, tramos no caminables | 1.5 h |
| A8 | `feat(db): Supabase real detrás de los mismos endpoints` | `supabase/schema.sql`, `lib/supabase.ts` con placeholder, carga de datos | 1.5 h |
| A9 | `feat(api): copiloto con Claude` | `lib/anthropic.ts`, system prompt con sitios resumidos, `/api/chat` | 1.5 h |
| A10 | `feat(offline): asistente por reglas` | `lib/offlineAssistant.ts` reutilizando A4 y A7 | 1.5 h |

### Track B — UI y pantallas

| # | Commit | Qué entra | Est. |
|---|---|---|---|
| B1 | `feat(ui): sistema de diseño y mascota` | Tokens en `globals.css`, Nunito + Yellowtail (`@theme inline`), `.andean-band`, `Mascot.tsx` vectorial, `Logo.tsx` | 2 h |
| B2 | `feat(ui): shell de navegación` | `layout.tsx`, `BottomNav` con FAB, `NavLink`, skip link | 1 h |
| B3 | `feat(ui): átomos de sitio` | `CrowdBadge` (con estado Cerrado), `VerificationChip`, `AccessibilityIcons`, `SiteThumbnail` | 1.5 h |
| B4 | `feat(ui): pantalla Inicio` | Hero, buscador, carrusel, accesos rápidos, consejo Wayki | 1.5 h |
| B5 | `feat(ui): mapa` | `MapView` con marcadores por aforo, encuadre automático, placeholder sin token | 1.5 h |
| B6 | `feat(ui): pantalla Ruta` **(CORE)** | Filtros, selects, cabecera verde de % accesibilidad, `RouteTimeline` | 2 h |
| B7 | `feat(ui): gráfico de aforo por hora` | `CrowdChart`: barras por umbral, "Ver tabla", etiqueta solo en la hora tranquila | 1.5 h |
| B8 | `feat(ui): Explorar y Estado del lugar` | Catálogo con filtros; `/sitio/[id]` con espera estimada y recomendación | 2 h |
| B9 | `feat(ui): copiloto` | `ChatWidget` con burbujas navy, sugerencias, aviso de modo sin conexión | 1.5 h |
| B10 | `feat(ui): itinerario y panel de datos` | Timeline de paradas; KPIs, medidores, tabla | 2 h |
| B11 | `feat(ui): perfil y reportes` | Preferencias en `localStorage`, `ReportDialog` | 1 h |
| B12 | `feat(pwa): instalable y offline` | `manifest.json`, `sw.js`, iconos desde la mascota, indicador de conexión | 1.5 h |

---

## 6.1 Track A y B — commits agregados después del MVP

Estos commits parten de que A1-A10 y B1-B12 ya están en `main` y el core
funciona de punta a punta. Igual que arriba: cada commit es autocontenido,
`npm run build` pasa al terminar cada uno.

### Track A — Datos y API (continuación)

| # | Commit | Qué entra | Depende de | Est. |
|---|---|---|---|---|
| A11 | `feat(data): fichas tecnicas por sitio` | `data/site-details.json` (1 registro por sitio: `history`, `curiosity`, `best_time`, `recommended_visit_minutes`), `lib/siteDetails.ts` (`getSiteDetail`), `GET /api/site-details?site=<id>`, `SiteDetail` en `lib/types.ts` | A2 | 45 min |
| A12 | `feat(data): historias de viajeros curadas` | `data/seed-stories.json` (4 historias con `site_id`, `author_name`, `title`, `body`, `tag`), `lib/stories.ts` (`getSeedStories`, cruza `site_name` con `getSeedSites()` — no lo dupliques en el JSON), `GET /api/stories?site=<id>`, `Story` en `lib/types.ts` | A2 | 45 min |
| A13 | `feat(data): directorio de agencias aliadas` | `data/seed-agencies.json` (agencias reales investigadas, no inventadas), `lib/agencies.ts` (`getPartnerAgencies`), `GET /api/agencies`, `PartnerAgency` en `lib/types.ts`. Cada `reviews_note` debe declarar su propia procedencia (`reviews_source: "agencia"\|"resenas"\|"premio"\|null`) — nunca una calificación sin fuente (ver CLAUDE.md §6.10) | — | 1 h |
| A14 | `feat(data): amplia categorias de servicios turisticos` | `ServiceCategory` +`movilidad`/`salud`/`actividad` en `lib/types.ts`, ~5 entradas nuevas en `data/seed-services.json`, actualizar el check constraint de `services.category` en `supabase/schema.sql` si no se hizo en Commit 0 | A5 | 1 h |

### Track B — UI y pantallas (continuación)

| # | Commit | Qué entra | Depende de | Est. |
|---|---|---|---|---|
| B13 | `feat(ui): modo oscuro` | `@custom-variant dark` + tokens `.dark` completos en `globals.css`, `components/ThemeToggle.tsx` (`applyTheme`, `useTheme`), script anti-parpadeo inline en `app/layout.tsx` + `<html suppressHydrationWarning>`, toggle en el header de escritorio y fila "Tema oscuro" en `/perfil`. Incluye auditar **todo** color hardcodeado existente (`text-sand-50` usado como texto-claro-fijo sobre botones, `text-[#8f2a1c]` sueltos, etc.) y decidir por cada uno si debe invertir con el tema o quedarse fijo (`--color-cream`/`--color-scrim`) — es la parte que más tiempo toma, no la subestimes | B2, B6, B9 | 3 h |
| B14 | `feat(ui): mascota con estados ilustrados` | Recortar las 12 poses de `material_proyecto/WaikyIA.png` a `public/mascot/*.png`, reescribir `components/Mascot.tsx` para aceptar `state: MascotState` (default `"calm"`, misma API de `size`/`className`/`title` de antes), y conectar el cambio de estado contextual en `ChatWidget.tsx` (`pickMascotState` por palabras clave + header online/offline + estado vacío + indicador de carga) | B1, B9 | 2 h |
| B15 | `feat(ui): historias de viajeros` | `app/historias/page.tsx`, teaser en `app/page.tsx`, sección de historias del sitio en `app/sitio/[id]/page.tsx`, entrada de nav | A12 | 1.5 h |
| B16 | `feat(ui): agencias aliadas` | `app/agencias/page.tsx`, entrada de nav, link contextual desde `app/itinerario/page.tsx` ("¿Prefieres un tour ya armado?") | A13 | 1.5 h |
| B17 | `feat(ui): ficha tecnica en Estado del lugar` | Sección "Conoce más" en `app/sitio/[id]/page.tsx`, después de accesibilidad/aforo, nunca antes | A11 | 45 min |
| B18 | `feat(ui): pulido de UX` | Iconos de las 3 categorías nuevas de servicios en `components/Icons.tsx` (depende de A14), botón "Reportar problema" más visible + toast de confirmación (`SiteCard.tsx`, `sitio/[id]/page.tsx`), `ReportDialog.tsx` con auto-cierre + Escape + foco al abrir, banner de "sin conexión" más sutil en `PwaProvider.tsx`, "marcar visitado" + barra de progreso en `app/itinerario/page.tsx` (reutiliza `components/Meter.tsx`) | A14, B11 | 2.5 h |

---

## 5. Puntos de sincronización

Merge de ambas ramas a `main`, `npm run build`, y probar el flujo completo.

| Momento | Estado esperado |
|---|---|
| **S1** — Día 1, 12:00 | A1–A3 · B1–B3. La app abre, se ve el arte, hay datos. |
| **S2** — Día 1, 17:00 | A4–A6 · B4–B6. **Core cerrado:** ruta accesible funcionando de punta a punta. |
| **S3** — Día 1, 19:00 | Deploy a Vercel aunque falte pulido. Valida el pipeline. |
| **S4** — Día 2, 10:00 | A7–A10 · B7–B11. Copiloto, itinerario, panel y offline. |
| **S5** — Día 2, 11:15 | B12 + ajustes. Congelar. Solo bugfixes desde aquí. |

> **Regla del congelamiento:** después de S5 no entra ninguna funcionalidad nueva
> **para el pitch del hackathon**. Si algo no está, no está.

Si vas a seguir con el bloque de §6.1 (fase 2, post-hackathon), estos son sus
puntos de sincronización — sin hora fija, porque ya no corren contra el reloj
del evento:

| Momento | Estado esperado |
|---|---|
| **S6** | A11–A14 · B13–B17 mergeados. Fichas técnicas, historias, agencias y modo oscuro funcionando de punta a punta. |
| **S7** | B18 mergeado + `npm run build` limpio en ambos temas (claro/oscuro) probado a 390 px. Congelar de nuevo. |

---

## 6. Cronograma

### Día 1 (3 ago, 8:00–19:00)

| Hora | Ambos | Persona A | Persona B |
|---|---|---|---|
| 8:00–9:00 | Diagnóstico con mentores, alcance final | | |
| 9:00–9:45 | **Commit 0 juntos** | | |
| 9:45–12:00 | | A1–A3 | B1–B3 |
| 12:00–12:30 | **S1** + almuerzo | | |
| 12:30–17:00 | | A4–A6 | B4–B6 |
| 17:00–17:30 | **S2 — core cerrado** | | |
| 17:30–19:00 | | A7 | B7 | 
| 19:00 | **S3 — deploy a Vercel** | | |

> Curar los datos reales de accesibilidad de los 6 sitios es tarea de **A** en
> paralelo, antes de mediodía. Es el insumo de todo lo demás.

### Día 2 (4 ago, 8:00–13:00)

| Hora | Ambos | Persona A | Persona B |
|---|---|---|---|
| 8:00–10:00 | | A8–A10 | B8–B11 |
| 10:00–10:30 | **S4** + mentoría técnica | | |
| 10:30–11:15 | Ensayo de pitch | | B12 |
| 11:15–11:30 | **S5 — congelar** | | |
| 11:30–12:00 | Deploy final, prueba en celular real, **video de respaldo** | | |
| 12:00–13:00 | Pitch | | |

---

## 7. Checklist previo al pitch

- [ ] Deploy final en Vercel, abierto en un **celular real**
- [ ] Video corto del demo funcionando, por si falla el wifi o la API
- [ ] Modo avión probado: la app abre, hay sitios, hay rutas, el copiloto responde
      por reglas con su aviso
- [ ] `crowd_status` con 2–3 sitios en "alto" para demostrar el anti-aforo en vivo
- [ ] Flujo completo (ruta accesible → copiloto → anti-aforo → servicios) en menos
      de 3 minutos
- [ ] Alguien sabe explicar que el aforo es simulado y cuál es el plan de datos reales

**Si el bloque de §6.1 ya está integrado, además:**

- [ ] El toggle de tema funciona y se probó cada pantalla en modo oscuro, no
      solo en claro (los bugs de contraste no salen compilando, salen mirando)
- [ ] La mascota cambia de expresión en el chat según lo que se le pregunta
      (saludo, ruta, "está lleno", agradecimiento)
- [ ] Alguien sabe explicar que las calificaciones de las agencias en `/agencias`
      son texto con procedencia declarada, no un número verificado por el equipo

---

## 8. Convención de commits

```
<tipo>(<ámbito>): <qué cambia, en imperativo>
```

Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`.
Ámbitos: `api`, `data`, `lib`, `ui`, `db`, `pwa`, `offline`.

Si tomaste una decisión de producto para no bloquearte, déjala en el cuerpo del
commit. Ejemplo:

```
feat(api): recomendador anti-aforo

Si no hay otro sitio de la misma categoría, cae al más cercano menos
congestionado. Sin ese fallback la función nunca se dispara en el demo:
cuatro de las cinco categorías tienen un solo sitio.
```
