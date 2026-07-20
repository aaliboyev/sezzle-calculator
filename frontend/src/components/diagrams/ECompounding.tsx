import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function ECompoundingDiagram({ values }: DiagramProps) {
  const n = values.n
  if (!(n >= 1 && Number.isFinite(n))) return null
  const top = 22
  const bottom = 112
  const left = 18
  const right = 206
  const vMin = 2
  const vMax = Math.E
  const maxN = Math.max(n, 1000)
  const xOf = (s: number) => left + (Math.log10(s) / Math.log10(maxN)) * (right - left)
  const yOf = (v: number) => bottom - ((Math.min(v, vMax) - vMin) / (vMax - vMin)) * (bottom - top)
  const samples = [...new Set([1, 2, 5, 10, 100, 1000])].filter((s) => s !== n).sort((p, q) => p - q)
  const value = Math.pow(1 + 1 / n, n)
  const you = { x: xOf(n), y: yOf(value) }
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <line x1={left} y1={top} x2={right} y2={top} stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={right} y={top - 5} textAnchor="end" className="accent">
        e
      </text>
      {samples.map((s) => (
        <circle key={s} cx={xOf(s)} cy={yOf(Math.pow(1 + 1 / s, s))} r="3" fill="var(--peach-strong)" />
      ))}
      <circle cx={you.x} cy={you.y} r="4" fill="var(--orange)" />
      <text x={Math.min(Math.max(you.x, 52), 206)} y={you.y + 16} textAnchor="end" className="accent">
        {formatResult(value)}
      </text>
    </svg>
  )
}
