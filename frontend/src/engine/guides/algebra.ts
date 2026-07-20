import type { Guide } from './types'
import { show } from './helpers'

export const ALGEBRA: Guide[] = [
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
]
