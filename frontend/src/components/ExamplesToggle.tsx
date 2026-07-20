import { useCalculator } from '../store/calculator'

export function ExamplesToggle() {
  const open = useCalculator((s) => s.examplesOpen)
  const toggleExamples = useCalculator((s) => s.toggleExamples)
  return (
    <button
      type="button"
      className="dock-toggle"
      aria-label="scatter examples"
      aria-expanded={open}
      onPointerDown={(e) => e.preventDefault()}
      onClick={toggleExamples}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="6" r="2" />
        <circle cx="16" cy="4" r="1.6" />
        <circle cx="18" cy="15" r="2" />
        <circle cx="7" cy="17" r="1.6" />
        <circle cx="12" cy="10.5" r="1.2" />
      </svg>
    </button>
  )
}
