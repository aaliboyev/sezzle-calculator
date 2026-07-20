import { useCalculator } from '../store/calculator'

export function FormulasToggle() {
  const open = useCalculator((s) => s.panel === 'formulas')
  const togglePanel = useCalculator((s) => s.togglePanel)
  return (
    <button
      type="button"
      className="dock-toggle"
      aria-label="formula library"
      aria-expanded={open}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => togglePanel('formulas')}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 3.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H6.5A2.5 2.5 0 0 1 4 16V3.5Z" strokeLinejoin="round" />
        <path d="M4 16a2.5 2.5 0 0 1 2.5-2.5h11" />
        <path d="M8 7.5h6" strokeLinecap="round" />
      </svg>
    </button>
  )
}
