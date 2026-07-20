import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function TriangleAreaDiagram({ values }: DiagramProps) {
  const { b, h } = values
  if (!(b > 0 && h > 0 && b <= 9999 && h <= 9999)) return null
  const scale = Math.min(176 / b, 96 / h)
  const bw = b * scale
  const hh = h * scale
  const x0 = 22
  const baseY = 122
  const apexX = x0 + bw * 0.38
  const apexY = baseY - hh
  const tick = 9
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <polygon
        points={`${x0},${baseY} ${x0 + bw},${baseY} ${apexX},${apexY}`}
        fill="rgba(167, 139, 250, 0.08)"
        stroke="var(--peach-strong)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1={apexX} y1={apexY} x2={apexX} y2={baseY} stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline
        points={`${apexX + tick},${baseY} ${apexX + tick},${baseY - tick} ${apexX},${baseY - tick}`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1"
      />
      <text x={x0 + bw / 2} y={baseY + 16} textAnchor="middle">
        {formatResult(b)}
      </text>
      <text x={apexX - 8} y={baseY - hh / 2} textAnchor="end">
        {formatResult(h)}
      </text>
      <text x={x0 + bw * 0.55} y={baseY - hh * 0.3} className="accent">
        {formatResult((b * h) / 2)}
      </text>
    </svg>
  )
}
