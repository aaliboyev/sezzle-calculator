import { formatResult } from '../lib/format'
import { parseMathJSON } from './translate'

// Each guide is a MathJSON template with number slots ('$a'). The current
// field content is re-matched on every edit: structure must hold, digits are
// free and bind to the slots, which drive the steps and diagrams.

export type GuideStep = { label: string; latex: string }

export type GuideValues = Record<string, number>

// Diagrams are data: pure shape lists in a 220-wide viewBox, rendered by a
// single component. Tones map to theme colors there.
export type Tone = 'peach' | 'peach-strong' | 'violet' | 'orange' | 'muted'
export type Fill = 'violet-soft' | 'orange-soft' | 'surface' | 'none'

export type DiagramShape =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; tone?: Tone; width?: number; dash?: boolean }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill?: Fill; tone?: Tone; rx?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; tone?: Tone; filled?: boolean }
  | { kind: 'polygon' | 'polyline'; points: [number, number][]; fill?: Fill; tone?: Tone; width?: number }
  | { kind: 'text'; x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; tone?: Tone }

export type DiagramSpec = { height: 70 | 140; shapes: DiagramShape[] }

export type Guide = {
  name: string
  intro: string
  latex: string
  template: Template
  accept?: (values: GuideValues, latex: string) => boolean
  steps: (values: GuideValues) => GuideStep[]
  // Returns null when the values are out of drawable range.
  diagram?: (values: GuideValues) => DiagramSpec | null
}

export type GuideMatch = {
  name: string
  intro: string
  values: GuideValues
  steps: GuideStep[]
  diagram: DiagramSpec | null
}

type Template = number | string | readonly [string, ...Template[]]

