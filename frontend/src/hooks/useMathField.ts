import { useCallback } from 'react'
import { MathfieldElement } from 'mathlive'
import { useCalculator } from '../store/calculator'

// Fonts ship via mathlive/fonts.css (see main.tsx); block runtime fetching.
MathfieldElement.fontsDirectory = null
MathfieldElement.soundsDirectory = null

// Configures the math-field on mount and wires its events to the store.
// Returned as a ref callback; React 19 runs the returned cleanup on unmount.
export function useMathField() {
  const attachField = useCalculator((s) => s.attachField)
  const clearOutcome = useCalculator((s) => s.clearOutcome)
  const submit = useCalculator((s) => s.submit)

  return useCallback(
    (field: MathfieldElement | null) => {
      if (!field) return
      field.mathVirtualKeyboardPolicy = 'manual'
      field.menuItems = []
      field.focus()
      const onInput = () => clearOutcome()
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault()
          e.stopPropagation()
          void submit()
        }
      }
      field.addEventListener('input', onInput)
      field.addEventListener('keydown', onKeyDown, { capture: true })
      attachField(field)
      return () => {
        field.removeEventListener('input', onInput)
        field.removeEventListener('keydown', onKeyDown, { capture: true })
        attachField(null)
      }
    },
    [attachField, clearOutcome, submit],
  )
}
