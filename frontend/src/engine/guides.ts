import { formatResult } from '../lib/format'
import { parseMathJSON } from './translate'

// Each guide is a MathJSON template with number slots ('$a'). The current
// field content is re-matched on every edit: structure must hold, digits are
// free and bind to the slots, which drive the steps and diagrams.

export type GuideStep = { label: string; latex: string }

export type GuideValues = Record<string, number>

export type Guide = {
  name: string
  intro: string
  latex: string
  template: Template
  accept?: (values: GuideValues, latex: string) => boolean
  steps: (values: GuideValues) => GuideStep[]
}

export type GuideMatch = {
  name: string
  intro: string
  values: GuideValues
  steps: GuideStep[]
}

type Template = number | string | readonly [string, ...Template[]]

function show(n: number): string {
  return Number.isFinite(n) ? formatResult(n) : '\\infty'
}

export const GUIDES: Guide[] = [
  {
    name: 'pythagoras',
    intro:
      'The hypotenuse of a right triangle from its two legs. Edit the digits — the triangle and the steps follow along.',
    latex: '\\sqrt{3^2+4^2}',
    template: ['Sqrt', ['Add', ['Power', '$a', 2], ['Power', '$b', 2]]],
    steps: ({ a, b }) => {
      const squares = a * a + b * b
      return [
        { label: 'square each leg', latex: `${show(a)}^2=${show(a * a)},\\quad ${show(b)}^2=${show(b * b)}` },
        { label: 'add the squares', latex: `${show(a * a)}+${show(b * b)}=${show(squares)}` },
        { label: 'take the root', latex: `\\sqrt{${show(squares)}}=${show(Math.sqrt(squares))}` },
      ]
    },
  },
  {
    name: 'compound growth',
    intro:
      'A principal growing at a rate over n periods. The multiplier compounds first, then scales the principal.',
    latex: '1000\\cdot(1+\\frac{4.5}{100})^{10}',
    template: ['Multiply', '$p', ['Power', ['Add', 1, ['Divide', '$r', 100]], '$n']],
    steps: ({ p, r, n }) => {
      const m = 1 + r / 100
      const grown = Math.pow(m, n)
      return [
        { label: 'rate to multiplier', latex: `1+\\frac{${show(r)}}{100}=${show(m)}` },
        { label: `compound ${show(n)} times`, latex: `${show(m)}^{${show(n)}}=${show(grown)}` },
        { label: 'scale the principal', latex: `${show(p)}\\cdot${show(grown)}=${show(p * grown)}` },
      ]
    },
  },
  {
    name: 'discount',
    intro:
      'A percentage off a price. The price appears twice — both copies must stay equal for the pattern to hold.',
    latex: '120-120\\cdot25\\%',
    template: ['Subtract', '$a', ['Multiply', '$a', '$r']],
    accept: (_, latex) => latex.includes('\\%'),
    steps: ({ a, r }) => [
      { label: 'the cut', latex: `${show(a)}\\cdot${show(r * 100)}\\%=${show(a * r)}` },
      { label: 'what remains', latex: `${show(a)}-${show(a * r)}=${show(a - a * r)}` },
    ],
  },
  {
    name: 'tip',
    intro: 'A percentage of an amount. Percent is postfix — 18% simply means 0.18.',
    latex: '85\\cdot18\\%',
    template: ['Multiply', '$a', '$r'],
    accept: (_, latex) => latex.includes('\\%'),
    steps: ({ a, r }) => [
      { label: 'percent to fraction', latex: `${show(r * 100)}\\%=${show(r)}` },
      { label: 'take that share', latex: `${show(a)}\\cdot${show(r)}=${show(a * r)}` },
    ],
  },
  {
    name: 'mean',
    intro: 'The arithmetic mean of three numbers. Sum them first, then divide by the count.',
    latex: '\\frac{4+9+2}{3}',
    template: ['Divide', ['Add', '$a', '$b', '$c'], 3],
    steps: ({ a, b, c }) => {
      const sum = a + b + c
      return [
        { label: 'sum the values', latex: `${show(a)}+${show(b)}+${show(c)}=${show(sum)}` },
        { label: 'divide by the count', latex: `\\frac{${show(sum)}}{3}=${show(sum / 3)}` },
      ]
    },
  },
  {
    name: 'float trap',
    intro:
      'Two decimals added in binary floating point. The API returns the honest sum; the display rounds the noise away.',
    latex: '0.1+0.2',
    template: ['Add', '$a', '$b'],
    accept: ({ a, b }) => !Number.isInteger(a) || !Number.isInteger(b),
    steps: ({ a, b }) => [
      { label: 'what you meant', latex: `${show(a)}+${show(b)}=${show(a + b)}` },
      { label: 'what the float really is', latex: `${a + b}` },
    ],
  },
  {
    name: 'nested roots',
    intro: 'A root inside a root is the fourth root. Each radical halves the exponent.',
    latex: '\\sqrt{\\sqrt{16}}',
    template: ['Sqrt', ['Sqrt', '$a']],
    steps: ({ a }) => {
      const inner = Math.sqrt(a)
      return [
        { label: 'inner root', latex: `\\sqrt{${show(a)}}=${show(inner)}` },
        { label: 'outer root', latex: `\\sqrt{${show(inner)}}=${show(Math.sqrt(inner))}` },
      ]
    },
  },
  {
    name: 'power tower',
    intro: 'Exponents associate to the right, so the top of the tower resolves first.',
    latex: '2^{3^2}',
    template: ['Power', '$a', ['Power', '$b', '$c']],
    steps: ({ a, b, c }) => {
      const top = Math.pow(b, c)
      return [
        { label: 'top of the tower first', latex: `${show(b)}^{${show(c)}}=${show(top)}` },
        { label: 'then the base', latex: `${show(a)}^{${show(top)}}=${show(Math.pow(a, top))}` },
      ]
    },
  },
]

function asNumber(node: unknown): number | null {
  if (typeof node === 'number') return node
  if (typeof node === 'object' && node !== null && 'num' in node) {
    const n = Number((node as { num: unknown }).num)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function unwrap(node: unknown): unknown {
  while (Array.isArray(node) && node[0] === 'Delimiter' && node.length > 1) node = node[1]
  return node
}

function matchNode(raw: unknown, template: Template, values: GuideValues): boolean {
  const node = unwrap(raw)
  if (typeof template === 'string' && template.startsWith('$')) {
    const n = asNumber(node)
    if (n === null) return false
    const slot = template.slice(1)
    if (slot in values && values[slot] !== n) return false
    values[slot] = n
    return true
  }
  if (typeof template === 'number') return asNumber(node) === template
  if (!Array.isArray(node) || node.length !== template.length) return false
  const nodeHead = node[0] === 'InvisibleOperator' ? 'Multiply' : node[0]
  const [templateHead, ...args] = template
  if (nodeHead !== templateHead) return false
  return args.every((t, i) => matchNode(node[i + 1], t, values))
}

export function matchGuide(latex: string): GuideMatch | null {
  if (!latex.trim()) return null
  const json = parseMathJSON(latex)
  if (json === null || json === 'Nothing') return null
  for (const guide of GUIDES) {
    const values: GuideValues = {}
    if (matchNode(json, guide.template, values) && (guide.accept?.(values, latex) ?? true)) {
      return { name: guide.name, intro: guide.intro, values, steps: guide.steps(values) }
    }
  }
  return null
}
