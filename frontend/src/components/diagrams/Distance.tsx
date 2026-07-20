import { formatResult } from '../../lib/format'
import { PlaneGrid, planeScales } from './plane'
import type { DiagramProps } from './types'

export function DistanceDiagram({ values }: DiagramProps) {
  const { x1, y1, x2, y2 } = values
  const ok = [x1, y1, x2, y2].every((n) => Number.isFinite(n) && Math.abs(n) <= 9999)
  if (!ok || (x1 === x2 && y1 === y2)) return null
  const { L, R, T, B, sx, sy } = planeScales(x1, y1, x2, y2)
  const p1x = sx(x1)
  const p1y = sy(y1)
  const p2x = sx(x2)
  const p2y = sy(y2)
  const cx = sx(x2)
  const cy = sy(y1)
  const tick = 7
  const hx = p1x >= cx ? tick : -tick
  const vy = p2y >= cy ? tick : -tick
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <PlaneGrid L={L} R={R} T={T} B={B} />
      <line x1={p1x} y1={p1y} x2={cx} y2={cy} stroke="var(--peach-strong)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1={cx} y1={cy} x2={p2x} y2={p2y} stroke="var(--peach-strong)" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points={`${cx + hx},${cy} ${cx + hx},${cy + vy} ${cx},${cy + vy}`} fill="none" stroke="var(--muted)" strokeWidth="1" />
      <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="var(--violet)" strokeWidth="2" />
      <circle cx={p1x} cy={p1y} r="3.5" fill="var(--peach-strong)" />
      <circle cx={p2x} cy={p2y} r="3.5" fill="var(--orange)" />
      <text x={p1x} y={p1y + 16} textAnchor="middle">{`(${formatResult(x1)}, ${formatResult(y1)})`}</text>
      <text x={p2x} y={p2y - 8} textAnchor="middle">{`(${formatResult(x2)}, ${formatResult(y2)})`}</text>
      <text x={(p1x + p2x) / 2 + 8} y={(p1y + p2y) / 2 - 6} className="accent">
        {formatResult(Math.hypot(x2 - x1, y2 - y1))}
      </text>
    </svg>
  )
}
