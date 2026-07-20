import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { MathfieldElement } from 'mathlive'
import { translateLatex } from '../engine/translate'
import { calculate } from '../lib/api'
import { formatResult } from '../lib/format'
import { hash8 } from '../lib/hash'
import { withViewTransition } from '../lib/view-transition'

export type Outcome =
  | { kind: 'result'; text: string }
  | { kind: 'error'; message: string }
  | null

export type HistoryEntry = {
  hash: string
  latex: string
  result: string
  at: number
}

export type Panel = 'none' | 'keypad' | 'history'

type CalculatorStore = {
  field: MathfieldElement | null
  outcome: Outcome
  panel: Panel
  history: HistoryEntry[]
  attachField: (field: MathfieldElement | null) => void
  clearOutcome: () => void
  submit: () => Promise<void>
  pressKey: (label: string, insert?: string) => void
  togglePanel: (panel: Exclude<Panel, 'none'>) => void
  recall: (hash: string) => void
  clearHistory: () => void
}

const HISTORY_LIMIT = 50

// Guards against a slow response landing after a newer submit.
let submitSeq = 0

const memory = new Map<string, string>()
const storage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? window.localStorage
    : {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => void memory.set(key, value),
        removeItem: (key: string) => void memory.delete(key),
      },
)

export const useCalculator = create<CalculatorStore>()(
  persist(
    (set, get) => ({
      field: null,
      outcome: null,
      panel: 'none',
      history: [],

      attachField: (field) => set({ field }),

      clearOutcome: () => set({ outcome: null }),

      submit: async () => {
        const { field } = get()
        if (!field) return
        const latex = field.value
        const translation = translateLatex(latex)
        if (translation.kind === 'empty') return
        if (translation.kind === 'error') {
          withViewTransition(() =>
            set({ outcome: { kind: 'error', message: translation.message } }),
          )
          return
        }
        const seq = ++submitSeq
        const res = await calculate(translation.expression)
        if (seq !== submitSeq) return
        withViewTransition(() => {
          if (!res.ok) {
            set({ outcome: { kind: 'error', message: res.message } })
            return
          }
          const entry = { hash: hash8(latex), latex, result: formatResult(res.result), at: Date.now() }
          set((s) => ({
            outcome: { kind: 'result', text: entry.result },
            history: [entry, ...s.history.filter((h) => h.hash !== entry.hash)].slice(0, HISTORY_LIMIT),
          }))
        })
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

      togglePanel: (panel) =>
        withViewTransition(() => set((s) => ({ panel: s.panel === panel ? 'none' : panel }))),

      recall: (hash) => {
        const { field, history } = get()
        const entry = history.find((h) => h.hash === hash)
        if (!field || !entry) return
        withViewTransition(() => {
          field.value = entry.latex
          set({ panel: 'none', outcome: null })
        })
        field.focus()
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'calculator',
      storage,
      partialize: (s) => ({ history: s.history }),
    },
  ),
)
