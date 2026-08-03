# Réplica desde cero — Suyu

> Guía para reconstruir la app **completa** (MVP + todo lo agregado después) en
> un repositorio nuevo, con la mayor fidelidad posible al estado actual.
> El contrato técnico vive en `CLAUDE.md`. El plan de commits completo, en
> `docs/PLAN-EQUIPO.md` (§1-§6 para el MVP, §6.1 para todo lo demás). Este
> documento cubre lo que esos dos **no** cubren: qué assets copiar antes de
> empezar, los valores exactos de diseño para que se vea igual, y cómo verificar
> que quedó fiel.

---

## 1. Antes de escribir una línea de código: assets obligatorios

Copia estos archivos a la carpeta del proyecto nuevo **antes** del Commit 0. Sin
ellos no es posible una réplica fiel — son insumos de diseño, no código.

| Archivo origen | Destino en el proyecto nuevo | Por qué es obligatorio |
|---|---|---|
| `img_ref_turiston.png` (raíz del repo actual) | raíz del proyecto nuevo | **Mockup de referencia de toda la UI.** Grilla de 6 pantallas de un mismo diseño: (1) Inicio — buscador + carrusel de sitios + accesos rápidos, (2) navegación en mapa con una ruta accesible trazada entre Yanahuara y Santa Catalina, (3) chat "Suyu IA" con un itinerario de 3 horas de respuesta, (4) detalle de "Ruta accesible" (95% accesibilidad, distancia/tiempo/paradas, timeline vertical), (5) "Estado del lugar" con un sitio saturado y la alternativa recomendada, (6) perfil/preferencias en modo oscuro con la mascota. **Sin este archivo no hay forma de saber cómo debe verse cada pantalla** — es la única fuente del diseño visual, todo lo demás en este repo es interpretación de ese mockup. |
| `material_proyecto/WaikyIA.png` | misma ruta relativa en el proyecto nuevo | **Hoja de referencia de la mascota**, 500×500 px, con las 12 poses/expresiones de la alpaca con chullo que alimentan `public/mascot/*.png`. Sin este archivo hay que rehacer el arte de la mascota desde cero (ver §6 para el recorte exacto). |

**Qué NO copiar:** la carpeta `material_hackaton/` (fichas técnicas, plantilla de
pitch, PDFs de design thinking) es papelería de la inscripción al hackathon —
no aporta nada al desarrollo de la app y no debe ir en el repo nuevo.

Si además quieres arrancar con los mismos datos de demo (no obligatorio, pero
ahorra tiempo de curaduría): copia los 5 archivos de `data/*.json` del proyecto
actual tal cual — son contenido curado a mano (sitios, servicios, fichas
técnicas, historias, agencias), no algo que deba regenerarse por regenerarse.
Si prefieres datos propios, `CLAUDE.md` §6 documenta la forma exacta que debe
tener cada uno.

---

## 2. Stack y arranque

Igual que `CLAUDE.md` §3-§4. Resumen ejecutable:

```bash
npx create-next-app@15 suyu --typescript --tailwind --app --eslint --import-alias "@/*" --use-npm
cd suyu
npm install @supabase/supabase-js mapbox-gl
```

Versiones exactas que corría el proyecto original (fíjalas en `package.json` si
quieres una réplica exacta del entorno, no solo del código):

```
next            15.5.22
react           19.1.0
react-dom       19.1.0
@supabase/supabase-js  ^2.111.0
mapbox-gl              ^3.27.0
tailwindcss            ^4
typescript             ^5
eslint                 ^9
eslint-config-next     15.5.22
```

No hay `@anthropic-ai/sdk` en las dependencias — el copiloto llama la API de
Anthropic con `fetch` directo (`lib/anthropic.ts`), no la agregues a menos que
decidas cambiar ese enfoque.

`.env.local` — variables y dónde conseguirlas: `CLAUDE.md` §4.

---

## 3. Orden de ejecución

1. Commit 0 (`docs/PLAN-EQUIPO.md` §3) — scaffold conjunto, `lib/types.ts`
   completo desde el inicio (cópialo tal cual de `CLAUDE.md` §6.1, ya incluye
   `SiteDetail`/`Story`/`PartnerAgency`/las 9 categorías de servicio — no hace
   falta construir el tipo en etapas), endpoints stub, JSON semilla.
