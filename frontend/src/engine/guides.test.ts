import { describe, expect, it } from 'vitest'
import { GUIDES, matchGuide } from './guides'

describe('every guide matches its own showcase latex', () => {
  for (const guide of GUIDES) {
    it(guide.name, () => {
      const match = matchGuide(guide.latex)
      expect(match?.name).toBe(guide.name)
      expect(match!.steps.length).toBeGreaterThan(0)
    })
  }
})

describe('digits are free, structure is held', () => {
  it('pythagoras rebinds to new legs', () => {
    const match = matchGuide('\\sqrt{5^2+12^2}')
    expect(match?.name).toBe('pythagoras')
    expect(match?.values).toEqual({ a: 5, b: 12 })
    expect(match?.steps[2].latex).toBe('\\sqrt{169}=13')
  })

  it('changing a structural exponent breaks the pattern', () => {
    expect(matchGuide('\\sqrt{3^2+4^3}')?.name).not.toBe('pythagoras')
  })

  it('compound growth follows edited rate and periods', () => {
    const match = matchGuide('500\\cdot(1+\\frac{7}{100})^{3}')
    expect(match?.name).toBe('compound growth')
    expect(match?.values).toEqual({ p: 500, r: 7, n: 3 })
    expect(match?.steps[0].latex).toContain('=1.07')
  })

  it('power tower with any digits', () => {
    const match = matchGuide('3^{2^{3}}')
    expect(match?.name).toBe('power tower')
    expect(match?.steps[1].latex).toBe('3^{8}=6561')
  })

  it('mean requires exactly three terms over three', () => {
    expect(matchGuide('\\frac{1+2+3}{3}')?.name).toBe('mean')
    expect(matchGuide('\\frac{1+2}{3}')?.name).not.toBe('mean')
    expect(matchGuide('\\frac{1+2+3}{4}')?.name).not.toBe('mean')
  })
})

describe('slot unification', () => {
  it('discount holds while both prices agree', () => {
    const match = matchGuide('200-200\\cdot10\\%')
    expect(match?.name).toBe('discount')
    expect(match?.steps[1].latex).toBe('200-20=180')
  })

  it('discount breaks when the prices diverge', () => {
    expect(matchGuide('200-90\\cdot10\\%')).toBeNull()
  })
})

describe('accept predicates', () => {
  it('tip needs a literal percent, not just a small factor', () => {
    expect(matchGuide('85\\cdot18\\%')?.name).toBe('tip')
    expect(matchGuide('85\\cdot0.18')).toBeNull()
  })

  it('float trap needs a non-integer operand', () => {
    expect(matchGuide('0.1+0.2')?.name).toBe('float trap')
    expect(matchGuide('1+2')).toBeNull()
  })
})

describe('non-matching input', () => {
  it('returns null for unrelated, empty, or invalid latex', () => {
    expect(matchGuide('42')).toBeNull()
    expect(matchGuide('1+2+3')).toBeNull()
    expect(matchGuide('')).toBeNull()
    expect(matchGuide('2+')).toBeNull()
    expect(matchGuide('x+1')).toBeNull()
  })
})

describe('diagrams are data derived from the bound values', () => {
  it('pythagoras draws a triangle labeled with the actual sides', () => {
    const match = matchGuide('\\sqrt{3^2+4^2}')
    expect(match?.diagram?.height).toBe(140)
    const texts = match!.diagram!.shapes.filter((s) => s.kind === 'text').map((s) => (s as { text: string }).text)
    expect(texts).toEqual(expect.arrayContaining(['3', '4', '5']))
  })

  it('guards return null instead of drawing nonsense', () => {
    expect(matchGuide('\\sqrt{0^2+4^2}')?.diagram).toBeNull()
    expect(matchGuide('500\\cdot(1+\\frac{7}{100})^{99}')?.diagram).toBeNull()
  })

  it('guides without a diagram report null', () => {
    expect(matchGuide('\\sqrt{\\sqrt{16}}')?.diagram).toBeNull()
  })
})

describe('step values render through the display formatter', () => {
  it('tip rate round-trips without float noise', () => {
    const match = matchGuide('85\\cdot18\\%')
    expect(match?.steps[0].latex).toBe('18\\%=0.18')
    expect(match?.steps[1].latex).toBe('85\\cdot0.18=15.3')
  })
})
