import Image from "next/image";

/**
 * Mascota de Suyu — alpaca con chullo, ilustrada.
 *
 * Ya no es un SVG vectorial de una sola pose: son 12 recortes de
 * material_proyecto/WaikyIA.png guardados en public/mascot/ (§7.5).
 *
 * `state` es aditivo: la API vieja (<Mascot size={40} />) sigue siendo valida
 * porque el default es "calm", asi que ningun call site anterior se rompio al
 * introducir el prop.
 *
 * Decorativa por defecto: `aria-hidden` salvo que se pase `title`.
 */

export type MascotState =
  | "wave"
  | "smile"
  | "look"
  | "back"
  | "laugh"
  | "calm"
  | "cheer"
  | "confused"
  | "search"
  | "map"
  | "chat"
  | "cool";

type MascotProps = {
  size?: number;
  state?: MascotState;
  className?: string;
  /** Si se pasa, la mascota deja de ser decorativa y se anuncia con este texto. */
  title?: string;
};

export default function Mascot({
  size = 48,
  state = "calm",
  className,
  title,
}: MascotProps) {
  const decorative = !title;

  return (
    <Image
      src={`/mascot/${state}.png`}
      width={size}
      height={size}
      alt={decorative ? "" : title}
      aria-hidden={decorative || undefined}
      className={className}
      /* Sin optimizacion del servidor: son PNG chicos y ya recortados, y asi
         siguen sirviendose desde el cache del service worker sin conexion. */
      unoptimized
      priority={false}
    />
  );
}
