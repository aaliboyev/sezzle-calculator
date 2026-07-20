import { convertLatexToMarkup } from 'mathlive'
import { CATEGORIES, FORMULAS } from '../engine/formulas'
import { useCalculator } from '../store/calculator'
import { Sheet } from './Sheet'

export function FormulasPanel() {
  const open = useCalculator((s) => s.panel === 'formulas')
  const setFormula = useCalculator((s) => s.setFormula)
  return (
    <Sheet open={open} className="formulas" aria-label="formula library" onPointerDown={(e) => e.preventDefault()}>
      {CATEGORIES.map((category) => (
        <section key={category.id} className={`formula-group cat-${category.id}`}>
          <h3 className="formula-category">{category.label}</h3>
          <div className="formula-grid">
            {FORMULAS.filter((f) => f.category === category.id).map((formula) => (
              <button
                key={formula.name}
                type="button"
                className="formula-entry"
                title={formula.about}
                onClick={() => setFormula(formula.latex)}
              >
                <span className="formula-name">{formula.name}</span>
                {/* Markup is MathLive's converter over the catalog constants. */}
                <span
                  className="formula-math"
                  dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(formula.latex) }}
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </Sheet>
  )
}
