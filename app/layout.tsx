import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";
import SiteHeader from "@/components/SiteHeader";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-sand-100 font-sans text-ink antialiased">
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
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
