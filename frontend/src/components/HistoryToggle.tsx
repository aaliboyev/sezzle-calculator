import { useCalculator } from '../store/calculator'

export function HistoryToggle() {
  const open = useCalculator((s) => s.panel === 'history')
  const togglePanel = useCalculator((s) => s.togglePanel)
  return (
    <button
      type="button"
      className="dock-toggle"
      aria-label="toggle history"
      aria-expanded={open}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => togglePanel('history')}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8.5" />
        <path d="M11 6.5V11l3 2" strokeLinecap="round" />
      </svg>
    </button>
  )
}
