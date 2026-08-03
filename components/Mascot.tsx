/**
 * Mascota de Suyu — alpaca con chullo, dibujada como SVG vectorial.
 *
 * Decorativa por defecto: se marca `aria-hidden` salvo que se le pase `title`,
 * porque en casi todos sus usos acompaña a un texto que ya dice lo mismo y un
 * lector de pantalla no deberia leerla dos veces (§7.7).
 *
 * No usa ningun `id` interno (clipPath, mask) a proposito: varias pantallas
 * montan mas de una mascota a la vez y los ids duplicados rompen el SVG. Las
 * franjas del chullo se dibujan dentro de la curva del domo en vez de
 * recortarse contra ella.
 */

type MascotProps = {
  size?: number;
  className?: string;
  /** Si se pasa, la mascota deja de ser decorativa y se anuncia con este texto. */
  title?: string;
};

export default function Mascot({ size = 48, className, title }: MascotProps) {
  const decorative = !title;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      {/* orejas: asoman por detras del chullo, fuera de la curva del domo */}
      <ellipse cx="18" cy="21" rx="3.2" ry="6" fill="#cf9a68" transform="rotate(-20 18 21)" />
      <ellipse cx="46" cy="21" rx="3.2" ry="6" fill="#cf9a68" transform="rotate(20 46 21)" />

      {/* orejeras del chullo con sus borlas */}
      <path d="M15 30 C11 38 12 45 16 48 C20 45 21 38 20 30 Z" fill="#a8401f" />
      <path d="M49 30 C53 38 52 45 48 48 C44 45 43 38 44 30 Z" fill="#a8401f" />
      <path d="M16 48 L16 55 M48 48 L48 55" stroke="#f6ddd1" strokeWidth="2.2" strokeLinecap="round" />

      {/* poncho */}
      <path d="M21 53 L43 53 L48 64 L16 64 Z" fill="#15664a" />
      <path d="M23.5 58 L40.5 58 L42 62 L22 62 Z" fill="#c9502a" />

      {/* cabeza */}
      <ellipse cx="32" cy="40" rx="16" ry="15" fill="#e3b78a" />

      {/* chullo: domo + franja inferior + zigzag andino */}
      <path d="M15 32 A17 17 0 0 1 49 32 Z" fill="#c9502a" />
      <path
        d="M19 27 L23 22.5 L27 27 L31 22.5 L35 27 L39 22.5 L43 27"
        fill="none"
        stroke="#fdfbf6"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="13" y="28.5" width="38" height="6" rx="3" fill="#a8401f" />

      {/* pompon */}
      <circle cx="32" cy="13" r="4.5" fill="#f6ddd1" />

      {/* hocico */}
      <ellipse cx="32" cy="47" rx="8.5" ry="6.5" fill="#f5e2ca" />
      <path d="M28.8 44.6 L35.2 44.6 L32 48.4 Z" fill="#6f5140" />

      {/* ojos */}
      <circle cx="25.6" cy="39" r="2.6" fill="#2e2a25" />
      <circle cx="38.4" cy="39" r="2.6" fill="#2e2a25" />
      <circle cx="26.4" cy="38.2" r="0.9" fill="#fdfbf6" />
      <circle cx="39.2" cy="38.2" r="0.9" fill="#fdfbf6" />

      {/* cachetes */}
      <circle cx="21.5" cy="45" r="2.8" fill="#dd5b2c" opacity="0.3" />
      <circle cx="42.5" cy="45" r="2.8" fill="#dd5b2c" opacity="0.3" />
    </svg>
  );
}
