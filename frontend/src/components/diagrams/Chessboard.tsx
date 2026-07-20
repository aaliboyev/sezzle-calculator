import type { DiagramProps } from './types'

export function ChessboardDiagram({ values }: DiagramProps) {
  const exp = values.k
  if (!(Number.isInteger(exp) && exp >= 1 && exp <= 1023)) return null
  const bars = Math.min(8, exp + 1)
  const top = 12
  const bottom = 58
  const left = 14
  const barW = 18
  const gap = (206 - left - bars * barW) / (bars - 1)
  const usable = bottom - top - 3
  const cells = Array.from({ length: bars }, (_, i) => Math.round((i / (bars - 1)) * exp))
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      {cells.map((e, i) => {
        const h = 3 + (e / exp) * usable
        const x = left + i * (barW + gap)
        return (
          <rect
            key={i}
            x={x}
            y={bottom - h}
            width={barW}
            height={h}
            rx="2"
            fill={i === bars - 1 ? 'var(--orange)' : 'rgba(255, 140, 90, 0.45)'}
          />
        )
      })}
      <text x="206" y="9" textAnchor="end" className="accent">
        {`2^${exp}`}
      </text>
    </svg>
  )
}
