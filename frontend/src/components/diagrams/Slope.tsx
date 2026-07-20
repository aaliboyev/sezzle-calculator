import { formatResult } from '../../lib/format'
import { PlaneGrid, planeScales } from './plane'
import type { DiagramProps } from './types'

export function SlopeDiagram({ values }: DiagramProps) {
  const { x1, y1, x2, y2 } = values
  const ok = [x1, y1, x2, y2].every((n) => Number.isFinite(n) && Math.abs(n) <= 9999)
  const run = x2 - x1
  const rise = y2 - y1
  if (!ok || run === 0) return null
  const { L, R, T, B, sx, sy } = planeScales(x1, y1, x2, y2)
  const p1x = sx(x1)
  const p1y = sy(y1)
  const p2x = sx(x2)
  const p2y = sy(y2)
  const cx = sx(x2)
  const cy = sy(y1)
  const ex = (p2x - p1x) * 0.16
  const ey = (p2y - p1y) * 0.16
  const tick = 7
  const hx = p1x >= cx ? tick : -tick
  const vy = p2y >= cy ? tick : -tick
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <PlaneGrid L={L} R={R} T={T} B={B} />
      <line x1={p1x - ex} y1={p1y - ey} x2={p2x + ex} y2={p2y + ey} stroke="var(--violet)" strokeWidth="2" />
      <line x1={p1x} y1={p1y} x2={cx} y2={cy} stroke="var(--peach-strong)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1={cx} y1={cy} x2={p2x} y2={p2y} stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points={`${cx + hx},${cy} ${cx + hx},${cy + vy} ${cx},${cy + vy}`} fill="none" stroke="var(--muted)" strokeWidth="1" />
      <circle cx={p1x} cy={p1y} r="3.5" fill="var(--peach-strong)" />
      <circle cx={p2x} cy={p2y} r="3.5" fill="var(--orange)" />
      <text x={(p1x + cx) / 2} y={p1y + 15} textAnchor="middle">
        {formatResult(run)}
      </text>
      <text x={cx + 8} y={(cy + p2y) / 2} textAnchor="start">
        {formatResult(rise)}
      </text>
      <text x={(p1x + p2x) / 2 - 6} y={(p1y + p2y) / 2 - 8} textAnchor="end" className="accent">
        {formatResult(rise / run)}
      </text>
    </svg>
  )
}
