import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hash8 } from '../lib/hash'
import { storage } from './storage'

export type HistoryEntry = {
  hash: string
  latex: string
  value: number
  at: number
  pinned: boolean
}

type HistoryStore = {
  entries: HistoryEntry[]
  add: (latex: string, value: number) => void
  togglePin: (hash: string) => void
  clear: () => void
}

const UNPINNED_LIMIT = 50

// Pinned first, each group newest first; only unpinned entries age out.
function arrange(entries: HistoryEntry[]): HistoryEntry[] {
  const byTime = [...entries].sort((a, b) => b.at - a.at)
  const pinned = byTime.filter((e) => e.pinned)
  const unpinned = byTime.filter((e) => !e.pinned).slice(0, UNPINNED_LIMIT)
  return [...pinned, ...unpinned]
}

export function latestValue(entries: HistoryEntry[]): number | null {
  let latest: HistoryEntry | null = null
  for (const e of entries) if (!latest || e.at > latest.at) latest = e
  return latest?.value ?? null
}

type StoredV0 = { history?: { hash: string; latex: string; result: string; at: number }[] }

export const useHistory = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      add: (latex, value) =>
        set((s) => {
          const hash = hash8(latex)
          const pinned = s.entries.some((e) => e.hash === hash && e.pinned)
          const rest = s.entries.filter((e) => e.hash !== hash)
          return { entries: arrange([{ hash, latex, value, at: Date.now(), pinned }, ...rest]) }
        }),
      togglePin: (hash) =>
        set((s) => ({
          entries: arrange(s.entries.map((e) => (e.hash === hash ? { ...e, pinned: !e.pinned } : e))),
        })),
      clear: () => set((s) => ({ entries: s.entries.filter((e) => e.pinned) })),
    }),
    {
      // Same key as the earlier combined store, so existing history carries over.
      name: 'calculator',
      version: 1,
      storage,
      partialize: (s) => ({ entries: s.entries }),
      migrate: (stored, version) => {
        if (version >= 1) return stored as HistoryStore
        const old = (stored as StoredV0).history ?? []
        return {
          entries: old
            .map((e) => ({ hash: e.hash, latex: e.latex, value: Number(e.result), at: e.at, pinned: false }))
            .filter((e) => Number.isFinite(e.value)),
        } as unknown as HistoryStore
      },
    },
  ),
)
