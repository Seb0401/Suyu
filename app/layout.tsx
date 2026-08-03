import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import OnboardingGate from "@/components/OnboardingGate";
import PwaProvider from "@/components/PwaProvider";
import SiteHeader from "@/components/SiteHeader";
import { THEME_INIT_SCRIPT } from "@/components/ThemeToggle";
import "./globals.css";

/*
 * Nunito + Yellowtail se cargan con @font-face desde public/fonts/, no con
 * next/font/google: fonts.googleapis.com esta bloqueado en la red del equipo y
 * next/font resuelve en build, asi que `npm run build` fallaba. Ver el comentario
 * al inicio de globals.css.
 */

export const metadata: Metadata = {
  title: "Suyu — compañero de viaje accesible en Arequipa",
  description:
    "Rutas accesibles, aforo por hora y copiloto de viaje para los atractivos de Arequipa.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Suyu", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#15664a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* suppressHydrationWarning va SOLO aqui: el script de tema agrega la clase
       `dark` al <html> antes de hidratar, asi que servidor y cliente difieren
       en ese atributo a proposito (§7.6). No se propaga al resto del arbol. */
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-sand-100 font-sans text-ink antialiased">
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <PwaProvider />
        <OnboardingGate />
        <SiteHeader />
        {/* pb-28 deja aire para que la barra inferior no tape el final de la
            pagina en movil; en escritorio la barra no existe. */}
        <main id="contenido" tabIndex={-1} className="pb-28 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
