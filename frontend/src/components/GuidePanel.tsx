import { convertLatexToMarkup } from 'mathlive'
import { useCalculator } from '../store/calculator'
import { Diagram } from './diagrams'

export function GuidePanel() {
  const guide = useCalculator((s) => s.guide)
  const stale = useCalculator((s) => s.guideStale)
  if (!guide) return null
  return (
    <section className={stale ? 'guide guide-stale' : 'guide'} aria-label={`guide: ${guide.name}`}>
      <div className="guide-text">
        <h2 className="guide-title">{guide.name}</h2>
        {stale && <p className="guide-paused">pattern paused mid-edit — finish the digits to update</p>}
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
      <Diagram name={guide.name} values={guide.values} spec={guide.diagram} />
    </section>
  )
}
