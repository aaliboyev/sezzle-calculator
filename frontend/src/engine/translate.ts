import { ComputeEngine } from '@cortex-js/compute-engine'

// Translates a math-field's LaTeX into the backend expression grammar by
// walking MathJSON against a whitelist of what the server evaluates.
// canonical: false is load-bearing — canonical parsing computes (1/0 becomes
// ComplexInfinity, 2+3 becomes 5) instead of preserving structure.

export type Translation =
  | { kind: 'expression'; expression: string }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

const ce = new ComputeEngine()

class Unsupported extends Error {}
class Invalid extends Error {}

const PREC = { add: 1, mul: 2, neg: 2, pow: 3, sqrt: 4, atom: 5 }

type Emitted = { text: string; prec: number }

const SYMBOL_NAMES: Record<string, string> = {
  Pi: 'π',
  ExponentialE: 'e',
  ImaginaryUnit: 'i',
  PositiveInfinity: '∞',
  NegativeInfinity: '-∞',
  Equal: '=',
}

function display(name: string): string {
  return SYMBOL_NAMES[name] ?? name
}

const NUMBER_LITERAL = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

function emitNumberString(text: string): Emitted {
  if (!NUMBER_LITERAL.test(text)) throw new Unsupported(text)
  return { text, prec: text.startsWith('-') ? PREC.neg : PREC.atom }
}

function emitNumber(n: number): Emitted {
  if (!Number.isFinite(n)) throw new Unsupported('∞')
  return { text: String(n), prec: n < 0 ? PREC.neg : PREC.atom }
}

function group(e: Emitted, wrapBelow: number): string {
  return e.prec < wrapBelow ? `(${e.text})` : e.text
}

// Left-assoc chain: left operand may match the operator precedence,
// every following operand must exceed it.
function emitChain(args: unknown[], op: string, prec: number): Emitted {
  if (args.length < 2) throw new Invalid()
  let text = group(emit(args[0]), prec)
  for (const arg of args.slice(1)) text += op + group(emit(arg), prec + 1)
  return { text, prec }
}

function emit(node: unknown): Emitted {
  if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
    const o = node as Record<string, unknown>
    if ('num' in o) return emitNumberString(String(o.num))
    if ('sym' in o) node = o.sym
    else if ('fn' in o) node = o.fn
    else throw new Unsupported('text')
  }
  if (typeof node === 'number') return emitNumber(node)
  if (typeof node === 'string') throw new Unsupported(display(node))
  if (!Array.isArray(node) || typeof node[0] !== 'string') throw new Invalid()

  const [head, ...args] = node as [string, ...unknown[]]
  switch (head) {
    case 'Add':
      return emitChain(args, '+', PREC.add)
    case 'Subtract':
      if (args.length !== 2) throw new Invalid()
      return emitChain(args, '-', PREC.add)
    case 'Multiply':
    case 'InvisibleOperator':
      return emitChain(args, '*', PREC.mul)
    case 'Divide':
    case 'Rational':
      if (args.length !== 2) throw new Invalid()
      return emitChain(args, '/', PREC.mul)
    case 'Negate': {
      if (args.length !== 1) throw new Invalid()
      return { text: '-' + group(emit(args[0]), PREC.neg), prec: PREC.neg }
    }
    case 'Sqrt':
      if (args.length !== 1) throw new Invalid()
      return { text: `√(${emit(args[0]).text})`, prec: PREC.sqrt }
    case 'Root': {
      if (args.length !== 2) throw new Invalid()
      if (args[1] !== 2) throw new Unsupported(`root of index ${JSON.stringify(args[1])}`)
      return { text: `√(${emit(args[0]).text})`, prec: PREC.sqrt }
    }
    case 'Power': {
      if (args.length !== 2) throw new Invalid()
      const base = group(emit(args[0]), PREC.pow + 1)
      const exponent = group(emit(args[1]), PREC.pow)
      return { text: `${base}^${exponent}`, prec: PREC.pow }
    }
    case 'Delimiter':
      if (args.length === 0) throw new Invalid()
      return emit(args[0])
    default:
      if (head === 'Error' || head === 'Sequence') throw new Invalid()
      throw new Unsupported(display(head))
  }
}

// Structure-preserving MathJSON for the same latex the translator sees.
export function parseMathJSON(latex: string): unknown {
  try {
    return ce.parse(latex, { canonical: false }).json
  } catch {
    return null
  }
}

export function translateLatex(latex: string): Translation {
  if (!latex.trim()) return { kind: 'empty' }
  const json = parseMathJSON(latex)
  if (json === null) {
    return { kind: 'error', message: 'incomplete or invalid expression' }
  }
  if (json === 'Nothing') return { kind: 'empty' }
  try {
    return { kind: 'expression', expression: emit(json).text }
  } catch (err) {
    if (err instanceof Unsupported) {
      return { kind: 'error', message: `unsupported: ${err.message}` }
    }
    return { kind: 'error', message: 'incomplete or invalid expression' }
  }
}
