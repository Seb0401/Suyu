# Suyu — compañero de viaje inteligente para Arequipa

App web (PWA) construida para **TURISTON: Hackathon de Innovación Turística**
(Arequipa, 3–4 de agosto de 2026).

> *Suyu* significa "región, territorio" en quechua — la raíz de *Tawantinsuyu*,
> las cuatro regiones del imperio inca. El territorio que la app te ayuda a
> recorrer.

Suyu arma **rutas accesibles** hacia los atractivos de Arequipa (rampas, baños,
pendientes, descansos), avisa cuándo un sitio está saturado y propone
alternativas, y responde en lenguaje natural con un copiloto conversacional.

---

## El problema

La información sobre accesibilidad real de los atractivos de Arequipa (Santa
Catalina, Yanahuara, Plaza de Armas, Colca) es escasa y dispersa. Tampoco hay
forma de saber si un sitio está congestionado antes de llegar. Eso golpea sobre
todo a viajeros con movilidad reducida, familias, adultos mayores y a quien
tiene el día contado.

## Qué hace

| Funcionalidad | Estado |
|---|---|
| **Ruta accesible + mapa** (core) | ✅ |
| Copiloto conversacional con Claude (+ motor de reglas offline) | ✅ |
| Recomendador anti-aforo | ✅ |
| Servicios turísticos formalizados (9 categorías) | ✅ |
| Itinerario del día (planificador) + progreso de visita | ✅ |
| Fichas técnicas por sitio ("Conoce más") | ✅ |
| Historias de viajeros (blog curado) | ✅ |
| Directorio de agencias de turismo aliadas | ✅ |
| Modo oscuro persistente | ✅ |
| Mascota ilustrada con 12 estados contextuales | ✅ |
| PWA instalable + service worker | ✅ |

## Los tres principios que mandan

1. **Offline-first.** La app funciona completa sin red y sin ninguna API key.
   Todo lo esencial vive en JSON local; la conexión *mejora* la experiencia,
   nunca es requisito.
2. **Honestidad del dato.** Nunca se simula salida de IA ni se muestra como
   verificado algo que no lo está. Sin `ANTHROPIC_API_KEY` el copiloto responde
   por reglas y lo dice en pantalla.
3. **El color nunca carga el significado solo.** Todo nivel de aforo va con
   texto, altura de barra o vista de tabla — la app trata sobre accesibilidad.

## Stack

Next.js 15.5 (App Router, TypeScript) · React 19 · Tailwind CSS v4 ·
Mapbox GL JS · Supabase (Postgres) · API de Anthropic (`claude-sonnet-5`, vía
`fetch` directo, sin SDK) · deploy en Vercel.

---

## Arranque

```bash
npm install
cp .env.local.example .env.local   # opcional: la app corre sin llaves
npm run dev                        # http://localhost:3000
```

Comandos: `npm run dev` · `npm run build` · `npm run start` · `npm run lint`.

Variables de entorno (todas opcionales para desarrollo):

```bash
ANTHROPIC_API_KEY=sk-ant-...          # copiloto con IA real
NEXT_PUBLIC_MAPBOX_TOKEN=pk....       # mapa y ruta peatonal real
NEXT_PUBLIC_SUPABASE_URL=...          # datos editables en vivo
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Sin ellas la app levanta igual: datos semilla, ruta aproximada por haversine,
aviso de "mapa no disponible" y copiloto por reglas.

---

## Equipo — quién hace qué

Somos **2 personas** y el reparto es **por capa**, no por funcionalidad. Esto es
lo que permite trabajar en paralelo sin bloquearse.

| | **Persona A — Datos y API** | **Persona B — UI y pantallas** |
|---|---|---|
| **Posee** | `lib/`, `app/api/`, `supabase/`, `data/` | `components/`, `app/**/page.tsx`, `app/layout.tsx`, `app/globals.css`, `public/` |
| **No toca** | `components/`, `app/**/page.tsx` | `lib/`, `app/api/` |
| **Verifica con** | `curl` a los endpoints | navegador a 390 px, en tema claro y oscuro |
| **Rama** | `track/a-datos` | `track/b-ui` |

**Persona A** construye la lógica: perfiles de aforo por hora, recomendador
anti-aforo, cálculo de ruta accesible con fallback sin Mapbox, planificador de
itinerario, reportes, integración con Supabase y con la API de Claude, y la
curaduría de los datos de accesibilidad de los sitios piloto.

**Persona B** construye lo que se ve: sistema de diseño y mascota, shell de
navegación, pantalla de Ruta (el core), gráfico de aforo, Explorar y Estado del
lugar, copiloto, itinerario, panel de datos, perfil, modo oscuro y la PWA.

**El mecanismo antibloqueo:** en el commit conjunto inicial se crean
`lib/types.ts`, los JSON semilla y los **endpoints stub** que ya devuelven la
forma final de cada respuesta. Desde el minuto 1, B programa contra endpoints
que ya responden datos válidos y A valida con `curl` sin necesitar la UI. A va
reemplazando el interior de cada endpoint (seed → Supabase) **sin cambiar la
forma de la respuesta**.

**Archivos compartidos** (avisar antes de tocar): `lib/types.ts`,
`package.json`, `CLAUDE.md`. Nadie commitea en la rama del otro; los merges a
`main` ocurren solo en los puntos de sincronización.

### Convención de commits

```
<tipo>(<ámbito>): <qué cambia, en imperativo>
```

Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`.
Ámbitos: `api`, `data`, `lib`, `ui`, `db`, `pwa`, `offline`.

---

## Documentación

| Archivo | Qué contiene |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Contrato técnico: arquitectura, tipos, reglas de negocio, sistema de diseño |
| [`plan_proyecto_suyu_turiston.md`](plan_proyecto_suyu_turiston.md) | Plan de producto y pitch: problema, público, encaje con el modelo DTI |
| [`PLAN-EQUIPO.md`](PLAN-EQUIPO.md) | Reparto de trabajo y plan de commits completo (A1–A14 / B1–B18) |
| [`PROYECTO-DESDE-CERO.md`](PROYECTO-DESDE-CERO.md) | Guía para reconstruir la app entera: assets, tokens exactos, checklist de fidelidad |

---

## Nota sobre los datos

Los datos de accesibilidad de los 6 sitios piloto están curados a mano por el
equipo. El aforo es un perfil horario simulado para el demo, no medición real —
y así se declara en el pitch y en la app. El plan post-hackathon es pasar a
crowdsourcing verificado y alianzas con los sitios para aforo real.
