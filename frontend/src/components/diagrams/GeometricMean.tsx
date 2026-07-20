import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function GeometricMeanDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!(a > 0 && b > 0 && a <= 9999 && b <= 9999)) return null
  const gm = Math.sqrt(a * b)
  const k = 88 / Math.max(a, b, gm)
  const rw = a * k
  const rh = b * k
  const sq = gm * k
  const baseY = 118
  const rectX = 64 - rw / 2
  const sqX = 166 - sq / 2
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <rect x={rectX} y={baseY - rh} width={rw} height={rh} fill="rgba(255, 255, 255, 0.05)" stroke="var(--peach-strong)" strokeWidth="1.5" />
      <text x={rectX + rw / 2} y={baseY + 15} textAnchor="middle">
        {formatResult(a)}
      </text>
      <text x={rectX - 8} y={baseY - rh / 2} textAnchor="end">
        {formatResult(b)}
      </text>
      <rect x={sqX} y={baseY - sq} width={sq} height={sq} fill="rgba(255, 140, 90, 0.45)" stroke="var(--orange)" strokeWidth="1.5" />
      <text x={sqX + sq / 2} y={baseY + 15} textAnchor="middle" className="accent">
        {formatResult(gm)}
      </text>
      <text x="118" y={baseY - 22} textAnchor="middle">
        =
      </text>
    </svg>
  )
}
