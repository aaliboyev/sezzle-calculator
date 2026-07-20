import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { calculate } from './lib/api'
import { formatResult } from './lib/format'
import { backspace, balanceParens, closeParen, insertText, sanitizeExpression } from './lib/input'
import './App.css'

type Outcome =
  | { kind: 'result'; text: string }
  | { kind: 'error'; message: string }
  | null

function withViewTransition(update: () => void) {
  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(() => flushSync(update))
  } else {
    update()
  }
}

type Key = { label: string; insert?: string; cursorOffset?: number; span?: number; variant?: string }

const KEYS: Key[] = [
  { label: 'AC', variant: 'action' },
  { label: '(' },
  { label: ')' },
  { label: '⌫', variant: 'action' },
  { label: '÷', insert: '/', variant: 'op' },
  { label: '7' },
  { label: '8' },
  { label: '9' },
  { label: '√', insert: '√()', cursorOffset: -1, variant: 'op' },
  { label: '×', insert: '*', variant: 'op' },
  { label: '4' },
  { label: '5' },
  { label: '6' },
  { label: '^', variant: 'op' },
  { label: '−', insert: '-', variant: 'op' },
  { label: '1' },
  { label: '2' },
  { label: '3' },
  { label: '%', variant: 'op' },
  { label: '+', variant: 'op' },
  { label: '0', span: 2 },
  { label: '.' },
  { label: '=', span: 2, variant: 'equals' },
]

export default function App() {
  const [expression, setExpression] = useState('')
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [padOpen, setPadOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCursor = useRef<number | null>(null)
  const requestSeq = useRef(0)

  useEffect(() => {
    if (pendingCursor.current !== null) {
      inputRef.current?.setSelectionRange(pendingCursor.current, pendingCursor.current)
      pendingCursor.current = null
    }
  }, [expression])

  async function submit(expr: string) {
    const trimmed = balanceParens(expr.trim())
    if (!trimmed) return
    setExpression(trimmed)
    const seq = ++requestSeq.current
    const res = await calculate(trimmed)
    if (seq !== requestSeq.current) return
    withViewTransition(() => {
      setOutcome(
        res.ok
          ? { kind: 'result', text: formatResult(res.result) }
          : { kind: 'error', message: res.message },
      )
    })
  }

  function edit(value: string, cursor: number) {
    setExpression(value)
    setOutcome(null)
    pendingCursor.current = cursor
    inputRef.current?.focus()
  }

  function pressKey(key: Key) {
    const input = inputRef.current
    const start = input?.selectionStart ?? expression.length
    const end = input?.selectionEnd ?? expression.length
    if (key.label === 'AC') {
      edit('', 0)
    } else if (key.label === '⌫') {
      const r = backspace(expression, start, end)
      edit(r.value, r.cursor)
    } else if (key.label === '=') {
      void submit(expression)
    } else if (key.label === ')') {
      const r = closeParen(expression, start, end)
      edit(r.value, r.cursor)
    } else {
      const r = insertText(expression, start, end, key.insert ?? key.label)
      edit(r.value, r.cursor + (key.cursorOffset ?? 0))
    }
  }

  return (
    <main className="app">
      <div className="stage">
        <input
          ref={inputRef}
          className="display"
          aria-label="expression"
          placeholder="0"
          value={expression}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setExpression(sanitizeExpression(e.target.value))
            setOutcome(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === '=') {
              e.preventDefault()
              void submit(expression)
            } else if (e.key === ')') {
              const el = e.currentTarget
              const pos = el.selectionStart
              if (pos !== null && pos === el.selectionEnd && expression[pos] === ')') {
                e.preventDefault()
                el.setSelectionRange(pos + 1, pos + 1)
              }
            }
          }}
        />
        <div className="outcome">
          {outcome?.kind === 'result' && <output className="result">{outcome.text}</output>}
          {outcome?.kind === 'error' && (
            <div role="alert" className="error">
              {outcome.message}
            </div>
          )}
        </div>
      </div>

      {padOpen && (
        <div className="keypad" onPointerDown={(e) => e.preventDefault()}>
          {KEYS.map((key) => (
            <button
              key={key.label}
              type="button"
              className={`key ${key.variant ?? ''}`}
              style={key.span ? { gridColumn: `span ${key.span}` } : undefined}
              onClick={() => pressKey(key)}
            >
              {key.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="pad-toggle"
        aria-label="toggle keypad"
        aria-expanded={padOpen}
        onClick={() => withViewTransition(() => setPadOpen((open) => !open))}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden="true">
          {[3, 11, 19].flatMap((y) =>
            [3, 11, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />),
          )}
        </svg>
      </button>
    </main>
  )
}
