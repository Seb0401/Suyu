/**
 * Monograma de agencia.
 *
 * NO usamos los logos reales y no es por pereza: son marcas registradas, y
 * ponerlas en una pantalla que declara "no tenemos convenio ni comision con
 * estas agencias" da a entender exactamente lo contrario. El monograma
 * identifica sin apropiarse de nada.
 *
 * Si alguna agencia da permiso por escrito, reemplazar esto por su logo es
 * cambiar un componente.
 */

/** Paleta de la propia app. El color se deriva del nombre para que cada
 *  agencia tenga el suyo y sea estable entre recargas. */
const PALETTE = [
  { bg: "var(--color-clay-100)", fg: "var(--color-clay-700)" },
  { bg: "var(--color-forest-100)", fg: "var(--color-forest-700)" },
  { bg: "var(--color-sand-200)", fg: "var(--color-ink-soft)" },
  { bg: "var(--color-clay-50)", fg: "var(--color-clay-600)" },
];

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export default function AgencyMonogram({
  name,
  size = 44,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const { bg, fg } = paletteFor(name);

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-2xl font-extrabold ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}
