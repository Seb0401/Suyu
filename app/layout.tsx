import type { Metadata } from "next";
import "./globals.css";

/**
 * NOTA PARA PERSONA B (B1): el scaffold traia Geist via next/font/google, pero
 * fonts.googleapis.com no es alcanzable desde la red del equipo y eso rompe
 * `npm run build`. Se quito para que el Commit 0 compile.
 *
 * Cuando montes Nunito + Yellowtail, o se prueba desde una red que si alcance
 * Google Fonts, o se autohospedan los .woff2 en public/fonts/ con @font-face.
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
