import { convertLatexToMarkup } from 'mathlive'
import { formatResult } from '../lib/format'
import { useCalculator } from '../store/calculator'
import type { GuideValues } from '../engine/guides'

function TriangleDiagram({ a, b }: GuideValues) {
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
      <line x1={x + w} y1={base} x2={x} y2={base - h} stroke="var(--violet)" strokeWidth="2" />
      <rect x={x} y={base - 12} width="12" height="12" fill="none" stroke="var(--muted)" strokeWidth="1" />
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

function ShareBarDiagram({ total, rate, keep }: { total: number; rate: number; keep: boolean }) {
  if (!(total > 0 && rate >= 0 && rate <= 1.5)) return null
  const width = 200
  const slice = Math.min(rate, 1) * width
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <rect x="10" y="18" width={width} height="24" rx="6" fill="rgba(255, 255, 255, 0.05)" stroke="var(--muted)" />
      <rect x={10 + width - slice} y="18" width={slice} height="24" rx="6" fill="rgba(255, 140, 90, 0.45)" />
      <text x="10" y="12">
        {formatResult(total)}
      </text>
      <text x={10 + width - slice / 2} y="58" textAnchor="middle" className="accent">
        {keep ? `-${formatResult(total * rate)}` : formatResult(total * rate)}
      </text>
    </svg>
  )
}

function GrowthDiagram({ p, r, n }: GuideValues) {
  const periods = Math.round(n)
  if (!(p > 0 && periods >= 1 && periods <= 24 && periods === n && r > -100)) return null
  const m = 1 + r / 100
  const values = Array.from({ length: periods + 1 }, (_, i) => Math.pow(m, i))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((v, i) => `${12 + (i / periods) * 196},${58 - ((v - min) / span) * 44}`)
    .join(' ')
  const [lastX, lastY] = points.split(' ').at(-1)!.split(',')
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--violet)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill="var(--orange)" />
      <text x={Number(lastX)} y={Number(lastY) - 8} textAnchor="end" className="accent">
        {formatResult(p * Math.pow(m, periods))}
      </text>
    </svg>
  )
}

function Diagram({ name, values }: { name: string; values: GuideValues }) {
  switch (name) {
    case 'pythagoras':
      return <TriangleDiagram {...values} />
    case 'tip':
      return <ShareBarDiagram total={values.a} rate={values.r} keep={false} />
    case 'discount':
      return <ShareBarDiagram total={values.a} rate={values.r} keep />
    case 'compound growth':
      return <GrowthDiagram {...values} />
    default:
      return null
  }
}

export function GuidePanel() {
  const guide = useCalculator((s) => s.guide)
  if (!guide) return null
  return (
    <section className="guide" aria-label={`guide: ${guide.name}`}>
      <div className="guide-text">
        <h2 className="guide-title">{guide.name}</h2>
        <p className="guide-intro">{guide.intro}</p>
        <ol className="guide-steps">
          {guide.steps.map((step) => (
            <li key={step.label}>
              <span className="guide-step-label">{step.label}</span>
              {/* Markup is MathLive's converter over latex the guide built itself. */}
              <span
                className="guide-step-math"
                dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(step.latex) }}
              />
            </li>
          ))}
        </ol>
      </div>
      <Diagram name={guide.name} values={guide.values} />
    </section>
  )
}
