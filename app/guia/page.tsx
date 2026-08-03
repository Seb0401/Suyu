import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertIcon,
  ArrowRightIcon,
  BookIcon,
  BriefcaseIcon,
  CalendarIcon,
  CompassIcon,
  GridIcon,
  type IconProps,
} from "@/components/Icons";
import type { ComponentType } from "react";

export const metadata: Metadata = {
  title: "Guía de Arequipa — Suyu",
  description:
    "Sitios, servicios, tours, calendario, historias y emergencias en un solo lugar.",
};

const SECTIONS: {
  href: string;
  label: string;
  hint: string;
  Icon: ComponentType<IconProps>;
  tone: string;
}[] = [
  {
    href: "/explorar",
    label: "Lugares",
    hint: "Los 6 sitios piloto con su accesibilidad y aforo",
    Icon: CompassIcon,
    tone: "bg-forest-100 text-forest-700",
  },
  {
    href: "/servicios",
    label: "Servicios",
    hint: "Hoteles, restaurantes, transporte, actividades y más",
    Icon: GridIcon,
    tone: "bg-clay-100 text-clay-700",
  },
  {
    href: "/agencias",
    label: "Tours y agencias",
    hint: "Compara planes y sus costos reales",
    Icon: BriefcaseIcon,
    tone: "bg-clay-50 text-clay-600",
  },
  {
    href: "/eventos",
    label: "Calendario",
    hint: "Fiestas, lluvias y fechas que cambian el viaje",
    Icon: CalendarIcon,
    tone: "bg-sand-200 text-ink-soft",
  },
  {
    href: "/historias",
    label: "Historias",
    hint: "Notas del equipo tras visitar cada lugar",
    Icon: BookIcon,
    tone: "bg-forest-50 text-forest-700",
  },
  {
    href: "/emergencias",
    label: "Emergencias",
    hint: "105 · 106 · 116 y qué hacer ante un paro",
    Icon: AlertIcon,
    tone: "bg-clay-100 text-clay-700",
  },
];

/**
 * Hub de la guia.
 *
 * Existe porque la navegacion se desbordo: el header de escritorio habia
 * llegado a nueve entradas y la barra inferior no admite mas de cuatro con el
 * FAB al centro. En vez de esconder secciones en un desplegable, se les da una
 * casa: una sola entrada de nav que lleva a todas.
 *
 * Renderizada en el servidor: son enlaces estaticos, no hay nada que esperar.
 */
export default function GuiaPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Guía de Arequipa</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Todo lo que necesitas saber antes y durante el viaje.
      </p>

      <ul className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2">
        {SECTIONS.map(({ href, label, hint, Icon, tone }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full items-center gap-3 rounded-3xl border border-sand-200 bg-sand-50 p-4"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}
              >
                <Icon size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-ink">{label}</span>
                <span className="block text-xs leading-relaxed text-ink-soft">
                  {hint}
                </span>
              </span>
              <ArrowRightIcon size={18} className="shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
