import { useCallback } from 'react'
import { MathfieldElement } from 'mathlive'
import { editor } from '../editor/field'
import { useCalculator } from '../store/calculator'
import { useUi } from '../store/ui'
import './MathField.css'

// Fonts ship via mathlive/fonts.css (see main.tsx); block runtime fetching.
MathfieldElement.fontsDirectory = null
MathfieldElement.soundsDirectory = null

export function MathField() {
  // Ref callback: React 19 runs the returned cleanup on unmount.
  const attach = useCallback((field: MathfieldElement | null) => {
    if (!field) return
    field.mathVirtualKeyboardPolicy = 'manual'
    field.menuItems = []
    const { edit, commit } = useCalculator.getState()
    const onInput = () => edit(field.value)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        e.stopPropagation()
        void commit()
      }
    }
    // MathLive suppresses the native keyboard; on touch devices the app's
    // own keypad opens with the field instead.
    const onFocusIn = () => {
      const ui = useUi.getState()
      if (matchMedia('(pointer: coarse)').matches && ui.panel === 'none') ui.togglePanel('keypad')
    }
    field.addEventListener('input', onInput)
    field.addEventListener('keydown', onKeyDown, { capture: true })
    field.addEventListener('focusin', onFocusIn)
    editor.attach(field)
    field.focus()
    return () => {
      field.removeEventListener('input', onInput)
      field.removeEventListener('keydown', onKeyDown, { capture: true })
      field.removeEventListener('focusin', onFocusIn)
      editor.attach(null)
    }
  }, [])
  return <math-field ref={attach} aria-label="expression" />
}
