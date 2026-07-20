import { convertLatexToMarkup } from 'mathlive'
import { useCalculator } from '../store/calculator'

type Example = { name: string; hint: string; latex: string }

const EXAMPLES: Example[] = [
  {
    name: 'pythagoras',
    hint: 'hypotenuse of a 3-4 right triangle: powers nest inside the radical',
    latex: '\\sqrt{3^2+4^2}',
  },
  {
    name: 'compound growth',
    hint: '1000 at 4.5% for 10 periods: fractions and powers compose',
    latex: '1000\\cdot(1+\\frac{4.5}{100})^{10}',
  },
  {
    name: 'tip',
    hint: 'percent is postfix — 18% means 0.18',
    latex: '85\\cdot18\\%',
  },
  {
    name: 'float trap',
    hint: 'the classic 0.1+0.2: the API returns the honest float, the display rounds it',
    latex: '0.1+0.2',
  },
  {
    name: 'nested roots',
    hint: 'radicals compose: the fourth root of 16',
    latex: '\\sqrt{\\sqrt{16}}',
  },
  {
    name: 'power tower',
    hint: 'exponents associate right: 2^(3^2), not (2^3)^2',
    latex: '2^{3^2}',
  },
]

export function Examples() {
  const setFormula = useCalculator((s) => s.setFormula)
  return (
    <aside className="examples" aria-label="example formulas">
      {EXAMPLES.map((example) => (
        <button
          key={example.name}
          type="button"
          className="example"
          title={example.hint}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setFormula(example.latex)}
        >
          <span className="example-name">{example.name}</span>
          {/* Markup comes from MathLive's converter over the constants above. */}
          <span
            className="example-formula"
            dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(example.latex) }}
          />
        </button>
      ))}
    </aside>
  )
}
