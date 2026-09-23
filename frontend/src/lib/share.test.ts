import { describe, expect, it } from 'vitest'
import { readSharedLatex, shareHash } from './share'

describe('share links', () => {
  it('round-trips latex with reserved characters', () => {
    const latex = '\\frac{1+\\sqrt{5}}{2}\\cdot25\\%#&'
    expect(readSharedLatex(shareHash(latex))).toBe(latex)
  })

  it('ignores foreign, empty, and malformed hashes', () => {
    expect(readSharedLatex('')).toBeNull()
    expect(readSharedLatex('#top')).toBeNull()
    expect(readSharedLatex('#e=')).toBeNull()
    expect(readSharedLatex('#e=%E0%A4%A')).toBeNull()
  })
})
