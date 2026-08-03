/**
 * Paisaje del hero: el Misti y la silueta del centro historico, dibujados como
 * SVG. Misma razon que SiteThumbnail — no metemos fotos de terceros sin
 * licencia clara, y esto no pesa ni pide red.
 *
 * Decorativo: no lleva texto alternativo porque el wordmark y el titulo que van
 * encima ya dicen de que se trata la pantalla.
 */
export default function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 390 240"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="suyu-hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbede6" />
          <stop offset="100%" stopColor="#f6ddd1" />
        </linearGradient>
      </defs>

      <rect width="390" height="240" fill="url(#suyu-hero-sky)" />
      <circle cx="312" cy="52" r="26" fill="#dd5b2c" opacity="0.25" />

      {/* cordillera de fondo */}
      <path d="M0 150 L70 96 L118 138 L168 104 L232 152 L300 112 L390 158 V240 H0Z" fill="#dfd2bc" />

      {/* el Misti */}
      <path d="M96 168 L186 62 L276 168 Z" fill="#a8401f" opacity="0.75" />
      <path d="M160 92 L186 62 L212 92 L198 88 L186 96 L174 88 Z" fill="#fdfbf6" />

      {/* silueta del centro historico */}
      <rect x="0" y="168" width="390" height="72" fill="#f8f2e7" />
      <g fill="#ede3d2">
        <rect x="16" y="150" width="60" height="90" />
        <rect x="88" y="158" width="82" height="82" />
        <rect x="182" y="146" width="54" height="94" />
        <rect x="248" y="160" width="126" height="80" />
      </g>
      {/* arcos del portal */}
      <g fill="#f8f2e7">
        <path d="M100 240v-34a10 10 0 0 1 20 0v34Z" />
        <path d="M130 240v-34a10 10 0 0 1 20 0v34Z" />
        <path d="M262 240v-30a9 9 0 0 1 18 0v30Z" />
        <path d="M290 240v-30a9 9 0 0 1 18 0v30Z" />
        <path d="M318 240v-30a9 9 0 0 1 18 0v30Z" />
      </g>
      {/* torres de la catedral */}
      <g fill="#dfd2bc">
        <path d="M190 146 L200 128 L210 146 Z" />
        <rect x="196" y="112" width="8" height="18" rx="4" />
      </g>
    </svg>
  );
}
