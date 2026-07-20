import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

export function GoldenDiagram({ values }: DiagramProps) {
  const { a } = values
  const phi = (1 + Math.sqrt(a)) / 2
  if (!(a > 1) || !Number.isFinite(phi)) return null
  const W = 180
  const H = W / phi
  if (!(H > 0 && H <= 132)) return null
  const x0 = 20
  const y0 = (140 - H) / 2
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <rect x={x0} y={y0} width={W} height={H} fill="rgba(255, 255, 255, 0.05)" stroke="var(--peach-strong)" strokeWidth="1.5" />
      <rect x={x0} y={y0} width={H} height={H} fill="rgba(167, 139, 250, 0.08)" stroke="var(--violet)" strokeWidth="1.5" />
      <path d={`M ${x0} ${y0 + H} A ${H} ${H} 0 0 1 ${x0 + H} ${y0}`} fill="none" stroke="var(--orange)" strokeWidth="1.5" />
      <text x={x0 + W / 2} y={y0 - 5} textAnchor="middle" className="accent">{`φ = ${formatResult(phi)}`}</text>
      <text x={x0 + H / 2} y={y0 + H / 2 + 4} textAnchor="middle">
        1
      </text>
      <text x={x0 + H + (W - H) / 2} y={y0 + H / 2 + 4} textAnchor="middle">
        {(phi - 1).toFixed(3)}
      </text>
    </svg>
  )
}
