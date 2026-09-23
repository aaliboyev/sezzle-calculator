import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function CompoundGrowthDiagram({ values }: DiagramProps) {
  const { p, r, n } = values
  if (!(p > 0 && Number.isInteger(n) && n >= 1 && n <= 24 && r > -100)) return null
  const m = 1 + r / 100
  const growth = Array.from({ length: n + 1 }, (_, i) => Math.pow(m, i))
  const min = Math.min(...growth)
  const span = Math.max(...growth) - min || 1
  const points = growth.map((v, i) => [12 + (i / n) * 196, 58 - ((v - min) / span) * 44])
  const [lastX, lastY] = points[points.length - 1]
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="var(--violet)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill="var(--orange)" />
      <text x={lastX} y={lastY - 8} textAnchor="end" className="accent">
        {formatResult(p * Math.pow(m, n))}
      </text>
    </svg>
  )
}
