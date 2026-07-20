import type { Guide } from './types'
import { show } from './helpers'

export const GEOMETRY: Guide[] = [
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
]
