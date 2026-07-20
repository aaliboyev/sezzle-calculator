import { useMathField } from '../hooks/useMathField'
import { GuidePanel } from './GuidePanel'
import { Outcome } from './Outcome'

export function Display() {
  const fieldRef = useMathField()
  return (
    <div className="stage">
      <math-field ref={fieldRef} aria-label="expression" />
      <Outcome />
      <GuidePanel />
    </div>
  )
}
