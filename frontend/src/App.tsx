import { Display } from './components/Display'
import { HistoryPanel } from './components/HistoryPanel'
import { HistoryToggle } from './components/HistoryToggle'
import { Keypad } from './components/Keypad'
import { PadToggle } from './components/PadToggle'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <Display />
      <Keypad />
      <HistoryPanel />
      <div className="dock">
        <HistoryToggle />
        <PadToggle />
      </div>
    </main>
  )
}
