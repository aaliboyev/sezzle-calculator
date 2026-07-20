import { useCalculator } from '../store/calculator'

export function Outcome() {
  const outcome = useCalculator((s) => s.outcome)
  return (
    <div className="outcome">
      {outcome?.kind === 'result' && (
        <output className="result" aria-label="result">
          {outcome.text}
        </output>
      )}
      {outcome?.kind === 'error' && (
        <div role="alert" className="error">
          {outcome.message}
        </div>
      )}
    </div>
  )
}
