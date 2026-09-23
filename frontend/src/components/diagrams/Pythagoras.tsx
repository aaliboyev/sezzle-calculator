import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function PythagorasDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!(a > 0 && b > 0 && a <= 9999 && b <= 9999)) return null
  const scale = 104 / Math.max(a, b)
  const w = a * scale
  const h = b * scale
  const x = 24
  const base = 124
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <polygon
        points={`${x},${base} ${x + w},${base} ${x},${base - h}`}
        fill="rgba(167, 139, 250, 0.08)"
        stroke="var(--peach-strong)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1={x + w} y1={base} x2={x} y2={base - h} stroke="var(--violet)" strokeWidth="2" strokeLinecap="round" />
      <rect x={x} y={base - 12} width="12" height="12" fill="none" stroke="var(--muted)" />
      <text x={x + w / 2} y={base + 14} textAnchor="middle">
        {formatResult(a)}
      </text>
      <text x={x - 8} y={base - h / 2} textAnchor="end">
        {formatResult(b)}
      </text>
      <text x={x + w / 2 + 12} y={base - h / 2 - 6}>
        {formatResult(Math.hypot(a, b))}
      </text>
    </svg>
  )
}
