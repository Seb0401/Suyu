"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/Icons";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "suyu:theme";

/**
 * Script que corre en <head> ANTES de que React hidrate, para que la pagina no
 * parpadee en claro y salte a oscuro. Por eso el <html> lleva
 * suppressHydrationWarning: el HTML del servidor y el del cliente difieren en
 * esa clase por diseño (§7.6).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* En modo privado localStorage puede fallar. El tema igual se aplica en
       esta sesion; solo no se recuerda. */
  }
}

/** Lee la clase que ya puso THEME_INIT_SCRIPT en vez de recalcular el tema. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return { theme, toggle };
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-sand-200 bg-sand-50 text-ink-soft ${className}`}
    >
      {dark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
    </button>
  );
}
