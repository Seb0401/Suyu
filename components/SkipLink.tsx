"use client";

import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Existe como componente propio solo porque el layout es un Server Component y
 * el texto del enlace tiene que traducirse.
 */
export default function SkipLink() {
  const t = useT();
  return (
    <a href="#contenido" className="skip-link">
      {t("nav.saltar")}
    </a>
  );
}
