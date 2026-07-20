import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function ExponentDiagram({ values }: DiagramProps) {
  const { a, m, n } = values
  if (!Number.isInteger(m) || !Number.isInteger(n) || m < 0 || n < 0) return null
  const hi = Math.max(m, n)
  if (hi < 1 || hi > 14) return null
  const base = formatResult(a)
  const cancel = Math.min(m, n)
  const tile = Math.min(14, 180 / hi)
  const gap = 2
  const rowW = (t: number) => t * (tile + gap) - gap
  const cellX = (t: number, i: number) => 110 - rowW(t) / 2 + i * (tile + gap)
  const cell = (t: number, i: number, y: number, active: boolean) => (
    <g key={`${y}-${i}`}>
      <rect
        x={cellX(t, i)}
        y={y}
        width={tile}
        height={tile}
        rx="2"
        fill={active ? 'rgba(255, 140, 90, 0.45)' : 'rgba(255, 255, 255, 0.05)'}
        stroke={active ? 'var(--orange)' : 'var(--muted)'}
        strokeWidth="1"
      />
      <text x={cellX(t, i) + tile / 2} y={y + tile / 2 + 3} textAnchor="middle" style={{ fontSize: 8 }}>
        {base}
      </text>
      {!active && (
        <line x1={cellX(t, i)} y1={y} x2={cellX(t, i) + tile} y2={y + tile} stroke="var(--muted)" strokeWidth="1" />
      )}
    </g>
  )
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      {Array.from({ length: m }, (_, i) => cell(m, i, 24, i >= cancel))}
      <line x1="12" y1="62" x2="208" y2="62" stroke="var(--violet)" strokeWidth="1.5" />
      {Array.from({ length: n }, (_, i) => cell(n, i, 84, i >= cancel))}
      <text x="110" y="128" textAnchor="middle" className="accent">
        {`${base}^${formatResult(m - n)} = ${formatResult(Math.pow(a, m - n))}`}
      </text>
    </svg>
  )
}
