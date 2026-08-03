/**
 * Aptitud para visitar con niños, por sitio.
 *
 * ── POR QUE ESTO VIVE EN components/ Y NO EN data/ ──
 * Es una capa TEMPORAL de la Persona B. Lo correcto es que `Site` tenga estos
 * campos y que salgan por /api/sites, pero eso obliga a tocar lib/types.ts
 * (cambio de contrato), data/seed-sites.json y supabase/schema.sql, que son de
 * la Persona A (§8). El cambio exacto que A debe aplicar esta documentado en
 * PROPUESTA-ZONA-INFANTIL.md; cuando lo haga, este archivo se borra y la UI
 * pasa a leer el campo real.
 *
 * ── POR QUE NO ES UN BOOLEANO "TIENE ZONA DE JUEGOS" ──
 * Se investigo los 6 sitios piloto y NINGUNO tiene zona de juegos infantiles:
 * son un monasterio, dos miradores, una plaza, una catedral y un museo. Los
 * parques con juegos de Arequipa (Los Ccoritos, Kataplum, Jump Spot) estan en
 * otra parte de la ciudad. Un filtro booleano devolveria cero resultados
 * siempre, lo que no informa: da a entender que la app "no encontro nada"
 * cuando en realidad la pregunta estaba mal planteada.
 *
 * Lo que si varia, y mucho, es si conviene llevar niños. Por eso el eje es la
 * aptitud, con su motivo y su fuente. Cuando no hay fuente, se dice (§2.1) —
 * nunca se rellena con una suposicion presentada como dato.
 */

export type KidsSuitability = "apto" | "con-reservas" | "sin-dato";

export interface KidsInfo {
  site_id: string;
  /** Zona de juegos dedicada. Hoy false en los 6 sitios piloto. */
  has_kids_area: boolean;
  suitability: KidsSuitability;
  note: string;
  source_label: string;
  source_url: string | null;
  /** false = sin fuente, o fuentes que se contradicen. La UI debe decirlo. */
  confirmed: boolean;
}

export const SUITABILITY_LABEL: Record<KidsSuitability, string> = {
  apto: "Apto para ir con niños",
  "con-reservas": "Con niños, con precauciones",
  "sin-dato": "Sin datos sobre ir con niños",
};

const KIDS_INFO: KidsInfo[] = [
  {
    site_id: "monasterio-de-santa-catalina",
    has_kids_area: false,
    suitability: "apto",
    note: "Los menores de 7 años no pagan entrada. El recorrido dura entre 1,5 y 2,5 horas y pasa por cocinas, lavandería y claustros, así que da para explicarles cómo se vivía hace 400 años. No hay zona de juegos.",
    source_label: "Blog de viaje en familia (visita con niños)",
    source_url:
      "https://valentinashome.com/2020/01/04/visita-al-convento-de-santa-catalina-con-ninos/",
    confirmed: true,
  },
  {
    site_id: "mirador-de-yanahuara",
    has_kids_area: false,
    suitability: "apto",
    note: "La plaza de Yanahuara tiene palmeras y sombra, y es buen sitio para que los niños descansen. La entrada es libre y está abierto todo el día. Ojo con la altura: conviene mantenerlos hidratados.",
    source_label: "Guía del Mirador de Yanahuara (Exploor Trip)",
    source_url: "https://exploortrip.com/blog/plaza-y-barrio-de-yanahuara-arequipa/",
    confirmed: true,
  },
  {
    site_id: "plaza-de-armas-de-arequipa",
    has_kids_area: false,
    suitability: "apto",
    note: "Espacio abierto con áreas verdes y árboles, cómodo para caminar con niños. No tiene juegos: los parques con juegos de Arequipa están en otro lado, como el parque Los Ccoritos en la calle John F. Kennedy.",
    source_label: "Tierra Viva — planes en Arequipa con niños",
    source_url: "https://tierravivahoteles.com/en/arequipa-7-plans-children/",
    confirmed: true,
  },
  {
    site_id: "basilica-catedral-de-arequipa",
    has_kids_area: false,
    suitability: "sin-dato",
    note: "No encontramos ninguna fuente que hable de visitarla con niños. Es un templo en uso, así que es razonable esperar silencio y un recorrido corto, pero eso es criterio nuestro y no un dato confirmado.",
    source_label: "Sin fuente encontrada",
    source_url: null,
    confirmed: false,
  },
  {
    site_id: "museo-santuarios-andinos",
    has_kids_area: false,
    suitability: "con-reservas",
    note: "Las fuentes se contradicen: una indica que el museo no admite menores de 12 años, mientras que Tierra Viva lo recomienda para ir con niños y menciona una versión del recorrido sin momias para visitantes sensibles. No pudimos confirmar cuál rige — conviene llamar antes de ir. Además, la momia Juanita solo se exhibe de mayo a diciembre.",
    source_label: "Fuentes en conflicto (Tierra Viva vs. reglamento del museo)",
    source_url: "https://tierravivahoteles.com/en/arequipa-7-plans-children/",
    confirmed: false,
  },
  {
    site_id: "mirador-de-la-cruz-del-condor",
    has_kids_area: false,
    suitability: "con-reservas",
    note: "Está entre 3.287 y 3.800 m de altura y el cañón cae unos 1.200 m. En junio de 2025 una turista cayó 400 m, y los guías de la zona denunciaron que tres miradores del Colca no tienen condiciones mínimas de seguridad ni señalización en los bordes. Con niños pequeños, no los sueltes de la mano.",
    source_label: "La República, junio 2025 — advertencia de los guías del Colca",
    source_url:
      "https://larepublica.pe/sociedad/2025/06/14/guias-turisticos-advierten-peligro-en-tres-miradores-del-colca-luego-de-que-joven-turista-cayera-400-metros-272272",
    confirmed: true,
  },
];

const BY_ID = new Map(KIDS_INFO.map((info) => [info.site_id, info]));

export function getKidsInfo(siteId: string): KidsInfo | null {
  return BY_ID.get(siteId) ?? null;
}

/**
 * Un sitio pasa el filtro "apto con niños" solo si lo confirmamos. "Sin dato"
 * no cuenta como apto: el filtro promete algo y no podemos prometer lo que no
 * verificamos.
 */
export function passesKidsFilter(siteId: string): boolean {
  const info = getKidsInfo(siteId);
  return info?.suitability === "apto" && info.confirmed;
}
