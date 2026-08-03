"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { ChatIcon } from "@/components/Icons";
import { NAV_ITEMS } from "@/components/nav-items";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Header de escritorio. En movil la navegacion vive en BottomNav, asi que este
 * se oculta por debajo de `md` (§7.3). El ThemeToggle se monta aqui en B13.
 */
export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-sand-200 bg-sand-50/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" aria-label="Suyu — inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Navegación principal" className="flex-1">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-clay-100 text-clay-700"
                        : "text-ink-soft hover:bg-sand-100"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/chat"
          aria-current={pathname.startsWith("/chat") ? "page" : undefined}
          className="flex items-center gap-2 rounded-full bg-night-800 px-4 py-2 text-sm font-bold text-cream"
        >
          <ChatIcon size={18} />
          Copiloto
        </Link>
      </div>
    </header>
  );
}
