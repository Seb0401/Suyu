import type { Metadata } from "next";
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
      <body className="bg-sand-100 font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
