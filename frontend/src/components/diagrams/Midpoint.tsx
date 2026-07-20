import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function MidpointDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null
  const y = 40
  const xa = 15
  const xb = 205
  const xm = (xa + xb) / 2
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <line x1={xa} y1={y} x2={xb} y2={y} stroke="var(--muted)" strokeWidth="2" />
      <line x1={xa} y1={y - 6} x2={xa} y2={y + 6} stroke="var(--peach-strong)" strokeWidth="2" />
      <line x1={xb} y1={y - 6} x2={xb} y2={y + 6} stroke="var(--peach-strong)" strokeWidth="2" />
      <line x1={xm} y1={y - 10} x2={xm} y2={y + 10} stroke="var(--orange)" strokeWidth="2" />
      <circle cx={xm} cy={y} r="3.5" fill="var(--orange)" />
      <text x={xa} y={y + 20} textAnchor="middle">
        {formatResult(a)}
      </text>
      <text x={xb} y={y + 20} textAnchor="middle">
        {formatResult(b)}
      </text>
      <text x={xm} y={y - 14} textAnchor="middle" className="accent">
        {formatResult((a + b) / 2)}
      </text>
    </svg>
  )
}

// Guides with a bespoke component; everything else falls back to the
// data-spec renderer below.
