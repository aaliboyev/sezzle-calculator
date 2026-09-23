import { convertLatexToMarkup } from 'mathlive'
import { formatResult } from '../lib/format'
import { useCalculator } from '../store/calculator'
import { useHistory } from '../store/history'
import { useUi } from '../store/ui'
import { InsertIcon, PinIcon } from './icons'
import { Sheet } from './Sheet'
import './HistoryPanel.css'

export function HistoryPanel() {
  const open = useUi((s) => s.panel === 'history')
  const entries = useHistory((s) => s.entries)
  const { togglePin, clear } = useHistory.getState()
  const { load, insertValue } = useCalculator.getState()
  const hasUnpinned = entries.some((e) => !e.pinned)
  return (
    <Sheet open={open} className="history" aria-label="history" onPointerDown={(e) => e.preventDefault()}>
      {entries.length === 0 ? (
        <p className="history-empty">no calculations yet</p>
      ) : (
        <>
          <ul className="history-list">
            {entries.map((entry) => (
              <li key={entry.hash} className={entry.pinned ? 'history-row pinned' : 'history-row'}>
                <button type="button" className="history-entry" onClick={() => load(entry.latex)}>
                  {/* Markup is MathLive's converter over LaTeX this client stored itself; no foreign HTML enters here. */}
                  <span
                    className="history-formula"
                    dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(entry.latex) }}
                  />
                  <span className="history-result">= {formatResult(entry.value)}</span>
                </button>
                <button
                  type="button"
                  className="history-action"
                  aria-label="insert value"
                  title="insert value"
                  onClick={() => insertValue(entry.value)}
                >
                  <InsertIcon />
                </button>
                <button
                  type="button"
                  className="history-action"
                  aria-label={entry.pinned ? 'unpin' : 'pin'}
                  aria-pressed={entry.pinned}
                  title={entry.pinned ? 'unpin' : 'pin'}
                  onClick={() => togglePin(entry.hash)}
                >
                  <PinIcon filled={entry.pinned} />
                </button>
              </li>
            ))}
          </ul>
          {hasUnpinned && (
            <button type="button" className="history-clear" onClick={clear}>
              clear history
            </button>
          )}
        </>
      )}
    </Sheet>
  )
}
