import { useCalculator } from '../store/calculator'
import { Sheet } from './Sheet'

type Key = { label: string; insert?: string; span?: number; variant?: string }

const KEYS: Key[] = [
  { label: 'AC', variant: 'action' },
  { label: '(' },
  { label: ')' },
  { label: '⌫', variant: 'action' },
  { label: '÷', insert: '\\div', variant: 'op' },
  { label: '7' },
  { label: '8' },
  { label: '9' },
  { label: '√', insert: '\\sqrt{#0}', variant: 'op' },
  { label: '×', insert: '\\times', variant: 'op' },
  { label: '4' },
  { label: '5' },
  { label: '6' },
  { label: '^', insert: '^{#0}', variant: 'op' },
  { label: '−', insert: '-', variant: 'op' },
  { label: '1' },
  { label: '2' },
  { label: '3' },
  { label: '%', insert: '\\%', variant: 'op' },
  { label: '+', variant: 'op' },
  { label: '0', span: 2 },
  { label: '.' },
  { label: '=', span: 2, variant: 'equals' },
]

export function Keypad() {
  const open = useCalculator((s) => s.panel === 'keypad')
  const pressKey = useCalculator((s) => s.pressKey)
  return (
    <Sheet open={open} className="keypad" onPointerDown={(e) => e.preventDefault()}>
      {KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          className={`key ${key.variant ?? ''}`}
          style={key.span ? { gridColumn: `span ${key.span}` } : undefined}
          onClick={() => pressKey(key.label, key.insert)}
        >
          {key.label}
        </button>
      ))}
    </Sheet>
  )
}
