import { mulberry32 } from '../lib/random'

export type CategoryId =
  | 'geometry'
  | 'money'
  | 'statistics'
  | 'roots'
  | 'curiosities'
  | 'science'
  | 'edge'

export type Category = { id: CategoryId; label: string }

export const CATEGORIES: Category[] = [
  { id: 'geometry', label: 'geometry' },
  { id: 'money', label: 'money' },
  { id: 'statistics', label: 'statistics' },
  { id: 'roots', label: 'roots & powers' },
  { id: 'curiosities', label: 'curiosities' },
  { id: 'science', label: 'science' },
  { id: 'edge', label: 'edge cases' },
]

export type Formula = {
  name: string
  latex: string
  about: string
  category: CategoryId
}

export const FORMULAS: Formula[] = [
  // geometry
  { name: 'pythagoras', latex: '\\sqrt{3^2+4^2}', about: 'Hypotenuse from the two legs of a right triangle.', category: 'geometry' },
  { name: 'square diagonal', latex: '5\\cdot\\sqrt{2}', about: 'The diagonal of a square is its side times √2.', category: 'geometry' },
  { name: 'distance', latex: '\\sqrt{(7-3)^2+(6-3)^2}', about: 'Distance between two points is pythagoras over the coordinate differences.', category: 'geometry' },
  { name: 'triangle area', latex: '\\frac{10\\cdot6}{2}', about: 'Half of base times height.', category: 'geometry' },
  { name: 'rectangle area', latex: '12\\cdot8', about: 'Width times height.', category: 'geometry' },
  { name: 'cube volume', latex: '4^3', about: 'Side length cubed.', category: 'geometry' },
  { name: 'slope', latex: '\\frac{9-5}{6-2}', about: 'Rise over run between two points.', category: 'geometry' },
  // money
  { name: 'tip', latex: '85\\cdot18\\%', about: 'A percentage of an amount — 18% means 0.18.', category: 'money' },
  { name: 'discount', latex: '120-120\\cdot25\\%', about: 'A percentage off a price.', category: 'money' },
  { name: 'markup', latex: '80\\cdot(1+35\\%)', about: 'Cost scaled up by a margin.', category: 'money' },
  { name: 'sales tax', latex: '60\\cdot(1+8.25\\%)', about: 'Price with tax applied on top.', category: 'money' },
  { name: 'before tax', latex: '\\frac{129.99}{1+8\\%}', about: 'Divide by the tax multiplier to undo it.', category: 'money' },
  { name: 'compound growth', latex: '1000\\cdot(1+\\frac{4.5}{100})^{10}', about: 'A principal compounding at a rate over n periods.', category: 'money' },
  { name: 'simple interest', latex: '2500\\cdot6\\%\\cdot3', about: 'Principal times rate times years, no compounding.', category: 'money' },
  { name: 'split the bill', latex: '\\frac{240+240\\cdot20\\%}{6}', about: 'Total with tip, divided among the table.', category: 'money' },
  // statistics
  { name: 'mean', latex: '\\frac{4+9+2}{3}', about: 'Sum divided by the count.', category: 'statistics' },
  { name: 'mean of four', latex: '\\frac{82+91+76+88}{4}', about: 'The same mean, one more value.', category: 'statistics' },
  { name: 'weighted average', latex: '0.7\\cdot86+0.3\\cdot94', about: 'Each value scaled by its weight; weights sum to 1.', category: 'statistics' },
  { name: 'midpoint', latex: '\\frac{12+38}{2}', about: 'Halfway between two values.', category: 'statistics' },
  { name: 'sum of squares', latex: '3^2+4^2+5^2', about: 'The building block of variance and distance.', category: 'statistics' },
  // roots & powers
  { name: 'nested roots', latex: '\\sqrt{\\sqrt{16}}', about: 'A root of a root is the fourth root.', category: 'roots' },
  { name: 'power tower', latex: '2^{3^2}', about: 'Exponents associate right: the top resolves first.', category: 'roots' },
  { name: 'geometric mean', latex: '\\sqrt{8\\cdot18}', about: 'The multiplicative middle of two numbers.', category: 'roots' },
  { name: 'golden ratio', latex: '\\frac{1+\\sqrt{5}}{2}', about: 'φ — the ratio that equals its own reciprocal plus one.', category: 'roots' },
  { name: 'discriminant', latex: '7^2-4\\cdot3\\cdot2', about: 'b²−4ac decides how many real roots a quadratic has.', category: 'roots' },
  { name: 'exponent laws', latex: '\\frac{2^{10}}{2^6}', about: 'Dividing powers subtracts exponents: 2¹⁰⁄2⁶ = 2⁴.', category: 'roots' },
  { name: 'root of a power', latex: '\\sqrt{10^6}', about: 'A square root halves the exponent.', category: 'roots' },
  // curiosities
  { name: 'float trap', latex: '0.1+0.2', about: 'Binary floats cannot store 0.1 exactly — see what comes back.', category: 'curiosities' },
  { name: 'repeating third', latex: '\\frac{1}{3}', about: 'A decimal that never ends, cut off at float precision.', category: 'curiosities' },
  { name: 'chessboard', latex: '2^{63}', about: 'Grains of rice on the last square of the fable.', category: 'curiosities' },
  { name: 'big and tiny', latex: '10^{15}+10^{-15}', about: 'The tiny addend vanishes — floats have limited significant digits.', category: 'curiosities' },
  { name: 'e by compounding', latex: '(1+\\frac{1}{1000000})^{1000000}', about: 'Compound interest taken to the limit approaches e.', category: 'curiosities' },
  { name: 'almost pi', latex: '\\frac{355}{113}', about: 'A fraction that matches π to six decimal places.', category: 'curiosities' },
  // science
  { name: 'E = mc²', latex: '2\\cdot299792458^2', about: 'Two kilograms of matter as pure energy, in joules.', category: 'science' },
  { name: 'average speed', latex: '\\frac{150}{2.5}', about: 'Distance over time.', category: 'science' },
  { name: 'BMI', latex: '\\frac{70}{1.75^2}', about: 'Mass over height squared.', category: 'science' },
  // edge cases
  { name: 'division by zero', latex: '\\frac{1}{0}', about: 'The server refuses politely instead of inventing a number.', category: 'edge' },
  { name: 'zero over zero', latex: '\\frac{0}{0}', about: 'Indeterminate — a different refusal than 1/0.', category: 'edge' },
  { name: 'root of a negative', latex: '\\sqrt{-9}', about: 'No real answer; the API says so.', category: 'edge' },
  { name: 'overflow', latex: '10^{308}\\cdot10', about: 'Past the edge of a 64-bit float.', category: 'edge' },
]

// Deterministic sample for the floating cards: seeded shuffle, first n.
export function sampleFormulas(seed: number, count: number): Formula[] {
  const rand = mulberry32(seed)
  const pool = [...FORMULAS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
