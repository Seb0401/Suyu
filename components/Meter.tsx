/**
 * Medidor horizontal. El valor siempre se imprime como texto al lado: la barra
 * es refuerzo visual, no la unica forma de leer el dato (§2.3).
 */
export default function Meter({
  label,
  value,
  max = 100,
  valueLabel,
  color = "var(--color-forest-700)",
  className = "",
}: {
  label: string;
  value: number;
  max?: number;
  valueLabel?: string;
  color?: string;
  className?: string;
}) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-sm font-extrabold text-ink">{valueLabel ?? `${pct}%`}</span>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-sand-200"
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