2. Track A1-A10 / B1-B12 en paralelo (`docs/PLAN-EQUIPO.md` §4) — el MVP del
   hackathon: ruta accesible, copiloto, anti-aforo, servicios, itinerario,
   panel, PWA.
3. Track A11-A14 / B13-B18 en paralelo (`docs/PLAN-EQUIPO.md` §6.1) — fichas
   técnicas, historias, agencias, modo oscuro, mascota con estados, pulido de UX.

Los puntos de sincronización (S1-S7) y qué depende de qué están detallados en
`docs/PLAN-EQUIPO.md`. No hace falta repetirlos aquí — este documento asume que
ya vas a seguir esa tabla y se enfoca en lo que le falta: assets, valores
exactos de diseño, y verificación.

---

## 4. Tokens de diseño — valores exactos

Copia esto literal en `app/globals.css` (dentro de `@theme`, `:root` y `.dark`
según corresponda) para que el resultado visual coincida al píxel/hex con el
original. La tabla completa, con ambos temas lado a lado:

| Token | Claro | Oscuro | Rol |
|---|---|---|---|
| `--color-sand-50` | `#fdfbf6` | `#1c1e29` | superficie de tarjeta |
| `--color-sand-100` | `#f8f2e7` | `#14151d` | fondo de página |
| `--color-sand-200` | `#ede3d2` | `#2c2f3f` | bordes |
| `--color-sand-300` | `#dfd2bc` | `#454a60` | bordes fuertes / ícono mudo |
| `--color-forest-900` | `#0e4a34` | *(fijo, no invierte)* | fondo del degradado "Accesibilidad %" |
| `--color-forest-700` | `#15664a` | `#3aa877` | acción primaria, accesibilidad |
| `--color-forest-600` | `#1b7a58` | `#2f9468` | acción primaria secundaria |
| `--color-forest-100` | `#cfe4d8` | `#1c3d27` | chip claro (fondo) |
| `--color-forest-50` | `#e7f1ea` | `#16311f` | chip claro (fondo, más suave) |
| `--color-clay-700` | `#a8401f` | `#e8815a` | texto/borde de marca oscuro |
| `--color-clay-600` | `#c9502a` | `#dd6b42` | marca, acento, estado activo |
| `--color-clay-500` | `#dd5b2c` | *(no se usa en oscuro)* | variante de marca |
| `--color-clay-100` | `#f6ddd1` | `#4a2a1e` | chip de marca (fondo) |
| `--color-clay-50` | `#fbede6` | `#3a2015` | chip de marca (fondo, más suave) |
| `--color-night-900` | `#1c1f3d` | *(fijo)* | superficie del copiloto, oscura en ambos temas |
| `--color-night-800` | `#262a4f` | *(fijo)* | superficie del copiloto |
| `--color-night-700` | `#343a66` | *(fijo)* | superficie del copiloto (hover) |
| `--color-ink` | `#2e2a25` | `#f2ede4` | texto principal |
| `--color-ink-soft` | `#5c554b` | `#c7c2b6` | texto secundario |
| `--color-ink-muted` | `#938a7c` | `#8b8779` | texto terciario / placeholder |
| `--crowd-bajo` | `#15803d` | `#34d399` | aforo bajo |
| `--crowd-medio` | `#e5a50a` | `#fbbf24` | aforo medio |
| `--crowd-alto` | `#d6412f` | `#f87171` | aforo alto |
| `--crowd-sin-datos` | `#a99e8c` | `#75705f` | sin datos de aforo |
| `--viz-grid` | `#ece3d4` | `#2a2d3b` | líneas de grilla del gráfico de aforo |
| `--viz-axis` | `#d8cbb6` | `#3a3e50` | eje del gráfico |
| `--viz-ink-muted` | `#938a7c` | `#8b8779` | etiquetas del gráfico |
| `--brand` | `#c9502a` | `#e2734c` | outline de foco (`:focus-visible`) |
| `--color-danger-text` | `#8f2a1c` | `#f5a98d` | texto de error/alerta |
| `--color-amber-text` | `#7a5800` | `#f3cf7a` | texto de aviso ámbar |
| `--color-amber-chip-bg` | `#fbf1d8` | `#3d3210` | fondo del chip "aforo medio" |
| `--color-museo-text` | `#262a4f` | `#c7c9e6` | texto sobre el thumbnail de categoría "museo" |
| `--color-route-legend` | `#15664a` | `#3aa877` | color de la leyenda "Tu ruta" en el mapa |
| `--color-cream` | `#fdfbf6` | *(fijo, nunca invierte)* | texto claro sobre botones/burbujas de color |
| `--color-scrim` | `#241f1a` | *(fijo, nunca invierte)* | fondo de modales y alertas |
| `--color-forest-banner-from` | `#15664a` | *(fijo)* | inicio del degradado "Accesibilidad %" |
| `--color-forest-banner-to` | `#0e4a34` | *(fijo)* | fin del degradado "Accesibilidad %" |

