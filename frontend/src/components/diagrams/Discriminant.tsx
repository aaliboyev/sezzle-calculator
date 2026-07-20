import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function DiscriminantDiagram({ values }: DiagramProps) {
  const { b, a, c } = values
  const disc = b * b - 4 * a * c
  if (!Number.isFinite(disc) || a === 0) return null
  const up = a > 0
  const cx = 110
  const k = 0.012
  const vy = up ? 108 : 32
  const pts: string[] = []
  for (let x = 22; x <= 198; x += 4) {
    const dx = x - cx
    const y = up ? vy - k * dx * dx : vy + k * dx * dx
    pts.push(`${x},${y.toFixed(1)}`)
  }
  const axisY = disc === 0 ? vy : disc > 0 ? 70 : up ? 124 : 16
  const off = Math.sqrt(Math.abs(vy - axisY) / k)
  const roots = disc > 0 ? [cx - off, cx + off] : disc === 0 ? [cx] : []
  const label = disc > 0 ? 'two real roots' : disc === 0 ? 'one real root' : 'no real roots'
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke="var(--violet)" strokeWidth="2" strokeLinejoin="round" />
      <line x1="10" y1={axisY} x2="210" y2={axisY} stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
      {roots.map((rx, i) => (
        <circle key={i} cx={rx} cy={axisY} r="4" fill="var(--orange)" />
      ))}
      <text x={cx} y="15" textAnchor="middle" className="accent">{`Δ = ${formatResult(disc)}`}</text>
      <text x={cx} y="133" textAnchor="middle">
        {label}
      </text>
    </svg>
  )
}
