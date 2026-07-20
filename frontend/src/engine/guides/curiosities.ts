import type { Guide } from './types'
import { show } from './helpers'

export const CURIOSITIES: Guide[] = [
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
]
