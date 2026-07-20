import type { Guide } from './types'
import { show } from './helpers'

export const APPLIED: Guide[] = [
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
