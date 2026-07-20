const substitutions: Record<string, string> = {
  '×': '*',
  '÷': '/',
  '−': '-',
  ',': '.',
}

// Digits, operators, parens, dot, space, √, and the letters of "sqrt" plus "e" for exponents.
const allowed = /[0-9+\-*/^%(). eqrst√]/

export function sanitizeExpression(raw: string): string {
  let out = ''
  for (const ch of raw) {
    const mapped = substitutions[ch] ?? ch
    if (allowed.test(mapped)) out += mapped
  }
  return out.replace(/sqrt/g, '√')
}

export type Edit = { value: string; cursor: number }

export function insertText(expr: string, start: number, end: number, text: string): Edit {
  const value = expr.slice(0, start) + text + expr.slice(end)
  return { value, cursor: start + text.length }
}

export function backspace(expr: string, start: number, end: number): Edit {
  if (start !== end) return { value: expr.slice(0, start) + expr.slice(end), cursor: start }
  if (start === 0) return { value: expr, cursor: 0 }
  return { value: expr.slice(0, start - 1) + expr.slice(start), cursor: start - 1 }
}

// Typing ")" right before an existing ")" moves over it instead of doubling it.
export function closeParen(expr: string, start: number, end: number): Edit {
  if (start === end && expr[start] === ')') return { value: expr, cursor: start + 1 }
  return insertText(expr, start, end, ')')
}

export function balanceParens(expr: string): string {
  let depth = 0
  for (const ch of expr) {
    if (ch === '(') depth++
    else if (ch === ')' && depth > 0) depth--
  }
  return expr + ')'.repeat(depth)
}
