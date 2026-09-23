import { formatResult } from '../../lib/format'
import type { DiagramProps } from './types'

const WIDTH = 200

// Discount shows the cut as removed; tip shows the same slice as taken.
function ShareBar({ total, rate, removed }: { total: number; rate: number; removed: boolean }) {
  if (!(total > 0 && rate >= 0 && rate <= 1.5)) return null
  const slice = Math.min(rate, 1) * WIDTH
  const share = formatResult(total * rate)
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <rect x="10" y="18" width={WIDTH} height="24" rx="6" fill="rgba(255, 255, 255, 0.05)" stroke="var(--muted)" />
      <rect x={10 + WIDTH - slice} y="18" width={slice} height="24" rx="6" fill="rgba(255, 140, 90, 0.45)" />
      <text x="10" y="12">
        {formatResult(total)}
      </text>
      <text x={10 + WIDTH - slice / 2} y="58" textAnchor="middle" className="accent">
        {removed ? `-${share}` : share}
      </text>
    </svg>
  )
}

export function DiscountDiagram({ values }: DiagramProps) {
  return <ShareBar total={values.a} rate={values.r} removed />
}

export function TipDiagram({ values }: DiagramProps) {
  return <ShareBar total={values.a} rate={values.r} removed={false} />
}
