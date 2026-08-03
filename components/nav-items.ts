import type { ComponentType } from "react";
import {
  BookIcon,
  CompassIcon,
  HomeIcon,
  RouteIcon,
  UserIcon,
  type IconProps,
} from "@/components/Icons";

export type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

/**
 * El mockup muestra "Favoritos" en la barra inferior, pero no hay pantalla de
 * favoritos construida ni backend que la sostenga. En su lugar va "Explorar",
 * que si existe: preferimos una entrada que lleve a algo real antes que una
 * que prometa una funcion inexistente.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/ruta", label: "Rutas", Icon: RouteIcon },
  { href: "/explorar", label: "Explorar", Icon: CompassIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
];

/**
 * Secciones de contenido. Van en el header de escritorio y como accesos desde
 * el Inicio, pero NO en la barra inferior: con el FAB al centro, cinco o seis
 * entradas dejan objetivos tactiles por debajo del minimo comodo en 390 px.
 */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/historias", label: "Historias", Icon: BookIcon },
];
