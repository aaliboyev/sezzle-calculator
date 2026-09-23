import { useMemo, useState, type KeyboardEvent } from 'react'
import { convertLatexToMarkup } from 'mathlive'
import { formatResult } from '../lib/format'
import { search, type SearchResult } from '../lib/search'
import { useCalculator } from '../store/calculator'
import { useHistory } from '../store/history'
import { useUi } from '../store/ui'
import { Sheet } from './Sheet'
import './SearchPanel.css'

function resultLatex(result: SearchResult): string {
  return result.kind === 'history' ? result.entry.latex : result.formula.latex
}

function ResultRow({ result }: { result: SearchResult }) {
  const markup = { __html: convertLatexToMarkup(resultLatex(result)) }
  if (result.kind === 'history') {
    return (
      <>
        <span className="search-tag">{result.entry.pinned ? 'pinned' : 'history'}</span>
        {/* Markup is MathLive's converter over LaTeX this client stored itself. */}
        <span className="search-math" dangerouslySetInnerHTML={markup} />
        <span className="search-value">= {formatResult(result.entry.value)}</span>
      </>
    )
  }
  return (
    <>
      <span className={`search-tag cat-${result.formula.category}`}>{result.formula.name}</span>
      {/* Markup is MathLive's converter over the catalog constants. */}
      <span className="search-math" dangerouslySetInnerHTML={markup} />
    </>
  )
}

function SearchBox() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const entries = useHistory((s) => s.entries)
  const results = useMemo(() => search(query, entries), [query, entries])
  const load = useCalculator((s) => s.load)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      load(resultLatex(results[active]))
    }
  }

  return (
    <>
      <input
        className="search-input"
        type="search"
        placeholder="search formulas and history"
        aria-label="search formulas and history"
        role="combobox"
        aria-expanded="true"
        aria-controls="search-results"
        aria-activedescendant={results[active] ? `search-${results[active].key}` : undefined}
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      {results.length === 0 ? (
        <p className="search-empty">nothing matches</p>
      ) : (
        <ul id="search-results" className="search-results" role="listbox" aria-label="results">
          {results.map((result, i) => (
            <li
              key={result.key}
              id={`search-${result.key}`}
              role="option"
              aria-selected={i === active}
              className="search-result"
              onPointerEnter={() => setActive(i)}
              onClick={() => load(resultLatex(result))}
            >
              <ResultRow result={result} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function SearchPanel() {
  const open = useUi((s) => s.panel === 'search')
  return (
    <Sheet open={open} className="search" aria-label="search">
      <SearchBox />
    </Sheet>
  )
}
