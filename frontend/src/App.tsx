import { useEffect } from 'react'
import { Display } from './components/Display'
import { Dock } from './components/Dock'
import { Examples } from './components/Examples'
import { FormulasPanel } from './components/FormulasPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { Keypad } from './components/Keypad'
import { SearchPanel } from './components/SearchPanel'
import { editor } from './editor/field'
import { readSharedLatex } from './lib/share'
import { useCalculator } from './store/calculator'
import { useUi } from './store/ui'
import './App.css'

// Capture phase: the math-field swallows keys once they reach it.
function onGlobalKeyDown(e: KeyboardEvent) {
  const ui = useUi.getState()
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    e.stopPropagation()
    ui.togglePanel('search')
    if (ui.panel === 'search') editor.focus()
  } else if (e.key === 'Escape' && ui.panel !== 'none') {
    ui.closePanel()
    editor.focus()
  }
}

export default function App() {
  useEffect(() => {
    const shared = readSharedLatex(location.hash)
    if (shared) useCalculator.getState().load(shared)
    window.addEventListener('keydown', onGlobalKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onGlobalKeyDown, { capture: true })
  }, [])

  return (
    <main className="app">
      <Examples />
      <Display />
      <Keypad />
      <HistoryPanel />
      <FormulasPanel />
      <SearchPanel />
      <Dock />
    </main>
  )
}
