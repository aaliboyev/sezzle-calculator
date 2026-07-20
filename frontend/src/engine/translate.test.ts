import { describe, expect, it } from 'vitest'
import { translateLatex } from './translate'

function expr(latex: string): string {
  const t = translateLatex(latex)
  if (t.kind !== 'expression') throw new Error(`expected expression, got ${JSON.stringify(t)}`)
  return t.expression
}

function errorMessage(latex: string): string {
  const t = translateLatex(latex)
  if (t.kind !== 'error') throw new Error(`expected error, got ${JSON.stringify(t)}`)
  return t.message
}

describe('operators', () => {
  it('translates addition and subtraction chains', () => {
    expect(expr('2+3')).toBe('2+3')
    expect(expr('1+2+3')).toBe('1+2+3')
    expect(expr('5-2')).toBe('5-2')
    expect(expr('5-2+3')).toBe('5-2+3')
  })

  it('translates every multiplication notation to *', () => {
    expect(expr('2\\cdot3')).toBe('2*3')
    expect(expr('2\\times3')).toBe('2*3')
    expect(expr('2*3')).toBe('2*3')
    expect(expr('2\\cdot3\\cdot4')).toBe('2*3*4')
  })

  it('translates fractions, \\div and / to division', () => {
    expect(expr('\\frac{1}{0}')).toBe('1/0')
    expect(expr('6\\div2')).toBe('6/2')
    expect(expr('1/2')).toBe('1/2')
  })

  it('translates powers right-associatively', () => {
    expect(expr('2^{10}')).toBe('2^10')
    expect(expr('2^{3^2}')).toBe('2^3^2')
    expect(expr('2^{-1}')).toBe('2^(-1)')
    expect(expr('\\frac{1}{2}^2')).toBe('(1/2)^2')
  })
})

describe('precedence and grouping', () => {
  it('keeps precedence without redundant parens', () => {
    expect(expr('2+3\\cdot4')).toBe('2+3*4')
    expect(expr('(2+3)\\cdot4')).toBe('(2+3)*4')
    expect(expr('\\left(2+3\\right)\\cdot4')).toBe('(2+3)*4')
    expect(expr('\\frac{2+1}{3}')).toBe('(2+1)/3')
  })

  it('translates implicit multiplication explicitly', () => {
    expect(expr('2(3+1)')).toBe('2*(3+1)')
    expect(expr('2\\sqrt{4}')).toBe('2*√(4)')
  })
})

describe('unary minus', () => {
  it('translates negation variants', () => {
    expect(expr('-2')).toBe('-2')
    expect(expr('--2')).toBe('--2')
    expect(expr('-2^2')).toBe('-2^2')
    expect(expr('-(2+3)')).toBe('-(2+3)')
    expect(expr('2\\cdot-3')).toBe('2*(-3)')
    expect(expr('5--2')).toBe('5--2')
  })

  it('drops unary plus like the parser does', () => {
    expect(expr('+2')).toBe('2')
  })
})

describe('square roots', () => {
  it('accepts brace-less serialization from the math-field', () => {
    expect(expr('\\sqrt9')).toBe('√(9)')
    expect(expr('\\frac10')).toBe('1/0')
  })

  it('always parenthesizes the radicand', () => {
    expect(expr('\\sqrt{9}')).toBe('√(9)')
    expect(expr('\\sqrt{2+2}')).toBe('√(2+2)')
    expect(expr('\\sqrt{\\frac{1}{4}}')).toBe('√(1/4)')
    expect(expr('\\sqrt{\\sqrt{16}}')).toBe('√(√(16))')
    expect(expr('\\sqrt{9}^2')).toBe('√(9)^2')
    expect(expr('-\\sqrt{4}')).toBe('-√(4)')
  })

  it('accepts index-2 roots and rejects others', () => {
    expect(expr('\\sqrt[2]{9}')).toBe('√(9)')
    expect(errorMessage('\\sqrt[3]{8}')).toBe('unsupported: root of index 3')
  })
})

describe('percentages', () => {
  it('resolves percentages at parse time', () => {
    expect(expr('50\\%')).toBe('0.5')
    expect(expr('3.5\\%')).toBe('0.035')
    expect(expr('200\\cdot10\\%')).toBe('200*0.1')
  })
})

describe('numbers', () => {
  it('keeps decimals and float-noise inputs as written', () => {
    expect(expr('0.1+0.2')).toBe('0.1+0.2')
    expect(expr('2000')).toBe('2000')
  })

  it('passes arbitrarily long literals through for the backend to judge', () => {
    expect(expr('123456789012345678901234567890')).toBe('123456789012345678901234567890')
    expect(expr('0.12345678901234567890123')).toBe('0.12345678901234567890123')
  })
})

describe('unsupported input', () => {
  it('names the offending symbol', () => {
    expect(errorMessage('x+1')).toBe('unsupported: x')
    expect(errorMessage('\\pi')).toBe('unsupported: π')
    expect(errorMessage('\\infty')).toBe('unsupported: ∞')
  })

  it('names the offending function or relation', () => {
    expect(errorMessage('\\sin(3)')).toBe('unsupported: Sin')
    expect(errorMessage('2=4')).toBe('unsupported: =')
  })

  it('rejects incomplete input without contacting the server', () => {
    expect(errorMessage('2+')).toBe('incomplete or invalid expression')
    expect(errorMessage('\\sqrt{}')).toBe('incomplete or invalid expression')
    expect(errorMessage('(1+2)\\%')).toBe('incomplete or invalid expression')
  })
})

describe('empty field', () => {
  it('reports empty for blank input', () => {
    expect(translateLatex('')).toEqual({ kind: 'empty' })
    expect(translateLatex('   ')).toEqual({ kind: 'empty' })
  })
})
