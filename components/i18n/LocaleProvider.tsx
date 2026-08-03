"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICTIONARY, type TranslationKey } from "@/components/i18n/dictionary";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from "@/components/i18n/locales";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey) => string;
  /** true hasta que se lee localStorage, para no parpadear de idioma. */
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      /* localStorage bloqueado: se queda en espanol, que es la lengua local. */
    }

    if (isLocale(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    } else {
      /* Sin eleccion previa se propone el idioma del navegador, pero solo si es
         uno de los cuatro. No se adivina mas alla de eso. */
      const browser = navigator.language?.slice(0, 2);
      if (isLocale(browser)) {
        setLocaleState(browser);
        document.documentElement.lang = browser;
      }
    }
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    /* El atributo lang del <html> no es cosmetico: de el depende que voz use un
       lector de pantalla. Si no se actualiza, el frances se lee con fonetica
       espanola. */
    document.documentElement.lang = next;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ver arriba */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => DICTIONARY[locale][key] ?? DICTIONARY[DEFAULT_LOCALE][key] ?? key,
      ready,
    }),
    [locale, setLocale, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    /* Un componente fuera del provider no deberia romper la pantalla entera:
       cae al espanol, que es el idioma base. */
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key) => DICTIONARY[DEFAULT_LOCALE][key] ?? key,
      ready: true,
    };
  }
  return ctx;
}

/** Atajo para el caso comun: solo traducir. */
export function useT() {
  return useLocale().t;
}
