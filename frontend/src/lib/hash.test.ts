import { describe, expect, it } from 'vitest'
import { hash8 } from './hash'

describe('hash8', () => {
  it('is 8 lowercase hex chars', () => {
    expect(hash8('7\\times6')).toMatch(/^[0-9a-f]{8}$/)
    expect(hash8('')).toMatch(/^[0-9a-f]{8}$/)
  })

  it('is deterministic', () => {
    expect(hash8('\\frac{1}{2}')).toBe(hash8('\\frac{1}{2}'))
  })

  it('differs for different formulas', () => {
    expect(hash8('1+1')).not.toBe(hash8('1+2'))
    expect(hash8('ab')).not.toBe(hash8('ba'))
  })
})
