import { useMemo, type CSSProperties } from 'react'
import { convertLatexToMarkup } from 'mathlive'
import { sampleFormulas } from '../engine/formulas'
import { scatterPositions } from '../lib/scatter'
import { useCalculator } from '../store/calculator'

const CARD_COUNT = 8

export function Examples() {
  const open = useCalculator((s) => s.examplesOpen)
  const seed = useCalculator((s) => s.scatterSeed)
  const setFormula = useCalculator((s) => s.setFormula)
  const cards = useMemo(() => {
    const positions = scatterPositions(seed, CARD_COUNT)
    return sampleFormulas(seed, CARD_COUNT).map((formula, i) => ({ formula, position: positions[i] }))
  }, [seed])
  if (!open) return null
  return (
    <aside className="examples" aria-label="example formulas">
      {cards.map(({ formula, position }, i) => (
        <button
          key={formula.name}
          type="button"
          className={`example cat-${formula.category}`}
          title={formula.about}
          style={
            {
              top: `${position.top}%`,
              left: `${position.left}%`,
              viewTransitionName: `example-${i}`,
              '--tilt': `${position.tilt}deg`,
              '--drift-dur': `${position.driftDuration}s`,
              '--drift-delay': `${position.driftDelay}s`,
            } as CSSProperties
          }
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setFormula(formula.latex)}
        >
          <span className="example-name">{formula.name}</span>
          {/* Markup is MathLive's converter over the catalog constants. */}
          <span
            className="example-formula"
            dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(formula.latex) }}
          />
        </button>
      ))}
    </aside>
  )
}
