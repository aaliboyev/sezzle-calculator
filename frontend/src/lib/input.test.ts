import { describe, expect, it } from 'vitest'
import { backspace, balanceParens, closeParen, insertText, sanitizeExpression } from './input'

describe('sanitizeExpression', () => {
  it('keeps digits, operators, parens, dot and spaces', () => {
    expect(sanitizeExpression('1+2*(3-4)/5^6%.7 ')).toBe('1+2*(3-4)/5^6%.7 ')
  })

  it('maps display symbols to ascii operators', () => {
    expect(sanitizeExpression('8×2÷4−1')).toBe('8*2/4-1')
  })

  it('keeps √ and collapses typed sqrt into it', () => {
    expect(sanitizeExpression('√9')).toBe('√9')
    expect(sanitizeExpression('sqrt(4)')).toBe('√(4)')
    expect(sanitizeExpression('1+sqr')).toBe('1+sqr')
  })

  it('maps comma to dot', () => {
    expect(sanitizeExpression('1,5')).toBe('1.5')
  })

  it('drops disallowed characters', () => {
    expect(sanitizeExpression('1a+#2!=$3')).toBe('1+23')
    expect(sanitizeExpression('😀')).toBe('')
  })

  it('keeps the letter e for exponents', () => {
    expect(sanitizeExpression('1e3+2')).toBe('1e3+2')
  })

  it('handles empty input', () => {
    expect(sanitizeExpression('')).toBe('')
  })
})

describe('insertText', () => {
  it('inserts at the cursor', () => {
    expect(insertText('12', 1, 1, '+')).toEqual({ value: '1+2', cursor: 2 })
  })

  it('replaces a selection', () => {
    expect(insertText('1234', 1, 3, '+')).toEqual({ value: '1+4', cursor: 2 })
  })

  it('appends at the end', () => {
    expect(insertText('1+', 2, 2, '2')).toEqual({ value: '1+2', cursor: 3 })
  })

  it('inserts multi-character text', () => {
    expect(insertText('+2', 0, 0, '√()')).toEqual({ value: '√()+2', cursor: 3 })
  })
})

describe('closeParen', () => {
  it('skips over an existing closer', () => {
    expect(closeParen('√(9)', 3, 3)).toEqual({ value: '√(9)', cursor: 4 })
  })

  it('inserts when the next char is not a closer', () => {
    expect(closeParen('(9', 2, 2)).toEqual({ value: '(9)', cursor: 3 })
  })

  it('replaces a selection instead of skipping', () => {
    expect(closeParen('(12)', 1, 3)).toEqual({ value: '())', cursor: 2 })
  })
})

describe('balanceParens', () => {
  it('appends missing closers', () => {
    expect(balanceParens('√(9')).toBe('√(9)')
    expect(balanceParens('((1+2')).toBe('((1+2))')
  })

  it('leaves balanced input alone', () => {
    expect(balanceParens('(1+2)')).toBe('(1+2)')
    expect(balanceParens('')).toBe('')
  })

  it('does not fix extra closers', () => {
    expect(balanceParens('1+2)')).toBe('1+2)')
  })
})

describe('backspace', () => {
  it('deletes the character before the cursor', () => {
    expect(backspace('123', 2, 2)).toEqual({ value: '13', cursor: 1 })
  })

  it('deletes the selection', () => {
    expect(backspace('1234', 1, 3)).toEqual({ value: '14', cursor: 1 })
  })

  it('does nothing at position zero', () => {
    expect(backspace('123', 0, 0)).toEqual({ value: '123', cursor: 0 })
  })

  it('handles empty value', () => {
    expect(backspace('', 0, 0)).toEqual({ value: '', cursor: 0 })
  })
})