**Por qué algunos tokens son "fijos" y otros invierten:** ver `CLAUDE.md` §7.6.
Resumen: si el token se usa como texto/fondo de un elemento que YA tiene su
propio color de marca fijo (un botón verde, una burbuja de chat navy), no debe
invertir o pierde contraste — solo invierten los tokens de superficie neutra
(fondo de página, tarjetas, texto principal).

**Tipografía:** Nunito (`--font-nunito`, cuerpo) + Yellowtail (`--font-yellowtail`,
wordmark "Suyu"), ambas vía `next/font/google`. Van en un bloque `@theme inline`
separado, no en `@theme` — ver la nota de `CLAUDE.md` §7.2 sobre por qué.

**Habilitar el toggle manual de tema:** agrega `@custom-variant dark
(&:where(.dark, .dark *));` antes que nada más en `globals.css` — sin esto
`dark:` solo reacciona a `prefers-color-scheme`, no al toggle.

---

## 5. Mapeo mockup → pantalla

Para que la implementación coincida con `img_ref_turiston.png` panel por panel:

| Panel del mockup | Ruta | Componente principal |
|---|---|---|
| 1 — Inicio (buscador + carrusel + accesos rápidos) | `/` | `app/page.tsx` |
| 2 — Navegación en mapa con ruta trazada | `/ruta` | `components/MapView.tsx` |
| 3 — Chat "Suyu IA" con itinerario de respuesta | `/chat` | `components/ChatWidget.tsx` |
| 4 — Detalle "Ruta accesible" (% accesibilidad, timeline) | `/ruta` (resultado) | `components/RouteTimeline.tsx` |
| 5 — "Estado del lugar" con alternativa por aforo | `/sitio/[id]` | `app/sitio/[id]/page.tsx` |
| 6 — Perfil/preferencias en modo oscuro con mascota | `/perfil` | `app/perfil/page.tsx` |

El panel 6 confirma que el mockup **ya contemplaba modo oscuro** desde el
diseño original, aunque se construyó después (§6.1 de `PLAN-EQUIPO.md`) — no es
una desviación del diseño, es una feature que estaba en el mockup desde el
principio y se implementó más tarde.

---

## 6. Mascota: recorte exacto de `WaikyIA.png`

La hoja `material_proyecto/WaikyIA.png` (500×500 px) no es una grilla uniforme
— los recuadros tienen distintos anchos y hay márgenes irregulares entre filas.
Estas son las cajas de recorte verificadas (con ~8 px de margen, sin
solaparse con las poses vecinas), listas para pegarse centradas en un lienzo
transparente de 170×170 px por estado:

| Estado (`MascotState`) | Caja de recorte `(x0, y0, x1, y1)` | Pose |
|---|---|---|
| `wave` | `(21, 2, 134, 151)` | saludando con una pata |
| `smile` | `(147, 2, 238, 151)` | sonrisa de 3/4 |
| `look` | `(272, 2, 363, 151)` | perfil mirando a un lado |
| `back` | `(381, 2, 471, 151)` | de espaldas |
| `laugh` | `(21, 152, 115, 290)` | riendo, boca abierta |
| `calm` | `(132, 152, 226, 290)` | tranquila, ojos cerrados (default) |
| `cheer` | `(253, 152, 357, 290)` | contenta, líneas de movimiento |
| `confused` | `(377, 152, 482, 290)` | confundida, signo de interrogación |
| `search` | `(12, 291, 117, 426)` | con lupa |
| `map` | `(127, 291, 242, 426)` | con un mapa y pin |
| `chat` | `(258, 291, 362, 426)` | guiño, con teléfono |
| `cool` | `(380, 291, 481, 426)` | lentes de sol |

