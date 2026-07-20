import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function SquareDiagonalDiagram({ values }: DiagramProps) {
  const { s } = values
  if (!(s > 0 && s <= 9999)) return null
  const side = 92
  const x0 = 64
  const y0 = 24
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <rect x={x0} y={y0} width={side} height={side} fill="rgba(167, 139, 250, 0.08)" stroke="var(--peach-strong)" strokeWidth="1.5" />
      <line x1={x0} y1={y0 + side} x2={x0 + side} y2={y0} stroke="var(--violet)" strokeWidth="2" />
      <rect x={x0} y={y0 + side - 12} width="12" height="12" fill="none" stroke="var(--muted)" strokeWidth="1" />
      <text x={x0 + side / 2} y={y0 + side + 16} textAnchor="middle">
        {formatResult(s)}
      </text>
      <text x={x0 + side / 2 + 10} y={y0 + side / 2 - 6} className="accent">
        {formatResult(s * Math.SQRT2)}
      </text>
    </svg>
  )
}
