import { create } from 'zustand'
import type { GuideMatch } from '../engine/guides'
import { editor } from '../editor/field'
import { evaluate, type Evaluation } from '../lib/api'
import { formatLatex } from '../lib/format'
import { shareHash } from '../lib/share'
import { latestValue, useHistory } from './history'
import { useUi } from './ui'

export type Committed = { kind: 'value'; value: number } | { kind: 'error'; message: string } | null

type CalculatorStore = {
  latex: string
  preview: number | null
  committed: Committed
  guide: GuideMatch | null
  guideStale: boolean
  edit: (latex: string) => void
  commit: () => Promise<void>
  load: (latex: string) => void
  press: (label: string, insert?: string) => void
  insertValue: (value: number) => void
}

const PREVIEW_DELAY = 150
const GUIDE_STALE_DELAY = 1000

let previewTimer: ReturnType<typeof setTimeout> | undefined
let staleTimer: ReturnType<typeof setTimeout> | undefined
// The evaluation for the latest latex, shared by the preview and a commit
// that lands before or during it.
let pending: { latex: string; result: Promise<Evaluation>; abort: AbortController } | null = null

export const useCalculator = create<CalculatorStore>()((set, get) => {
  function evaluateLatest(latex: string): Promise<Evaluation> {
    if (pending?.latex === latex) return pending.result
    pending?.abort.abort()
    const abort = new AbortController()
    pending = { latex, result: evaluate(latex, abort.signal), abort }
    return pending.result
  }

  // A match updates the guide at once; losing it only dims the guide after a
  // pause, so mid-edit states like "4." on the way to "4.6" never flash.
  function applyGuide(guide: GuideMatch | null) {
    clearTimeout(staleTimer)
    if (guide) {
      set({ guide, guideStale: false })
    } else if (get().guide) {
      staleTimer = setTimeout(() => {
        if (get().guide) set({ guideStale: true })
      }, GUIDE_STALE_DELAY)
    }
  }

  async function refreshPreview(latex: string) {
    const { outcome, guide } = await evaluateLatest(latex)
    if (get().latex !== latex) return
    applyGuide(guide)
    // Mid-edit errors are noise; the preview only ever shows a value.
    set({ preview: outcome.kind === 'value' ? outcome.value : null })
  }

  return {
    latex: '',
    preview: null,
    committed: null,
    guide: null,
    guideStale: false,

    edit: (latex) => {
      // MathLive fires input on keys that change nothing (Enter included).
      if (latex === get().latex) return
      clearTimeout(previewTimer)
      set({ latex, committed: null })
      if (!latex.trim()) {
        pending?.abort.abort()
        pending = null
        clearTimeout(staleTimer)
        set({ preview: null, guide: null, guideStale: false })
        return
      }
      previewTimer = setTimeout(() => void refreshPreview(latex), PREVIEW_DELAY)
    },

    commit: async () => {
      const latex = editor.read()
      if (!latex.trim()) return
      clearTimeout(previewTimer)
      set({ latex })
      const { outcome, guide } = await evaluateLatest(latex)
      if (get().latex !== latex) return
      applyGuide(guide)
      if (outcome.kind === 'error') {
        set({ committed: { kind: 'error', message: outcome.message }, preview: null })
      } else if (outcome.kind === 'value') {
        set({ committed: { kind: 'value', value: outcome.value }, preview: null })
        useHistory.getState().add(latex, outcome.value)
        globalThis.history?.replaceState(null, '', shareHash(latex))
      }
    },

    // Formula cards, history, search, and share links: replace the whole
    // expression and evaluate without waiting for the preview delay.
    load: (latex) => {
      editor.write(latex)
      clearTimeout(previewTimer)
      set({ latex, committed: null, preview: null })
      useUi.getState().closePanel()
      editor.focus()
      void refreshPreview(latex)
    },

    press: (label, insert) => {
      if (label === '=') {
        void get().commit()
      } else {
        if (label === 'AC') editor.write('')
        else if (label === '⌫') editor.deleteBackward()
        else if (label === 'ans') {
          const value = latestValue(useHistory.getState().entries)
          if (value !== null) get().insertValue(value)
        } else editor.insert(insert ?? label)
        get().edit(editor.read())
      }
      editor.focus()
    },

    insertValue: (value) => {
      editor.insert(value < 0 ? `(${formatLatex(value)})` : formatLatex(value))
      get().edit(editor.read())
      editor.focus()
    },
  }
})
