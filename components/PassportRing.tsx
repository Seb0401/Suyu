/**
 * Anillo de progreso del pasaporte: cuantas estampas de cuantas en total.
 * El numero en el centro es la fuente primaria del dato (§2.3) — el anillo
 * es refuerzo visual, como el emblema de un sello oficial.
 */
export default function PassportRing({
  value,
  max,
  colorVar,
  size = 104,
}: {
  value: number;
  max: number;
  colorVar: string;
  size?: number;
}) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max === 0 ? 0 : Math.min(1, value / max);
  const dash = circumference * pct;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${value} de ${max} estampas coleccionadas`}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-cream)"
        strokeOpacity={0.35}
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={colorVar}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-cream text-2xl font-extrabold"
      >
        {value}/{max}
      </text>
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-cream text-[9px] font-bold uppercase tracking-wide opacity-80"
      >
        estampas
      </text>
    </svg>
  );
}
