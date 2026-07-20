import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { MathfieldElement } from 'mathlive'
import { matchGuide, type GuideMatch } from '../engine/guides'
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

export type Panel = 'none' | 'keypad' | 'history' | 'formulas'

type CalculatorStore = {
  field: MathfieldElement | null
  outcome: Outcome
  panel: Panel
  history: HistoryEntry[]
  guide: GuideMatch | null
  guideStale: boolean
  syncGuide: (latex: string) => void
  examplesOpen: boolean
  scatterSeed: number
  toggleExamples: () => void
  attachField: (field: MathfieldElement | null) => void
  clearOutcome: () => void
  submit: () => Promise<void>
  pressKey: (label: string, insert?: string) => void
  togglePanel: (panel: Exclude<Panel, 'none'>) => void
  setFormula: (latex: string) => void
  recall: (hash: string) => void
  clearHistory: () => void
}

const HISTORY_LIMIT = 50
const GUIDE_STALE_DELAY = 1000

// Guards against a slow response landing after a newer submit.
let submitSeq = 0
let staleTimer: ReturnType<typeof setTimeout> | undefined

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
      guide: null,
      guideStale: false,

      // Matches update the guide immediately; a broken pattern is debounced —
      // mid-edit states like "4." on the way to "4.6" never flash. Only a
      // pattern still broken after the debounce dims the panel as paused.
      syncGuide: (latex) => {
        const next = matchGuide(latex)
        const prev = get().guide
        clearTimeout(staleTimer)
        if (next) {
          const apply = () => set({ guide: next, guideStale: false })
          if (prev === null) withViewTransition(apply)
          else apply()
        } else if (!latex.trim()) {
          if (prev) withViewTransition(() => set({ guide: null, guideStale: false }))
        } else if (prev) {
          staleTimer = setTimeout(() => {
            if (get().guide && !get().guideStale) set({ guideStale: true })
          }, GUIDE_STALE_DELAY)
        }
      },

      examplesOpen: true,
      scatterSeed: 1,

      // Reopening rescatters: a fresh seed rearranges the cards.
      toggleExamples: () =>
        withViewTransition(() =>
          set((s) =>
            s.examplesOpen
              ? { examplesOpen: false }
              : { examplesOpen: true, scatterSeed: s.scatterSeed + 1 },
          ),
        ),

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
        const { field, submit, clearOutcome, syncGuide } = get()
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
        if (label !== '=') syncGuide(field.value)
        field.focus()
      },

      togglePanel: (panel) =>
        withViewTransition(() => set((s) => ({ panel: s.panel === panel ? 'none' : panel }))),

      setFormula: (latex) => {
        const { field } = get()
        if (!field) return
        withViewTransition(() => {
          field.value = latex
          set({ panel: 'none', outcome: null, guide: matchGuide(latex), guideStale: false })
        })
        field.focus()
      },

      recall: (hash) => {
        const entry = get().history.find((h) => h.hash === hash)
        if (entry) get().setFormula(entry.latex)
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'calculator',
      storage,
      partialize: (s) => ({ history: s.history, examplesOpen: s.examplesOpen }),
    },
  ),
)
