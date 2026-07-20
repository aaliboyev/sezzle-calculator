import { Display } from './components/Display'
import { Examples } from './components/Examples'
import { ExamplesToggle } from './components/ExamplesToggle'
import { HistoryPanel } from './components/HistoryPanel'
import { HistoryToggle } from './components/HistoryToggle'
import { Keypad } from './components/Keypad'
import { PadToggle } from './components/PadToggle'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <Examples />
      <Display />
      <Keypad />
      <HistoryPanel />
      <div className="dock">
        <ExamplesToggle />
        <HistoryToggle />
        <PadToggle />
      </div>
    </main>
  )
}
