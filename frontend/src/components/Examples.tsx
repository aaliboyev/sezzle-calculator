import { useMemo, type CSSProperties } from 'react'
import { convertLatexToMarkup } from 'mathlive'
import { scatterPositions, type ScatterSlot } from '../lib/scatter'
import { useCalculator } from '../store/calculator'

type Example = { name: string; about: string; latex: string }

const EXAMPLES: Example[] = [
  {
    name: 'pythagoras',
    about: 'The hypotenuse of a 3-4 right triangle. Powers nest inside the radical and resolve before the root.',
    latex: '\\sqrt{3^2+4^2}',
  },
  {
    name: 'compound growth',
    about: '1000 growing at 4.5% over 10 periods. The fraction and the power compose exactly like the textbook formula.',
    latex: '1000\\cdot(1+\\frac{4.5}{100})^{10}',
  },
  {
    name: 'tip',
    about: 'An 18% tip on an 85 bill. Percent is postfix — writing 18% means 0.18.',
    latex: '85\\cdot18\\%',
  },
  {
    name: 'float trap',
    about: 'The classic 0.1 + 0.2. The API returns the honest float; the display rounds the noise away.',
    latex: '0.1+0.2',
  },
  {
    name: 'nested roots',
    about: 'A root inside a root — the fourth root of 16. Radicals compose like any other expression.',
    latex: '\\sqrt{\\sqrt{16}}',
  },
  {
    name: 'power tower',
    about: 'Exponents associate to the right: 2^(3²) is 2⁹ = 512, not (2³)² = 64.',
    latex: '2^{3^2}',
  },
]

const SLOTS: ScatterSlot[] = [
  { top: 14, left: 10 },
  { top: 42, left: 6 },
  { top: 68, left: 11 },
  { top: 13, right: 10 },
  { top: 43, right: 6 },
  { top: 69, right: 11 },
]

export function Examples() {
  const open = useCalculator((s) => s.examplesOpen)
  const seed = useCalculator((s) => s.scatterSeed)
  const setFormula = useCalculator((s) => s.setFormula)
  const positions = useMemo(() => scatterPositions(seed, SLOTS), [seed])
  if (!open) return null
  return (
    <aside className="examples" aria-label="example formulas">
      {EXAMPLES.map((example, i) => {
        const p = positions[i]
        return (
          <button
            key={example.name}
            type="button"
            className="example"
            style={
              {
                top: `${p.top}%`,
                left: p.left !== undefined ? `${p.left}%` : undefined,
                right: p.right !== undefined ? `${p.right}%` : undefined,
                viewTransitionName: `example-${i}`,
                '--tilt': `${p.tilt}deg`,
                '--drift-dur': `${p.driftDuration}s`,
                '--drift-delay': `${p.driftDelay}s`,
              } as CSSProperties
            }
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setFormula(example.latex)}
          >
            <span className="example-name">{example.name}</span>
            {/* Markup comes from MathLive's converter over the constants above. */}
            <span
              className="example-formula"
              dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(example.latex) }}
            />
            <span className="example-about">{example.about}</span>
          </button>
        )
      })}
    </aside>
  )
}
