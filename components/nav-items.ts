import type { ComponentType } from "react";
import {
  BookOpenIcon,
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
 * Navegacion principal, la misma en la barra inferior y en el header.
 *
 * Son cuatro y se quedan en cuatro: BottomNav las parte en 2 + FAB + 2, y con
 * cinco o seis los objetivos tactiles caen por debajo del minimo comodo a
 * 390 px.
 *
 * El mockup muestra "Favoritos", pero no hay pantalla de favoritos ni backend
 * que la sostenga. En su lugar va "Guía", que agrupa todo lo que antes andaba
 * suelto: lugares, servicios, tours, calendario, historias y emergencias.
 * Preferimos una entrada que lleve a algo real antes que una que prometa una
 * funcion inexistente.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/ruta", label: "Rutas", Icon: RouteIcon },
  { href: "/guia", label: "Guía", Icon: BookOpenIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
];
