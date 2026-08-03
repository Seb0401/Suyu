# Propuesta: aptitud para visitar con niños

> **Estado: PROPUESTA. Nada de esto está aplicado todavía.**
> Escrito por Persona B en la rama `feat/onboarding-y-login`.
> Requiere que Persona A lo aplique, porque toca `lib/types.ts`,
> `data/seed-sites.json` y `supabase/schema.sql` (§8 de CLAUDE.md).
> **Cambiar `lib/types.ts` es cambio de contrato: avisar al equipo antes de commitear.**

---

## 1. Por qué no es un booleano "tiene zona de juegos"

El pedido original fue "un filtro en el cual se vea si tiene una zona para niños".
Se investigaron los 6 sitios piloto y **ninguno tiene zona de juegos infantiles**:
son un monasterio, dos miradores, una plaza, una catedral y un museo. Los parques
con juegos de Arequipa (Los Ccoritos, Kataplum AQP, Jump Spot Kids en Mallplaza)
están en otras zonas de la ciudad y no son atractivos turísticos del dataset.

Un booleano `has_kids_area` sería `false` en los 6 y el filtro devolvería **cero
resultados siempre**. Eso no informa: el usuario entiende "la app no encontró
nada" cuando en realidad la pregunta estaba mal planteada.

Lo que sí varía —y bastante— es **si conviene llevar niños**, y ahí hay
diferencias reales: desde un mirador con caídas de 1.200 m sin señalización hasta
un monasterio donde los menores de 7 años no pagan.

Por eso la propuesta tiene **dos campos**: se conserva `has_kids_area` (para
cuando entren al dataset lugares que sí tengan juegos) y se agrega
`kids_suitability`, que es el que realmente compara hoy.

---

## 2. Cambio en `lib/types.ts`

```ts
export type KidsSuitability = "apto" | "con-reservas" | "sin-dato";

export interface Site {
  // …campos actuales…

  /** Zona de juegos infantiles dedicada. Hoy false en los 6 sitios piloto. */
  has_kids_area: boolean;
  /** Si conviene llevar niños. "sin-dato" NO es lo mismo que "apto". */
  kids_suitability: KidsSuitability;
  /** Motivo concreto, en lenguaje de usuario. Se muestra tal cual. */
  kids_note: string;
  /** Procedencia del dato. null = no encontramos fuente. */
  kids_source_url: string | null;
  kids_source_label: string;
  /** false = sin fuente o fuentes en conflicto. La UI está obligada a decirlo. */
  kids_confirmed: boolean;
}
```

`kids_confirmed` sigue el mismo patrón que `verified_by` y que `reviews_source`
de las agencias (§2.1, §6.10): el dato viaja con su procedencia y la UI nunca
muestra una afirmación que no pueda atribuir.

---

## 3. Cambio en `supabase/schema.sql`

```sql
alter table public.sites
  add column if not exists has_kids_area      boolean not null default false,
  add column if not exists kids_suitability   text    not null default 'sin-dato',
  add column if not exists kids_note          text    not null default '',
  add column if not exists kids_source_url    text,
  add column if not exists kids_source_label  text    not null default 'Sin fuente encontrada',
  add column if not exists kids_confirmed     boolean not null default false;

alter table public.sites
  add constraint sites_kids_suitability_check
  check (kids_suitability in ('apto', 'con-reservas', 'sin-dato'));
```

El default `'sin-dato'` + `kids_confirmed false` es deliberado: un sitio nuevo
entra declarando que no sabemos, no que es apto.

---

## 4. Datos investigados para `data/seed-sites.json`

Todos con `has_kids_area: false`.

| `site_id` | `kids_suitability` | `kids_confirmed` | Motivo resumido | Fuente |
|---|---|---|---|---|
| `monasterio-de-santa-catalina` | `apto` | `true` | Menores de 7 no pagan; recorrido de 1,5–2,5 h por cocinas, lavandería y claustros | [Blog de viaje en familia](https://valentinashome.com/2020/01/04/visita-al-convento-de-santa-catalina-con-ninos/) |
| `mirador-de-yanahuara` | `apto` | `true` | Plaza con palmeras y sombra, buena para descansar; entrada libre. Cuidar hidratación por la altura | [Exploor Trip](https://exploortrip.com/blog/plaza-y-barrio-de-yanahuara-arequipa/) |
| `plaza-de-armas-de-arequipa` | `apto` | `true` | Espacio abierto con áreas verdes; los juegos están en Los Ccoritos, no aquí | [Tierra Viva](https://tierravivahoteles.com/en/arequipa-7-plans-children/) |
| `basilica-catedral-de-arequipa` | `sin-dato` | `false` | No se encontró fuente sobre visitarla con niños | — |
| `museo-santuarios-andinos` | `con-reservas` | `false` | **Fuentes en conflicto:** una dice que no admiten menores de 12; Tierra Viva lo recomienda y menciona un recorrido sin momias. Juanita solo se exhibe de mayo a diciembre | [Tierra Viva](https://tierravivahoteles.com/en/arequipa-7-plans-children/) |
| `mirador-de-la-cruz-del-condor` | `con-reservas` | `true` | 3.287–3.800 m, caída de ~1.200 m. Junio 2025: una turista cayó 400 m y los guías denunciaron falta de condiciones mínimas de seguridad en tres miradores del Colca | [La República, 14/06/2025](https://larepublica.pe/sociedad/2025/06/14/guias-turisticos-advierten-peligro-en-tres-miradores-del-colca-luego-de-que-joven-turista-cayera-400-metros-272272) |

Los textos completos de `kids_note`, listos para copiar, están en
`components/kidsInfo.ts`.

**Dos casos que NO deben "limpiarse" al pasarlos al JSON:**

1. **Museo Santuarios Andinos.** La tentación es elegir una de las dos versiones
   y dejarla como verdad. No: `kids_confirmed: false` y la nota debe seguir
   diciendo que las fuentes se contradicen. Un padre que llega con un niño de 8
   años y se encuentra la puerta cerrada por culpa de que redondeamos el dato
   tiene un problema real.
2. **Basílica Catedral.** Es razonable suponer que un templo en uso pide silencio,
   pero suponer no es verificar. Va como `sin-dato`.

---

## 5. Qué hace B mientras tanto

`components/kidsInfo.ts` tiene exactamente estos datos como capa temporal de la
UI, y `/explorar` ya filtra con ellos. **Cuando A aplique este cambio:**

1. Borrar `components/kidsInfo.ts`.
2. Reemplazar `getKidsInfo(site.id)` por los campos de `site` en
   `app/explorar/page.tsx` y `app/sitio/[id]/page.tsx`.
3. `passesKidsFilter()` pasa a ser
   `site.kids_suitability === "apto" && site.kids_confirmed`.

El filtro exige `confirmed`: `sin-dato` **no** cuenta como apto. Un filtro promete
algo, y no podemos prometer lo que no verificamos.

---

## 6. Riesgo conocido

Estos datos salen de blogs de viaje y prensa, no de las webs oficiales de cada
sitio ni de una verificación en terreno. Son suficientes para orientar y todos
declaran su fuente, pero **ninguno reemplaza llamar al lugar antes de ir con
niños**, y la UI lo dice en los casos sin confirmar. Si el equipo consigue
confirmación oficial, actualizar `kids_source_label` y poner
`kids_confirmed: true`.
