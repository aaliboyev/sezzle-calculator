import { create } from 'zustand'
import type { MathfieldElement } from 'mathlive'
import { translateLatex } from '../engine/translate'
import { calculate } from '../lib/api'
import { formatResult } from '../lib/format'
import { withViewTransition } from '../lib/view-transition'

export type Outcome =
  | { kind: 'result'; text: string }
  | { kind: 'error'; message: string }
  | null

type CalculatorStore = {
  field: MathfieldElement | null
  outcome: Outcome
  padOpen: boolean
  attachField: (field: MathfieldElement | null) => void
  clearOutcome: () => void
  submit: () => Promise<void>
  pressKey: (label: string, insert?: string) => void
  togglePad: () => void
}

// Guards against a slow response landing after a newer submit.
let submitSeq = 0

export const useCalculator = create<CalculatorStore>()((set, get) => ({
  field: null,
  outcome: null,
  padOpen: false,

  attachField: (field) => set({ field }),

  clearOutcome: () => set({ outcome: null }),

  submit: async () => {
    const { field } = get()
    if (!field) return
    const translation = translateLatex(field.value)
    if (translation.kind === 'empty') return
    if (translation.kind === 'error') {
      withViewTransition(() => set({ outcome: { kind: 'error', message: translation.message } }))
      return
    }
    const seq = ++submitSeq
    const res = await calculate(translation.expression)
    if (seq !== submitSeq) return
    withViewTransition(() =>
      set({
        outcome: res.ok
          ? { kind: 'result', text: formatResult(res.result) }
          : { kind: 'error', message: res.message },
      }),
    )
  },

  pressKey: (label, insert) => {
    const { field, submit, clearOutcome } = get()
    if (!field) return
    if (label === '=') {
      void submit()
    } else if (label === 'AC') {
      field.value = ''
      clearOutcome()
    } else if (label === '⌫') {
      field.executeCommand('deleteBackward')
      clearOutcome()
    } else {
      field.executeCommand(['insert', insert ?? label])
      clearOutcome()
    }
    field.focus()
  },

  togglePad: () => withViewTransition(() => set((s) => ({ padOpen: !s.padOpen }))),
}))
