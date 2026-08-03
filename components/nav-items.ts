import type { ComponentType } from "react";
import {
  BookOpenIcon,
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
 * Navegacion principal, la misma en la barra inferior y en el header.
 *
 * Son cuatro y se quedan en cuatro: BottomNav las parte en 2 + FAB + 2, y con
 * cinco o seis los objetivos tactiles caen por debajo del minimo comodo a
 * 390 px.
 *
 * El mockup muestra "Favoritos", pero no hay pantalla de favoritos ni backend
 * que la sostenga. En su lugar va "Guía", que agrupa lo que antes andaba suelto
 * y ya no cabia: lugares, servicios, tours, calendario, historias, pasaporte y
 * emergencias. Preferimos una entrada que lleve a algo real antes que una que
 * prometa una funcion inexistente.
 *
 * "Explorar" salio de aqui al entrar "Guía": el hub la contiene y ademas
 * Inicio ya tiene buscador y carrusel de sitios, asi que no queda huerfana.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.inicio", Icon: HomeIcon },
  { href: "/ruta", labelKey: "nav.rutas", Icon: RouteIcon },
  { href: "/guia", labelKey: "nav.guia", Icon: BookOpenIcon },
  { href: "/perfil", labelKey: "nav.perfil", Icon: UserIcon },
];
