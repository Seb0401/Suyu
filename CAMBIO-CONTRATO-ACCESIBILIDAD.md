# Cambio de contrato: estado 1-3, baño familiar y mascotas

> Rama `feat/onboarding-y-login`. **Aplicado**, no propuesto.
> **Toca `lib/types.ts`, o sea que es cambio de contrato (§8): avisar a Persona A
> y al otro desarrollador antes de mergear a `main`.**
> Este documento existe para que esa conversación no empiece de cero.

---

## 1. Qué cambió y por qué

### 1.1 La escala 1-3 no reemplaza los booleanos, convive con ellos

`Site.has_accessible_bathroom` sigue significando **si el rasgo existe**. La
escala nueva dice **cómo está**. Son preguntas distintas y la diferencia no es
teórica:

> **Museo Santuarios Andinos** declara baño adaptado (`has_accessible_bathroom: true`).
> Su ficha en TUR4all dice que la puerta mide **menos de 78 cm**, no hay espacio
> de giro de 150 cm, no hay barras de apoyo y el espacio para transferirse es
> insuficiente. Existe y no sirve.

Con solo el booleano, un usuario de silla de ruedas llega creyendo que puede
usarlo. Ese es el caso que motivó todo este cambio.

| Escala | Significado |
|---|---|
| `1` | Deficiente |
| `2` | Utilizable con apoyo |
| `3` | En buen estado |
| `null` | Sin dato — **nunca se asume un 2** |

### 1.2 Baño familiar ≠ baño adaptado

Son servicios distintos, con iconos distintos y campos distintos. Mezclarlos
haría que un padre con un bebé y un usuario de silla de ruedas lean la misma
etiqueta esperando cosas diferentes.

### 1.3 Mascotas ≠ perro guía

`pet_policy` es una **cortesía del sitio** y varía. El perro guía es un
**derecho**: la [Ley 29830](https://busquedas.elperuano.pe/normaslegales/ley-que-promueve-y-regula-el-uso-de-perros-guia-por-personas-ley-n-29830-738396-2),
modificada por la Ley 30433, garantiza el acceso libre a lugares públicos y
privados de uso público, sin pago adicional y sin límite de permanencia. La
única excepción son las áreas exclusivas de atención de salud.

Por eso el perro guía **no se modela como un campo por sitio**: se muestra como
un aviso constante. Si un sitio dijera "no se admiten mascotas", eso no alcanza
al perro guía, y tratarlos igual desinformaría justo a quien depende de él.

---

## 2. Archivos tocados

| Capa | Archivo | Cambio |
|---|---|---|
| **A** | `lib/types.ts` | **Contrato.** `AccessibilityRating`, `AccessibilityGrade`, `PetPolicy`, `SiteAccessibilityDetail` |
| **A** | `data/site-accessibility.json` | **Nuevo.** 6 fichas con nota y fuente |
| **A** | `lib/accessibility.ts` | **Nuevo.** Lectura, etiquetas, aviso de perro guía |
| **A** | `app/api/accessibility/route.ts` | **Nuevo.** `GET /api/accessibility[?site=]` |
| **A** | `supabase/schema.sql` | Tabla `site_accessibility` + RLS de lectura pública |
| **A** | `lib/anthropic.ts` | Regla de estilo + el rasgo peor calificado en el resumen |
| **A** | `lib/offlineAssistant.ts` | Cadenas reescritas con acentos correctos |
| **B** | `components/AccessibilityDetail.tsx` | **Nuevo.** Sección "Estado de los servicios" |
| **B** | `components/RatingBar.tsx` | **Nuevo.** Barra de 3 bloques + etiqueta |
| **B** | `components/AccessibilityIcons.tsx` | `FamilyBathroomIcon`, `PetIcon`, `GuideDogIcon` |
| **B** | `app/sitio/[id]/page.tsx` | Monta la sección tras la checklist booleana |
| **B** | `app/explorar/page.tsx` | Filtros de baño familiar y mascotas |

**Endpoint nuevo en vez de ampliar `/api/sites`.** Agregar campos a esa
respuesta obligaría a revisar todo lo que ya la consume. Así no rompe nada.

---

## 3. Cobertura real de los datos

Investigado desde las fichas públicas de TUR4all. **Cuatro de los seis sitios
tienen ficha**; Santa Catalina no tiene y la de Plaza de Armas está pendiente de
publicación.

| Sitio | Rampas | Baño adaptado | Descanso | Circulación |
|---|:--:|:--:|:--:|:--:|
| Mirador de Yanahuara | 3 | 3 | 1 | 2 |
| Museo Santuarios Andinos | 2 | 1 | 1 | 2 |
| Cruz del Cóndor | 1 | 1 | 2 | 2 |
| Basílica Catedral | 2 | — | 2 | 2 |
| Monasterio de Santa Catalina | 1 | — | — | 1 |
| Plaza de Armas | — | — | 2 | 2 |

### Lo que NO se pudo confirmar

- **Baño familiar / cambiador: 0 de 6.** Ninguna de las 4 fichas de TUR4all lo
  registra. Los seis quedan en `null`.
- **Política de mascotas: 0 de 6.** No se encontró la política de ningún sitio.
  Los seis quedan en `"sin-dato"`.

Por eso los dos filtros de `/explorar` **se renderizan deshabilitados** mientras
el conteo de sitios con dato confirmado sea 0, con su explicación al lado.
Dejarlos activables devolvería una lista vacía, que se lee como un fallo de la
app y no como una falta de información nuestra. En cuanto alguien cargue un
dato real, se habilitan solos — el conteo se calcula, no está hardcodeado.

---

## 4. Tono del asistente

Antes los dos modos hablaban distinto: Claude respondía con acentos correctos y
el motor de reglas sin ellos. Ahora ambos usan **español neutro y llano, con
ortografía correcta, sin jerga ni modismos regionales**.

- `lib/anthropic.ts`: regla `1b` en el system prompt.
- `lib/offlineAssistant.ts`: cadenas reescritas (`"Ojo:"` → `"Ten en cuenta que"`,
  `"te armo el día"` → `"preparo el día"`, acentos en todas).

Se descartó quitar los acentos por completo: es español no estándar y los
lectores de pantalla pronuncian peor (*publico* vs *público*), lo que chocaría
con la tesis de accesibilidad del proyecto.

---

## 5. Qué revisar antes de mergear

- [ ] **A confirma el cambio en `lib/types.ts`.** Es aditivo y no rompe nada
      existente, pero es contrato.
- [ ] Decidir si `site_accessibility` se carga a Supabase o se queda como JSON
      curado. Hoy funciona solo con el JSON.
- [ ] Revisar las 6 fichas: las notas se redactaron a partir de TUR4all, pero
      **nadie del equipo verificó en terreno**. Si alguien va, actualizar
      `source_label` y las notas.
- [ ] Conseguir la política de mascotas y la existencia de cambiador llamando a
      cada sitio. Es la única forma de habilitar esos dos filtros.
- [ ] Revisar la sección nueva en modo oscuro a 390 px.
