import { useCalculator } from '../store/calculator'

export function PadToggle() {
  const open = useCalculator((s) => s.panel === 'keypad')
  const togglePanel = useCalculator((s) => s.togglePanel)
  return (
    <button
      type="button"
      className="dock-toggle"
      aria-label="toggle keypad"
      aria-expanded={open}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => togglePanel('keypad')}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden="true">
        {[3, 11, 19].flatMap((y) =>
          [3, 11, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />),
        )}
      </svg>
    </button>
  )
}
