import { useMathField } from '../hooks/useMathField'
import { Outcome } from './Outcome'

export function Display() {
  const fieldRef = useMathField()
  return (
    <div className="stage">
      <math-field ref={fieldRef} aria-label="expression" />
      <Outcome />
    </div>
  )
}
