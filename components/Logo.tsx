/**
 * Wordmark de Suyu. La tipografia script (Yellowtail) solo se usa aqui — el
 * resto de la app es Nunito.
 */

type LogoProps = {
  size?: "sm" | "lg";
  withTagline?: boolean;
  className?: string;
};

export default function Logo({ size = "sm", withTagline = false, className = "" }: LogoProps) {
  const isLarge = size === "lg";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="relative inline-block leading-none">
        <span
          className={`font-display text-clay-600 ${isLarge ? "text-6xl" : "text-3xl"}`}
          /* El script se ve cortado por arriba sin un poco de aire extra. */
          style={{ lineHeight: 1.25 }}
        >
          Suyu
        </span>
        <svg
          viewBox="0 0 24 16"
          width={isLarge ? 28 : 16}
          height={isLarge ? 19 : 11}
          className="absolute -right-4 top-0"
          aria-hidden
          focusable="false"
        >
          <circle cx="5" cy="11" r="3" fill="#c9502a" />
          <circle cx="13" cy="5" r="2.4" fill="#dd5b2c" />
          <circle cx="20" cy="11" r="1.8" fill="#15664a" />
        </svg>
      </span>

      {withTagline ? (
        <p
          className={`mt-1 text-center text-ink-soft ${isLarge ? "text-base" : "text-xs"}`}
        >
          Tu compañero inteligente
          <br />
          de viaje por Arequipa
        </p>
      ) : null}
    </div>
  );
}
