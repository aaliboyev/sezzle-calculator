import { describe, expect, it } from 'vitest'
import { search } from './search'
import type { HistoryEntry } from '../store/history'

function entry(latex: string, value: number, pinned = false): HistoryEntry {
  return { hash: latex, latex, value, at: 0, pinned }
}

describe('search', () => {
  const history = [entry('7\\cdot6', 42), entry('1+1', 2, true)]

  it('finds formulas by name, description, and category', () => {
    const names = (q: string) =>
      search(q, []).flatMap((r) => (r.kind === 'formula' ? [r.formula.name] : []))
    expect(names('golden')).toContain('golden ratio')
    expect(names('HYPOTENUSE')).toContain('pythagoras')
    expect(names('edge cases').length).toBeGreaterThan(0)
  })

  it('finds history by latex and by value', () => {
    expect(search('42', history)[0]).toMatchObject({ kind: 'history', entry: { value: 42 } })
    expect(search('cdot', history)[0]).toMatchObject({ kind: 'history', entry: { latex: '7\\cdot6' } })
  })

  it('lists history before formulas and caps the list', () => {
    const results = search('', history)
    expect(results.slice(0, 2).map((r) => r.kind)).toEqual(['history', 'history'])
    expect(results).toHaveLength(12)
  })

  it('returns nothing for a query that matches nothing', () => {
    expect(search('zzzz', history)).toEqual([])
  })
})
