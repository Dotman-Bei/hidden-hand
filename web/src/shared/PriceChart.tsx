import "./chart.css";

export interface ChartPoint { tMs: number; priceC: number }
export interface PriceChartProps { points: ChartPoint[]; durationMs: number; revealSum: number | null; height?: number; label: string }
const W = 640;
const Y_MIN = 8;
const Y_MAX = 120;

export function PriceChart({ points, durationMs, revealSum, height = 260, label }: PriceChartProps) {
  const x = (t: number) => (Math.min(t, durationMs) / durationMs) * W;
  const y = (p: number) => height - ((p - Y_MIN) / (Y_MAX - Y_MIN)) * height;
  const path = [{ tMs: 0, priceC: 6400 }, ...points]
    .map((pt, i) => `${i === 0 ? "M" : "L"}${x(pt.tMs).toFixed(1)},${y(pt.priceC / 100).toFixed(1)}`)
    .join(" ");
  const last = points.length > 0 ? points[points.length - 1].priceC / 100 : 64;
  return (
    <figure className="pit-chart" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${label}: price ${last.toFixed(2)}`}>
        {[32, 64, 96].map((g) => (
          <line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} className="pit-chart__grid" />
        ))}
        <path d={path} className="pit-chart__price" />
        {revealSum !== null && (
          <g className="pit-chart__reveal">
            <line x1={0} x2={W} y1={y(revealSum)} y2={y(revealSum)} className="pit-chart__sum" />
            <text x={W - 4} y={y(revealSum) - 6} textAnchor="end" className="pit-chart__sum-label">{`hidden sum ${revealSum}`}</text>
          </g>
        )}
      </svg>
    </figure>
  );
}
