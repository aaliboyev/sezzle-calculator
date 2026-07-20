import type { DiagramSpec, Guide, GuideValues } from './types'
import { show } from './helpers'

function triangleDiagram({ a, b }: GuideValues): DiagramSpec | null {
  if (!(a > 0 && b > 0 && a <= 9999 && b <= 9999)) return null
  const scale = 104 / Math.max(a, b)
  const w = a * scale
  const h = b * scale
  const x = 24
  const base = 124
  return {
    height: 140,
    shapes: [
      {
        kind: 'polygon',
        points: [
          [x, base],
          [x + w, base],
          [x, base - h],
        ],
        fill: 'violet-soft',
        tone: 'peach-strong',
      },
      { kind: 'line', x1: x + w, y1: base, x2: x, y2: base - h, tone: 'violet', width: 2 },
      { kind: 'rect', x, y: base - 12, w: 12, h: 12, fill: 'none', tone: 'muted' },
      { kind: 'text', x: x + w / 2, y: base + 14, text: show(a), anchor: 'middle' },
      { kind: 'text', x: x - 8, y: base - h / 2, text: show(b), anchor: 'end' },
      { kind: 'text', x: x + w / 2 + 12, y: base - h / 2 - 6, text: show(Math.hypot(a, b)) },
    ],
  }
}

function shareBarDiagram(total: number, rate: number, keep: boolean): DiagramSpec | null {
  if (!(total > 0 && rate >= 0 && rate <= 1.5)) return null
  const width = 200
  const slice = Math.min(rate, 1) * width
  return {
    height: 70,
    shapes: [
      { kind: 'rect', x: 10, y: 18, w: width, h: 24, rx: 6, fill: 'surface', tone: 'muted' },
      { kind: 'rect', x: 10 + width - slice, y: 18, w: slice, h: 24, rx: 6, fill: 'orange-soft' },
      { kind: 'text', x: 10, y: 12, text: show(total) },
      {
        kind: 'text',
        x: 10 + width - slice / 2,
        y: 58,
        text: keep ? `-${show(total * rate)}` : show(total * rate),
        anchor: 'middle',
        tone: 'peach-strong',
      },
    ],
  }
}

function growthDiagram({ p, r, n }: GuideValues): DiagramSpec | null {
  const periods = Math.round(n)
  if (!(p > 0 && periods >= 1 && periods <= 24 && periods === n && r > -100)) return null
  const m = 1 + r / 100
  const values = Array.from({ length: periods + 1 }, (_, i) => Math.pow(m, i))
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points: [number, number][] = values.map((v, i) => [
    12 + (i / periods) * 196,
    58 - ((v - min) / span) * 44,
  ])
  const [lastX, lastY] = points[points.length - 1]
  return {
    height: 70,
    shapes: [
      { kind: 'polyline', points, tone: 'violet', width: 2, fill: 'none' },
      { kind: 'circle', cx: lastX, cy: lastY, r: 3.5, tone: 'orange', filled: true },
      {
        kind: 'text',
        x: lastX,
        y: lastY - 8,
        text: show(p * Math.pow(m, periods)),
        anchor: 'end',
        tone: 'peach-strong',
      },
    ],
  }
}

export const BASICS: Guide[] = [
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
    diagram: triangleDiagram,
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
    diagram: growthDiagram,
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
    diagram: ({ a, r }) => shareBarDiagram(a, r, true),
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
    diagram: ({ a, r }) => shareBarDiagram(a, r, false),
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
