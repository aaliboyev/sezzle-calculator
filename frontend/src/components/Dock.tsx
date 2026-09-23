import type { ReactNode } from 'react'
import { useUi, type Panel } from '../store/ui'
import { HistoryIcon, KeypadIcon, LibraryIcon, ScatterIcon, SearchIcon } from './icons'
import './Dock.css'

function DockButton({
  label,
  expanded,
  onClick,
  children,
}: {
  label: string
  expanded: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="dock-button"
      aria-label={label}
      aria-expanded={expanded}
      // Keeps focus (and the caret) in the math-field.
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const PANELS: { panel: Exclude<Panel, 'none'>; label: string; icon: ReactNode }[] = [
  { panel: 'search', label: 'search', icon: <SearchIcon /> },
  { panel: 'formulas', label: 'formula library', icon: <LibraryIcon /> },
  { panel: 'history', label: 'toggle history', icon: <HistoryIcon /> },
  { panel: 'keypad', label: 'toggle keypad', icon: <KeypadIcon /> },
]

export function Dock() {
  const panel = useUi((s) => s.panel)
  const examplesOpen = useUi((s) => s.examplesOpen)
  const { togglePanel, toggleExamples } = useUi.getState()
  return (
    <div className="dock">
      <DockButton label="scatter examples" expanded={examplesOpen} onClick={toggleExamples}>
        <ScatterIcon />
      </DockButton>
      {PANELS.map((p) => (
        <DockButton key={p.panel} label={p.label} expanded={panel === p.panel} onClick={() => togglePanel(p.panel)}>
          {p.icon}
        </DockButton>
      ))}
    </div>
  )
}
