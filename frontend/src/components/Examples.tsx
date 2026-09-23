import { useMemo, type CSSProperties } from 'react'
import { convertLatexToMarkup } from 'mathlive'
import { sampleFormulas } from '../engine/formulas'
import { scatterPositions } from '../lib/scatter'
import { useCalculator } from '../store/calculator'
import { useUi } from '../store/ui'
import './Examples.css'

const CARD_COUNT = 8

export function Examples() {
  const open = useUi((s) => s.examplesOpen)
  const seed = useUi((s) => s.scatterSeed)
  const load = useCalculator((s) => s.load)
  const cards = useMemo(() => {
    const positions = scatterPositions(seed, CARD_COUNT)
    return sampleFormulas(seed, CARD_COUNT).map((formula, i) => ({ formula, position: positions[i] }))
  }, [seed])
  if (!open) return null
  return (
    <aside className="examples" aria-label="example formulas">
      {cards.map(({ formula, position }) => (
        <button
          key={formula.name}
          type="button"
          className={`example cat-${formula.category}`}
          title={formula.about}
          style={
            {
              top: `${position.top}%`,
              left: `${position.left}%`,
              '--tilt': `${position.tilt}deg`,
              '--drift-dur': `${position.driftDuration}s`,
              '--drift-delay': `${position.driftDelay}s`,
            } as CSSProperties
          }
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => load(formula.latex)}
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
