import { useCalculator } from '../store/calculator'

export function PadToggle() {
  const padOpen = useCalculator((s) => s.padOpen)
  const togglePad = useCalculator((s) => s.togglePad)
  return (
    <button
      type="button"
      className="pad-toggle"
      aria-label="toggle keypad"
      aria-expanded={padOpen}
      onPointerDown={(e) => e.preventDefault()}
      onClick={togglePad}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden="true">
        {[3, 11, 19].flatMap((y) =>
          [3, 11, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />),
        )}
      </svg>
    </button>
  )
}
