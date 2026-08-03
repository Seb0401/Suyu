import type { ComponentType } from "react";
import {
  BookIcon,
  BriefcaseIcon,
  CompassIcon,
  HomeIcon,
  RouteIcon,
  UserIcon,
  type IconProps,
} from "@/components/Icons";
import type { TranslationKey } from "@/components/i18n/dictionary";

export type NavItem = {
  href: string;
  /** Clave del diccionario, no el texto: la barra tambien se traduce. */
  labelKey: TranslationKey;
  Icon: ComponentType<IconProps>;
};

/**
 * El mockup muestra "Favoritos" en la barra inferior, pero no hay pantalla de
 * favoritos construida ni backend que la sostenga. En su lugar va "Explorar",
 * que si existe: preferimos una entrada que lleve a algo real antes que una
 * que prometa una funcion inexistente.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.inicio", Icon: HomeIcon },
  { href: "/ruta", labelKey: "nav.rutas", Icon: RouteIcon },
  { href: "/explorar", labelKey: "nav.explorar", Icon: CompassIcon },
  { href: "/perfil", labelKey: "nav.perfil", Icon: UserIcon },
];

/**
 * Secciones de contenido. Van en el header de escritorio y como accesos desde
 * el Inicio, pero NO en la barra inferior: BottomNav parte NAV_ITEMS en
 * 2 + FAB + 2, y con cinco o seis entradas los objetivos tactiles caen por
 * debajo del minimo comodo a 390 px.
 *
 * En movil cada una se alcanza por enlace contextual, en el punto donde tiene
 * sentido: /agencias desde el itinerario, justo despues de ver un plan armado y
 * poder querer compararlo con un tour existente.
 */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/historias", labelKey: "nav.historias", Icon: BookIcon },
  { href: "/agencias", labelKey: "nav.agencias", Icon: BriefcaseIcon },
];
