import { GuidePanel } from './GuidePanel'
import { MathField } from './MathField'
import { Outcome } from './Outcome'

export function Display() {
  return (
    <div className="stage">
      <MathField />
      <Outcome />
      <GuidePanel />
    </div>
  )
}
