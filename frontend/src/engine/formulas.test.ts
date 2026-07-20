import { describe, expect, it } from 'vitest'
import { CATEGORIES, FORMULAS, sampleFormulas } from './formulas'
import { GUIDES } from './guides'
import { translateLatex } from './translate'

describe('the catalog', () => {
  it('has at least 30 formulas across all categories', () => {
    expect(FORMULAS.length).toBeGreaterThanOrEqual(30)
    for (const category of CATEGORIES) {
      expect(FORMULAS.some((f) => f.category === category.id)).toBe(true)
    }
  })

  it('has unique names and only known categories', () => {
    const names = FORMULAS.map((f) => f.name)
    expect(new Set(names).size).toBe(names.length)
    const known = new Set(CATEGORIES.map((c) => c.id))
    for (const f of FORMULAS) expect(known.has(f.category)).toBe(true)
  })

  it('every formula translates to the backend grammar', () => {
    for (const f of FORMULAS) {
      const t = translateLatex(f.latex)
      expect(t.kind, `${f.name}: ${JSON.stringify(t)}`).toBe('expression')
    }
  })

  it('every guided pattern has its showcase in the catalog', () => {
    const latexes = new Set(FORMULAS.map((f) => f.latex))
    for (const guide of GUIDES) {
      expect(latexes.has(guide.latex), guide.name).toBe(true)
    }
  })
})

describe('sampleFormulas', () => {
  it('is deterministic per seed and returns the requested count', () => {
    expect(sampleFormulas(3, 8)).toEqual(sampleFormulas(3, 8))
    expect(sampleFormulas(3, 8)).toHaveLength(8)
  })

  it('varies with the seed and never repeats an entry', () => {
    const a = sampleFormulas(1, 8).map((f) => f.name)
    const b = sampleFormulas(2, 8).map((f) => f.name)
    expect(a).not.toEqual(b)
    expect(new Set(a).size).toBe(8)
  })
})
