"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Mascot from "@/components/Mascot";
import { NAV_ITEMS } from "@/components/nav-items";
import { useT } from "@/components/i18n/LocaleProvider";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Barra inferior fija con el FAB de la mascota al centro. Solo en movil (§7.3). */
export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const chatActive = pathname.startsWith("/chat");

  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2)];

  return (
    <nav
      aria-label={t("nav.principal")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-sand-50 md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-end justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {left.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <li className="-mt-8 shrink-0">
          <Link
            href="/chat"
            aria-current={chatActive ? "page" : undefined}
            aria-label={t("nav.copilotoViaje")}
            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-sand-50 shadow-lg transition-colors ${
              chatActive ? "bg-clay-600" : "bg-clay-100"
            }`}
          >
            <Mascot size={44} />
          </Link>
        </li>

        {right.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavTab({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const t = useT();
  const { href, labelKey, Icon } = item;
  const label = t(labelKey);

  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold ${
          active ? "text-clay-600" : "text-ink-muted"
        }`}
      >
        <Icon size={22} />
        {label}
        {/* El color no puede cargar el estado activo solo (§2.3): el punto lo
            duplica en forma, y aria-current lo expone al lector de pantalla. */}
        <span
          aria-hidden
          className={`h-1 w-1 rounded-full ${active ? "bg-clay-600" : "bg-transparent"}`}
        />
      </Link>
    </li>
  );
}
