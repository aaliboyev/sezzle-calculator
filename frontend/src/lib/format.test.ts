import { describe, expect, it } from 'vitest'
import { formatResult } from './format'

describe('formatResult', () => {
  it('prints integers plainly', () => {
    expect(formatResult(4)).toBe('4')
    expect(formatResult(-1024)).toBe('-1024')
    expect(formatResult(0)).toBe('0')
  })

  it('hides float noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3')
    expect(formatResult(Math.sqrt(2) ** 2 / 2)).toBe('1')
  })

  it('keeps 12 significant digits for genuinely long results', () => {
    expect(formatResult(1 / 3)).toBe('0.333333333333')
  })

  it('uses exponent notation for extreme magnitudes', () => {
    expect(formatResult(2e21)).toBe('2e+21')
    expect(formatResult(5e-8)).toBe('5e-8')
  })

  it('normalizes negative zero', () => {
    expect(formatResult(-0)).toBe('0')
  })

  it('prints large exact integers without exponent', () => {
    expect(formatResult(20000000000)).toBe('20000000000')
  })
})
