/**
 * Idiomas de la app.
 *
 * Espanol es la lengua local. Los tres extranjeros salen de quien llega a
 * Arequipa: Estados Unidos es el principal emisor y el ingles es ademas la
 * lengua franca de europeos y asiaticos; el frances es el idioma que la propia
 * ciudad ya atiende (el Monasterio de Santa Catalina ofrece visitas guiadas en
 * espanol, ingles y frances, y los operadores del Colca tienen guias
 * francofonos); el portugues cubre a Brasil, quinto mercado emisor del Peru en
 * 2025 con 222.186 visitantes.
 */

export const LOCALES = ["es", "en", "fr", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_STORAGE_KEY = "suyu:locale";

export const LOCALE_NAME: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  pt: "Português",
};

/** Nombre del idioma en espanol, para textos que hablan DEL idioma. */
export const LOCALE_NAME_ES: Record<Locale, string> = {
  es: "español",
  en: "inglés",
  fr: "francés",
  pt: "portugués",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Script que corre antes de hidratar, igual que el del tema: fija el atributo
 * lang del <html> para que los lectores de pantalla elijan la voz correcta
 * desde el primer render, no despues.
 */
export const LOCALE_INIT_SCRIPT = `(function(){try{var l=localStorage.getItem("${LOCALE_STORAGE_KEY}");if(l&&["es","en","fr","pt"].indexOf(l)>=0){document.documentElement.lang=l;}}catch(e){}})();`;