function show(n: number): string {
  if (!Number.isFinite(n)) return '\\infty'
  const text = formatResult(n)
  // "1e-15" in latex reads as the variable e; render ×10^n instead.
  const exp = text.match(/^(-?[\d.]+)e([+-]\d+)$/)
  return exp ? `${exp[1]}\\times10^{${Number(exp[2])}}` : text
}

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
  {
    name: 'e by compounding',
    intro:
      'Compound interest with ever-smaller, ever-more-frequent periods does not run away to infinity — it settles on e. Edit n and watch the multiplier shrink toward 1 while its power climbs toward 2.718.',
    latex: '(1+\\frac{1}{1000000})^{1000000}',
    template: ['Power', ['Add', 1, ['Divide', 1, '$n']], '$n'],
    steps: ({ n }) => {
      const m = 1 + 1 / n
      const limit = Math.pow(m, n)
      return [
        { label: 'the multiplier', latex: `1+\\frac{1}{${show(n)}}=${show(m)}` },
        { label: `compound ${show(n)} times`, latex: `${show(m)}^{${show(n)}}=${show(limit)}` },
        { label: 'against e', latex: `${show(limit)}\\;\\text{vs}\\;e=${show(Math.E)}` },
      ]
    },
  },
  {
    name: 'chessboard',
    intro:
      'Put one grain of rice on the first square, then keep doubling — by the 64th square the count is a number no chessboard could hold. That final square is 2 raised to 63.',
    latex: '2^{63}',
    template: ['Power', 2, '$k'],
    steps: ({ k }) => {
      const grains = Math.pow(2, k)
      return [
        { label: 'ten doublings ≈ a thousand', latex: `2^{10}=1024\\approx10^3` },
        { label: `${show(k)} doublings`, latex: `2^{${show(k)}}=${show(grains)}` },
        { label: 'already beyond exact integers', latex: `${grains}` },
      ]
    },
  },
  {
    name: 'big and tiny',
    intro:
      'A float carries only about 16 significant digits, so a number 30 orders of magnitude smaller falls off the end when added. Here 10¹⁵ simply swallows 10⁻¹⁵ whole.',
    latex: '10^{15}+10^{-15}',
    template: ['Add', ['Power', 10, '$a'], ['Power', 10, ['Negate', '$b']]],
    steps: ({ a, b }) => {
      const big = Math.pow(10, a)
      const tiny = Math.pow(10, -b)
      return [
        { label: 'two magnitudes', latex: `10^{${show(a)}}=${show(big)},\\quad 10^{-${show(b)}}=${show(tiny)}` },
        { label: 'add them honestly', latex: `${show(big)}+${show(tiny)}=${show(big + tiny)}` },
        { label: 'the tiny addend vanished', latex: `${big + tiny}=${big}` },
      ]
    },
  },
  {
    name: 'repeating third',
    intro:
      'One divided by three is the classic decimal that never resolves — the 3s march on forever. A float can only hold a finite slice of them, so it stores a rounded stand-in.',
    latex: '\\frac{1}{3}',
    // Literals pinned: a slot template would hijack every typed fraction.
    template: ['Divide', 1, 3],
    steps: () => [
      { label: 'long division never terminates', latex: `\\frac{1}{3}=0.\\overline{3}` },
      { label: 'the float rounds it off', latex: `${1 / 3}` },
      { label: 'the display trims the noise', latex: `${show(1 / 3)}` },
    ],
  },
  {
    name: 'almost pi',
    intro:
      'Long before decimals, the fraction 355/113 was prized as a pocket-sized stand-in for π — it matches the real value out to six decimal places. Divide it out and compare.',
    latex: '\\frac{355}{113}',
    // Literals pinned: a slot template would hijack every typed fraction.
    template: ['Divide', 355, 113],
    steps: () => {
      const q = 355 / 113
      const truncate = (x: number, digits: number) => Math.trunc(x * 10 ** digits) / 10 ** digits
      let decimals = 0
      while (decimals < 12 && truncate(q, decimals + 1) === truncate(Math.PI, decimals + 1)) decimals++
      return [
        { label: 'the division', latex: `\\frac{355}{113}=${show(q)}` },
        { label: 'against π', latex: `\\pi=${Math.PI}` },
        { label: `agrees to ${decimals} decimals`, latex: `${q.toFixed(6)}\\ldots=${Math.PI.toFixed(6)}\\ldots` },
      ]
    },
  },
  {
    name: 'distance',
    intro:
      'The straight-line distance between two points is pythagoras applied to their coordinate gaps. Move either point by editing the numbers — the segment and the steps follow.',
    latex: '\\sqrt{(7-3)^2+(6-3)^2}',
    template: [
      'Sqrt',
      ['Add', ['Power', ['Subtract', '$x2', '$x1'], 2], ['Power', ['Subtract', '$y2', '$y1'], 2]],
    ],
    steps: ({ x1, y1, x2, y2 }) => {
      const dx = x2 - x1
      const dy = y2 - y1
      const sum = dx * dx + dy * dy
      return [
        {
          label: 'coordinate gaps',
          latex: `\\Delta x=${show(x2)}-${show(x1)}=${show(dx)},\\quad \\Delta y=${show(y2)}-${show(y1)}=${show(dy)}`,
        },
        { label: 'square and add', latex: `${show(dx)}^2+${show(dy)}^2=${show(sum)}` },
        { label: 'take the root', latex: `\\sqrt{${show(sum)}}=${show(Math.sqrt(sum))}` },
      ]
    },
  },
  {
    name: 'slope',
    intro:
      'The slope of a line is how much it rises for every step it runs. Edit the four coordinates and the rise-over-run triangle updates with the ratio.',
    latex: '\\frac{9-5}{6-2}',
    template: ['Divide', ['Subtract', '$y2', '$y1'], ['Subtract', '$x2', '$x1']],
    steps: ({ x1, y1, x2, y2 }) => {
      const rise = y2 - y1
      const run = x2 - x1
      return [
        { label: 'rise', latex: `${show(y2)}-${show(y1)}=${show(rise)}` },
        { label: 'run', latex: `${show(x2)}-${show(x1)}=${show(run)}` },
        { label: 'rise over run', latex: `\\frac{${show(rise)}}{${show(run)}}=${show(rise / run)}` },
      ]
    },
  },
  {
    name: 'triangle area',
    intro:
      'A triangle covers exactly half of the rectangle around its base and height. Edit either one and the shape and the halving step respond.',
    latex: '\\frac{10\\cdot6}{2}',
    template: ['Divide', ['Multiply', '$b', '$h'], 2],
    steps: ({ b, h }) => {
      const bh = b * h
      return [
        { label: 'base times height', latex: `${show(b)}\\cdot${show(h)}=${show(bh)}` },
        { label: 'take half', latex: `\\frac{${show(bh)}}{2}=${show(bh / 2)}` },
      ]
    },
  },
  {
    name: 'square diagonal',
    intro:
      'The diagonal of a square is always its side length times the square root of two. Change the side and both labels update from the same value.',
    latex: '5\\cdot\\sqrt{2}',
    template: ['Multiply', '$s', ['Sqrt', 2]],
    steps: ({ s }) => [
      { label: 'side times √2', latex: `${show(s)}\\cdot\\sqrt{2}` },
      { label: 'evaluate', latex: `${show(s)}\\cdot${show(Math.SQRT2)}=${show(s * Math.SQRT2)}` },
    ],
  },
  {
    name: 'geometric mean',
    intro:
      'The geometric mean is the side of the square whose area equals the a-by-b rectangle — the multiplicative middle of the two numbers.',
    latex: '\\sqrt{8\\cdot18}',
    template: ['Sqrt', ['Multiply', '$a', '$b']],
    steps: ({ a, b }) => {
      const product = a * b
      return [
        { label: 'multiply the two', latex: `${show(a)}\\cdot${show(b)}=${show(product)}` },
        { label: 'take the root', latex: `\\sqrt{${show(product)}}=${show(Math.sqrt(product))}` },
      ]
    },
  },
  {
    name: 'discriminant',
    intro:
      'The b²−4ac that decides how many real roots a quadratic has. Edit the coefficients and watch the parabola rise or fall through its axis.',
    latex: '7^2-4\\cdot3\\cdot2',
    template: ['Subtract', ['Power', '$b', 2], ['Multiply', 4, '$a', '$c']],
    steps: ({ b, a, c }) => {
      const disc = b * b - 4 * a * c
      const kind =
        disc > 0 ? '\\text{two real roots}' : disc === 0 ? '\\text{one real root}' : '\\text{no real roots}'
      return [
        { label: 'square b', latex: `${show(b)}^2=${show(b * b)}` },
        { label: 'four times a·c', latex: `4\\cdot${show(a)}\\cdot${show(c)}=${show(4 * a * c)}` },
        {
          label: 'the discriminant',
          latex: `${show(b * b)}-${show(4 * a * c)}=${show(disc)}\\;\\Rightarrow\\;${kind}`,
        },
      ]
    },
  },
  {
    name: 'golden ratio',
    intro:
      'φ, built from the square root of five: add one and halve. Slice the largest square off a golden rectangle and the leftover strip is golden too.',
    latex: '\\frac{1+\\sqrt{5}}{2}',
    template: ['Divide', ['Add', 1, ['Sqrt', '$a']], 2],
    steps: ({ a }) => {
      const root = Math.sqrt(a)
      return [
        { label: 'root of the radicand', latex: `\\sqrt{${show(a)}}=${show(root)}` },
        { label: 'add one, then halve', latex: `\\frac{1+${show(root)}}{2}=${show((1 + root) / 2)}` },
      ]
    },
  },
  {
    name: 'weighted average',
    intro:
      'Each value pulled toward the mean in proportion to its weight. The heavier weight is the bigger dot, and the balance point sits nearer to it.',
    latex: '0.7\\cdot86+0.3\\cdot94',
    template: ['Add', ['Multiply', '$w1', '$x1'], ['Multiply', '$w2', '$x2']],
    // Convex combination required; 0.7+0.3 is 0.9999... in float, hence the tolerance.
    accept: ({ w1, w2 }) => w1 >= 0 && w2 >= 0 && w1 <= 1 && w2 <= 1 && Math.abs(w1 + w2 - 1) < 1e-9,
    steps: ({ w1, x1, w2, x2 }) => {
      const t1 = w1 * x1
      const t2 = w2 * x2
      return [
        {
          label: 'scale each value',
          latex: `${show(w1)}\\cdot${show(x1)}=${show(t1)},\\quad ${show(w2)}\\cdot${show(x2)}=${show(t2)}`,
        },
        { label: 'add the contributions', latex: `${show(t1)}+${show(t2)}=${show(t1 + t2)}` },
      ]
    },
  },
  {
    name: 'exponent laws',
    intro:
      'Dividing powers of the same base subtracts their exponents. The base must match on top and bottom — that is what lets the shared factors cancel.',
    latex: '\\frac{2^{10}}{2^6}',
    template: ['Divide', ['Power', '$a', '$m'], ['Power', '$a', '$n']],
    steps: ({ a, m, n }) => [
      {
        label: 'same base, subtract exponents',
        latex: `\\frac{${show(a)}^{${show(m)}}}{${show(a)}^{${show(n)}}}=${show(a)}^{${show(m)}-${show(n)}}=${show(a)}^{${show(m - n)}}`,
      },
      { label: 'evaluate', latex: `${show(a)}^{${show(m - n)}}=${show(Math.pow(a, m - n))}` },
    ],
  },
  {
    name: 'midpoint',
    intro:
      'The point exactly halfway between two values — their average. Add them and halve; on the number line it lands dead center.',
    latex: '\\frac{12+38}{2}',
    template: ['Divide', ['Add', '$a', '$b'], 2],
    steps: ({ a, b }) => {
      const sum = a + b
      return [
        { label: 'add the endpoints', latex: `${show(a)}+${show(b)}=${show(sum)}` },
        { label: 'halve the sum', latex: `\\frac{${show(sum)}}{2}=${show(sum / 2)}` },
      ]
    },
  },
  {
    name: 'zero over zero',
    intro:
      'Zero divided by zero is indeterminate — every number satisfies it, so none is the answer. The server flags it as undefined, a distinct refusal from ordinary division by zero.',
    latex: '\\frac{0}{0}',
    template: ['Divide', 0, 0],
    steps: () => [
      { label: 'both parts vanish', latex: `\\frac{0}{0}` },
      { label: 'every number fits', latex: `x\\cdot0=0\\ \\text{for all } x` },
      { label: 'indeterminate, so it refuses', latex: `\\texttt{422 undefined\\_result}` },
    ],
  },
  {
    name: 'division by zero',
    intro:
      'Dividing a real number by zero has no answer, so the server refuses instead of inventing one. No factor times zero can give back your numerator.',
    latex: '\\frac{1}{0}',
    template: ['Divide', '$a', 0],
    accept: ({ a }) => a !== 0,
    steps: ({ a }) => [
      { label: 'what you asked', latex: `\\frac{${show(a)}}{0}` },
      { label: 'no factor works', latex: `x\\cdot0=${show(a)}\\ \\text{has no solution}` },
      { label: 'so the server refuses', latex: `\\texttt{422 division\\_by\\_zero}` },
    ],
  },
  {
    name: 'root of a negative',
    intro:
      'No real number squares to a negative, so the square root of a negative has no real answer and the server says so.',
    latex: '\\sqrt{-9}',
    // Negatives parse as Negate(x): the slot binds the magnitude.
    template: ['Sqrt', ['Negate', '$a']],
    accept: ({ a }) => a > 0,
    steps: ({ a }) => [
      { label: 'under the root', latex: `\\sqrt{-${show(a)}}` },
      { label: 'no real square is negative', latex: `x^2=-${show(a)}\\ \\text{has no real } x` },
      { label: 'so the server refuses', latex: `\\texttt{422 undefined\\_result}` },
    ],
  },
  {
    name: 'overflow',
    intro:
      '10³⁰⁸ already sits near the ceiling of a 64-bit float; one more factor of ten tips it into infinity, which the server rejects.',
    latex: '10^{308}\\cdot10',
    template: ['Multiply', ['Power', 10, '$e'], '$m'],
    // Only genuine overflow earns the overflow story.
    accept: ({ e, m }) => !Number.isFinite(Math.pow(10, e) * m),
    steps: ({ e, m }) => [
      { label: 'the power alone', latex: `10^{${show(e)}}=${show(Math.pow(10, e))}` },
      { label: 'times the factor overflows', latex: `${show(Math.pow(10, e))}\\cdot${show(m)}>1.8\\times10^{308}` },
      { label: 'past 64-bit float range', latex: `\\texttt{422 overflow}` },
    ],
  },
  {
    name: 'before tax',
    intro:
      'Undo a tax you already paid by dividing back out the (1+rate) multiplier. It is the inverse of adding tax: build the same multiplier, then divide.',
    latex: '\\frac{129.99}{1+8\\%}',
    template: ['Divide', '$a', ['Add', 1, '$r']],
    accept: (_, latex) => latex.includes('\\%'),
    steps: ({ a, r }) => {
      const m = 1 + r
      return [
        { label: 'build the tax multiplier', latex: `1+${show(r * 100)}\\%=${show(m)}` },
        { label: 'divide it back out', latex: `\\frac{${show(a)}}{${show(m)}}=${show(a / m)}` },
      ]
    },
  },
  {
    name: 'BMI',
    intro: 'Body-mass index is mass divided by height squared. Square the height first, then divide the mass by it.',
    latex: '\\frac{70}{1.75^2}',
    template: ['Divide', '$a', ['Power', '$b', 2]],
    steps: ({ a, b }) => {
      const h2 = b * b
      return [
        { label: 'square the height', latex: `${show(b)}^2=${show(h2)}` },
        { label: 'mass over that', latex: `\\frac{${show(a)}}{${show(h2)}}=${show(a / h2)}` },
      ]
    },
  },
  {
    name: 'split the bill',
    intro:
      'Add a tip to the total, then split it evenly among the table. The bill appears twice and both copies must stay equal — one bill, tipped.',
    latex: '\\frac{240+240\\cdot20\\%}{6}',
    template: ['Divide', ['Add', '$a', ['Multiply', '$a', '$r']], 6],
    accept: (_, latex) => latex.includes('\\%'),
    steps: ({ a, r }) => {
      const tip = a * r
      const total = a + tip
      return [
        { label: 'the tip', latex: `${show(a)}\\cdot${show(r * 100)}\\%=${show(tip)}` },
        { label: 'total with tip', latex: `${show(a)}+${show(tip)}=${show(total)}` },
        { label: 'split six ways', latex: `\\frac{${show(total)}}{6}=${show(total / 6)}` },
      ]
    },
  },
  {
    name: 'mean of four',
    intro: 'The same arithmetic mean as the three-value guide, with one more number. Sum all four, then divide by four.',
    latex: '\\frac{82+91+76+88}{4}',
    template: ['Divide', ['Add', '$a', '$b', '$c', '$d'], 4],
    steps: ({ a, b, c, d }) => {
      const sum = a + b + c + d
      return [
        {
          label: 'sum the values',
          latex: `${show(a)}+${show(b)}+${show(c)}+${show(d)}=${show(sum)}`,
        },
        { label: 'divide by four', latex: `\\frac{${show(sum)}}{4}=${show(sum / 4)}` },
      ]
    },
  },
  {
    name: 'sum of squares',
    intro:
      'Square three numbers and add them — the kernel behind variance and squared distance. The three little 2s are the operation, not data, so they stay fixed.',
    latex: '3^2+4^2+5^2',
    template: ['Add', ['Power', '$a', 2], ['Power', '$b', 2], ['Power', '$c', 2]],
    steps: ({ a, b, c }) => {
      const sum = a * a + b * b + c * c
      return [
        {
          label: 'square each',
          latex: `${show(a)}^2=${show(a * a)},\\quad ${show(b)}^2=${show(b * b)},\\quad ${show(c)}^2=${show(c * c)}`,
        },
        { label: 'add the squares', latex: `${show(a * a)}+${show(b * b)}+${show(c * c)}=${show(sum)}` },
      ]
    },
  },
  {
    name: 'cube volume',
    intro:
      'A cube\'s volume is its side length cubed — the side multiplied by itself three times. The exponent 3 is what "cube" means, so it stays fixed.',
    latex: '4^3',
    template: ['Power', '$a', 3],
    steps: ({ a }) => [
      { label: 'cubing is three factors', latex: `${show(a)}^3=${show(a)}\\cdot${show(a)}\\cdot${show(a)}` },
      { label: 'the volume', latex: `${show(a)}\\cdot${show(a)}\\cdot${show(a)}=${show(a * a * a)}` },
    ],
  },
  {
    name: 'root of a power',
    intro: 'A square root simply halves an exponent. Pull the exponent through the radical, then evaluate.',
    latex: '\\sqrt{10^6}',
    template: ['Sqrt', ['Power', '$a', '$b']],
    steps: ({ a, b }) => {
      const half = b / 2
      return [
        {
          label: 'a root halves the exponent',
          latex: `\\sqrt{${show(a)}^{${show(b)}}}=${show(a)}^{${show(half)}}`,
        },
        { label: 'evaluate', latex: `${show(a)}^{${show(half)}}=${show(Math.pow(a, half))}` },
      ]
    },
  },
  {
    name: 'simple interest',
    intro:
      'Interest that never compounds — principal times rate times years, flat. One year\'s interest, stretched across the term.',
    latex: '2500\\cdot6\\%\\cdot3',
    template: ['Multiply', '$p', '$r', '$t'],
    accept: (_, latex) => latex.includes('\\%'),
    steps: ({ p, r, t }) => {
      const perYear = p * r
      return [
        { label: 'rate to fraction', latex: `${show(r * 100)}\\%=${show(r)}` },
        { label: 'interest for one year', latex: `${show(p)}\\cdot${show(r)}=${show(perYear)}` },
        { label: 'over the whole term', latex: `${show(perYear)}\\cdot${show(t)}=${show(perYear * t)}` },
      ]
    },
  },
  {
    // Markup and sales tax share one structure; a neutral name avoids
    // mislabeling whichever catalog card was clicked.
    name: 'scale up by a rate',
    intro:
      'Take an amount and scale it up by a rate — a markup, a tax, any surcharge. The (1+rate) multiplier keeps the whole and adds the slice in one move.',
    latex: '80\\cdot(1+35\\%)',
    template: ['Multiply', '$a', ['Add', 1, '$r']],
    accept: (_, latex) => latex.includes('\\%'),
    steps: ({ a, r }) => {
      const m = 1 + r
      return [
        { label: 'rate to multiplier', latex: `1+${show(r * 100)}\\%=${show(m)}` },
        { label: 'scale the amount', latex: `${show(a)}\\cdot${show(m)}=${show(a * m)}` },
      ]
    },
  },
  {
    name: 'E = mc²',
    intro:
      'Mass turned into energy, in joules — mass times the speed of light squared. Only the mass is yours to change; c and its square are physical constants.',
    latex: '2\\cdot299792458^2',
    template: ['Multiply', '$m', ['Power', 299792458, 2]],
    steps: ({ m }) => {
      const c2 = 299792458 ** 2
      return [
        { label: 'square the speed of light', latex: `299792458^2=${show(c2)}` },
        { label: 'times the mass', latex: `${show(m)}\\cdot${show(c2)}=${show(m * c2)}` },
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
      return {
        name: guide.name,
        intro: guide.intro,
        values,
        steps: guide.steps(values),
        diagram: guide.diagram?.(values) ?? null,
      }
    }
  }
  return null
}
