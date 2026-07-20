import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function BigTinyDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!(a > 0 && b > 0 && a <= 308 && b <= 308)) return null
  const left = 16
  const right = 204
  const axisY = 46
  const tinyX = left
  const bigX = right
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <line x1={left} y1={axisY} x2={right} y2={axisY} stroke="var(--muted)" strokeWidth="1" />
      <line x1={tinyX} y1={axisY} x2={tinyX} y2={axisY - 10} stroke="var(--peach-strong)" strokeWidth="2" />
      <line x1={bigX} y1={axisY} x2={bigX} y2={axisY - 34} stroke="var(--violet)" strokeWidth="2" />
      <circle cx={bigX} cy={axisY - 34} r="3" fill="var(--orange)" />
      <line x1={tinyX} y1="16" x2={bigX} y2="16" stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
      <text x={(tinyX + bigX) / 2} y="12" textAnchor="middle" className="accent">
        {`${formatResult(a + b)} orders`}
      </text>
      <text x={tinyX} y={axisY + 12} textAnchor="start">{`10^-${formatResult(b)}`}</text>
      <text x={bigX} y={axisY + 12} textAnchor="end">{`10^${formatResult(a)}`}</text>
    </svg>
  )
}
