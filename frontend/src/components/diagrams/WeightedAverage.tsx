import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function WeightedDiagram({ values }: DiagramProps) {
  const { w1, x1, w2, x2 } = values
  const total = w1 + w2
  if (!(total > 0) || x1 === x2 || !Number.isFinite(x1) || !Number.isFinite(x2)) return null
  const avg = w1 * x1 + w2 * x2
  const lo = Math.min(x1, x2)
  const hi = Math.max(x1, x2)
  const map = (v: number) => 20 + ((v - lo) / (hi - lo)) * 180
  const bx = Math.max(20, Math.min(200, map(avg)))
  const r1 = 4 + (Math.abs(w1) / total) * 9
  const r2 = 4 + (Math.abs(w2) / total) * 9
  const beamY = 74
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <line x1="20" y1={beamY} x2="200" y2={beamY} stroke="var(--muted)" strokeWidth="2" />
      <circle cx={map(x1)} cy={beamY} r={r1} fill="var(--peach-strong)" />
      <circle cx={map(x2)} cy={beamY} r={r2} fill="var(--peach-strong)" />
      <line x1={bx} y1={beamY - 24} x2={bx} y2={beamY + 6} stroke="var(--orange)" strokeWidth="1" strokeDasharray="4 4" />
      <polygon points={`${bx},${beamY + 6} ${bx - 7},${beamY + 20} ${bx + 7},${beamY + 20}`} fill="var(--orange)" />
      <text x={map(x1)} y={beamY - r1 - 6} textAnchor="middle">
        {formatResult(x1)}
      </text>
      <text x={map(x2)} y={beamY - r2 - 6} textAnchor="middle">
        {formatResult(x2)}
      </text>
      <text x={map(x1)} y={beamY + 32} textAnchor="middle">
        {formatResult(w1)}
      </text>
      <text x={map(x2)} y={beamY + 32} textAnchor="middle">
        {formatResult(w2)}
      </text>
      <text x={bx} y={beamY - 28} textAnchor="middle" className="accent">
        {formatResult(avg)}
      </text>
    </svg>
  )
}
