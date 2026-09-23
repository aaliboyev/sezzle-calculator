import { CATEGORIES, FORMULAS, type Formula } from '../engine/formulas'
import { formatResult } from './format'
import type { HistoryEntry } from '../store/history'

export type SearchResult =
  | { kind: 'history'; key: string; entry: HistoryEntry }
  | { kind: 'formula'; key: string; formula: Formula }

const LIMIT = 12
const RECENT = 5

const categoryLabel = new Map(CATEGORIES.map((c) => [c.id, c.label]))

function formulaText(f: Formula): string {
  return `${f.name} ${f.about} ${categoryLabel.get(f.category)}`.toLowerCase()
}

// History matches on its LaTeX and its value, so "42" finds 6·7.
function historyText(e: HistoryEntry): string {
  return `${e.latex} ${formatResult(e.value)}`.toLowerCase()
}

// An empty query lists pinned and recent history, then the library.
export function search(query: string, history: HistoryEntry[]): SearchResult[] {
  const q = query.trim().toLowerCase()
  const entries = q
    ? history.filter((e) => historyText(e).includes(q))
    : history.filter((e, i) => e.pinned || i < RECENT)
  const formulas = q ? FORMULAS.filter((f) => formulaText(f).includes(q)) : FORMULAS
  return [
    ...entries.map((entry): SearchResult => ({ kind: 'history', key: `h-${entry.hash}`, entry })),
    ...formulas.map((formula): SearchResult => ({ kind: 'formula', key: `f-${formula.name}`, formula })),
  ].slice(0, LIMIT)
}
