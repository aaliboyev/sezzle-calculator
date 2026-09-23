import { describe, expect, it } from 'vitest'
import { treeOf } from '../test/server'
import { GUIDES, matchGuide } from './guides'

const match = (latex: string) => matchGuide(treeOf(latex), latex)

describe('every guide matches its own showcase latex', () => {
  for (const guide of GUIDES) {
    it(guide.name, () => {
      const found = match(guide.latex)
      expect(found?.name).toBe(guide.name)
      expect(found!.steps.length).toBeGreaterThan(0)
    })
  }
})

describe('digits are free, structure is held', () => {
  it('pythagoras rebinds to new legs', () => {
    const found = match('\\sqrt{5^2+12^2}')
    expect(found?.name).toBe('pythagoras')
    expect(found?.values).toEqual({ a: 5, b: 12 })
    expect(found?.steps[2].latex).toBe('\\sqrt{169}=13')
  })

  it('changing a structural exponent breaks the pattern', () => {
    expect(match('\\sqrt{3^2+4^3}')?.name).not.toBe('pythagoras')
  })

  it('compound growth follows edited rate and periods', () => {
    const found = match('500\\cdot(1+\\frac{7}{100})^{3}')
    expect(found?.name).toBe('compound growth')
    expect(found?.values).toEqual({ p: 500, r: 7, n: 3 })
    expect(found?.steps[0].latex).toContain('=1.07')
  })

  it('power tower with any digits', () => {
    const found = match('3^{2^{3}}')
    expect(found?.name).toBe('power tower')
    expect(found?.steps[1].latex).toBe('3^{8}=6561')
  })

  it('mean requires exactly three terms over three', () => {
    expect(match('\\frac{1+2+3}{3}')?.name).toBe('mean')
    expect(match('\\frac{1+2}{3}')?.name).not.toBe('mean')
    expect(match('\\frac{1+2+3}{4}')?.name).not.toBe('mean')
  })
})

describe('slot unification', () => {
  it('discount holds while both prices agree', () => {
    const found = match('200-200\\cdot10\\%')
    expect(found?.name).toBe('discount')
    expect(found?.steps[1].latex).toBe('200-20=180')
  })

  it('discount breaks when the prices diverge', () => {
    expect(match('200-90\\cdot10\\%')).toBeNull()
  })
})

describe('accept predicates', () => {
  it('tip needs a literal percent, not just a small factor', () => {
    expect(match('85\\cdot18\\%')?.name).toBe('tip')
    expect(match('85\\cdot0.18')).toBeNull()
  })

  it('float trap needs a non-integer operand', () => {
    expect(match('0.1+0.2')?.name).toBe('float trap')
    expect(match('1+2')).toBeNull()
  })
})

describe('non-matching input', () => {
  it('returns null for unrelated trees', () => {
    expect(match('42')).toBeNull()
    expect(match('1+2+3')).toBeNull()
  })
})

describe('step values render through the display formatter', () => {
  it('tip rate round-trips without float noise', () => {
    const found = match('85\\cdot18\\%')
    expect(found?.steps[0].latex).toBe('18\\%=0.18')
    expect(found?.steps[1].latex).toBe('85\\cdot0.18=15.3')
  })
})
