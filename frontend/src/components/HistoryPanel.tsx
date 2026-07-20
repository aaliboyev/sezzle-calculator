import { convertLatexToMarkup } from 'mathlive'
import { useCalculator } from '../store/calculator'
import { Sheet } from './Sheet'

export function HistoryPanel() {
  const open = useCalculator((s) => s.panel === 'history')
  const history = useCalculator((s) => s.history)
  const recall = useCalculator((s) => s.recall)
  const clearHistory = useCalculator((s) => s.clearHistory)
  return (
    <Sheet open={open} className="history" aria-label="history" onPointerDown={(e) => e.preventDefault()}>
      {history.length === 0 ? (
        <p className="history-empty">no calculations yet</p>
      ) : (
        <>
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.hash}>
                <button type="button" className="history-entry" onClick={() => recall(entry.hash)}>
                  {/* Markup is MathLive's converter over LaTeX this client stored itself; no foreign HTML enters here. */}
                  <span
                    className="history-formula"
                    dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(entry.latex) }}
                  />
                  <span className="history-result">= {entry.result}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="history-clear" onClick={clearHistory}>
            clear history
          </button>
        </>
      )}
    </Sheet>
  )
}
