import { Display } from './components/Display'
import { Keypad } from './components/Keypad'
import { PadToggle } from './components/PadToggle'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <Display />
      <Keypad />
      <PadToggle />
    </main>
  )
}
