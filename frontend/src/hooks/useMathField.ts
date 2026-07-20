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
  const syncGuide = useCalculator((s) => s.syncGuide)
  const submit = useCalculator((s) => s.submit)
  const togglePanel = useCalculator((s) => s.togglePanel)

  return useCallback(
    (field: MathfieldElement | null) => {
      if (!field) return
      field.mathVirtualKeyboardPolicy = 'manual'
      field.menuItems = []
      field.focus()
      const onInput = () => {
        clearOutcome()
        syncGuide(field.value)
      }
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault()
          e.stopPropagation()
          void submit()
        }
      }
      // MathLive suppresses the native keyboard; on touch devices the app's
      // own keypad opens with the field instead.
      const onFocusIn = () => {
        if (matchMedia('(pointer: coarse)').matches && useCalculator.getState().panel === 'none') {
          togglePanel('keypad')
        }
      }
      field.addEventListener('input', onInput)
      field.addEventListener('keydown', onKeyDown, { capture: true })
      field.addEventListener('focusin', onFocusIn)
      attachField(field)
      return () => {
        field.removeEventListener('input', onInput)
        field.removeEventListener('keydown', onKeyDown, { capture: true })
        field.removeEventListener('focusin', onFocusIn)
        attachField(null)
      }
    },
    [attachField, clearOutcome, syncGuide, submit, togglePanel],
  )
}