Script de referencia (Python + Pillow) para reproducir el recorte exacto:

```python
from PIL import Image

im = Image.open("material_proyecto/WaikyIA.png").convert("RGBA")
CANVAS = 170
BOXES = {
    "wave": (21, 2, 134, 151), "smile": (147, 2, 238, 151),
    "look": (272, 2, 363, 151), "back": (381, 2, 471, 151),
    "laugh": (21, 152, 115, 290), "calm": (132, 152, 226, 290),
    "cheer": (253, 152, 357, 290), "confused": (377, 152, 482, 290),
    "search": (12, 291, 117, 426), "map": (127, 291, 242, 426),
    "chat": (258, 291, 362, 426), "cool": (380, 291, 481, 426),
}
for name, box in BOXES.items():
    crop = im.crop(box)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(crop, ((CANVAS - crop.width) // 2, (CANVAS - crop.height) // 2), crop)
    canvas.save(f"public/mascot/{name}.png")
```

Guarda cada resultado en `public/mascot/<estado>.png` — son los archivos que
consume `components/Mascot.tsx`.

---

## 7. Checklist de fidelidad por pantalla

Verifica cada uno mirando la app a 390 px de ancho (móvil) **en los dos temas**,
no solo compilando:

- [ ] **Inicio (`/`)** — hero con buscador superpuesto, banda andina decorativa
      visible, carrusel de sitios horizontal en móvil / grilla en escritorio,
      4 accesos rápidos, teaser de historias, consejo de la mascota (`wave`).
- [ ] **Ruta (`/ruta`)** — buscador con selects de origen/destino, mapa con
      marcadores coloreados por aforo (o placeholder "mapa no disponible" sin
      token de Mapbox), cabecera verde con % de accesibilidad tras buscar,
      timeline vertical, leyenda del mapa con 4 colores.
- [ ] **Explorar (`/explorar`)** — filtros + orden, grilla de `SiteCard` con
      miniatura, badge de aforo, checklist de accesibilidad.
- [ ] **Sitio (`/sitio/[id]`)** — estado del lugar, recomendación anti-aforo
      (mascota en `map`), sección "Conoce más" (ficha técnica), historias del
      sitio, servicios cercanos, botón de reporte visible (no un link chico).
- [ ] **Itinerario (`/itinerario`)** — resumen del plan con degradado verde
      fijo, barra de progreso de visitados, checkbox "marcar visitado" por
      parada, link a "Agencias".
- [ ] **Chat (`/chat`)** — burbujas navy (usuario) vs. claras (asistente), cada
      respuesta con su mascota chica al costado (el estado cambia según la
      pregunta), aviso de "modo sin conexión" cuando aplica.
- [ ] **Historias (`/historias`)** — lista de tarjetas con tag, sitio, autor.
- [ ] **Agencias (`/agencias`)** — cada tarjeta muestra la procedencia de su
      `reviews_note` explícitamente, nunca una estrella o número sin fuente.
- [ ] **Panel (`/panel`)** — KPIs, gráfico de aforo agregado, tabla de
      cobertura de accesibilidad, feed de reportes.
- [ ] **Perfil (`/perfil`)** — cabecera navy con mascota (`wave`), preferencias,
      toggle de tema, fila de idioma, link al panel.
- [ ] **Modo oscuro** — activa el toggle en cada una de las pantallas de
      arriba: ningún texto debe quedar oscuro-sobre-oscuro ni claro-sobre-claro
      (el error más común es reusar un token de superficie donde hacía falta
      uno fijo — ver §4).

---

## 8. Qué queda fuera de esta réplica (a propósito)

- Backend real de historias de usuario (con moderación) — roadmap documentado
  en `CLAUDE.md` §6.9, no construido.
- Tablas de Supabase para `site_details`, `stories`, `agencies` — siguen siendo
  JSON estático por diseño (§6.2/§6.8-6.10 de `CLAUDE.md`), no un olvido.
- Estilo oscuro del mapa de Mapbox (`dark-v11`) — el mapa mantiene el mismo
  estilo en ambos temas; cambiarlo requiere re-agregar la capa de ruta tras el
  cambio de estilo y quedó fuera de alcance.
- Integración de `getSupabaseAdmin()` (cliente con service role) — existe en
  `lib/supabase.ts` pero ningún endpoint lo usa todavía.
