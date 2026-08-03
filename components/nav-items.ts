import type { ComponentType } from "react";
import {
  BookIcon,
  BriefcaseIcon,
  CompassIcon,
  GridIcon,
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
 * el Inicio, pero NO en la barra inferior: BottomNav parte NAV_ITEMS en
 * 2 + FAB + 2, y con cinco o seis entradas los objetivos tactiles caen por
 * debajo del minimo comodo a 390 px.
 *
 * En movil cada una se alcanza por enlace contextual, en el punto donde tiene
 * sentido: /agencias desde el itinerario, justo despues de ver un plan armado y
 * poder querer compararlo con un tour existente.
 */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/servicios", label: "Servicios", Icon: GridIcon },
  { href: "/historias", label: "Historias", Icon: BookIcon },
  { href: "/agencias", label: "Agencias", Icon: BriefcaseIcon },
];
