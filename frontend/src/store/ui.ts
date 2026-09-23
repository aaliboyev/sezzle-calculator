import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from './storage'

export type Panel = 'none' | 'keypad' | 'history' | 'formulas' | 'search'

type UiStore = {
  panel: Panel
  examplesOpen: boolean
  scatterSeed: number
  togglePanel: (panel: Exclude<Panel, 'none'>) => void
  closePanel: () => void
  toggleExamples: () => void
}

export const useUi = create<UiStore>()(
  persist(
    (set) => ({
      panel: 'none',
      examplesOpen: true,
      scatterSeed: 1,
      togglePanel: (panel) => set((s) => ({ panel: s.panel === panel ? 'none' : panel })),
      closePanel: () => set({ panel: 'none' }),
      // Reopening rescatters: a fresh seed rearranges the cards.
      toggleExamples: () =>
        set((s) =>
          s.examplesOpen ? { examplesOpen: false } : { examplesOpen: true, scatterSeed: s.scatterSeed + 1 },
        ),
    }),
    {
      name: 'calculator-ui',
      storage,
      partialize: (s) => ({ examplesOpen: s.examplesOpen }),
    },
  ),
)
