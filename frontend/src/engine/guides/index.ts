import { parseMathJSON } from '../translate'
import type { Guide, GuideMatch, GuideValues, Template } from './types'
import { ALGEBRA } from './algebra'
import { APPLIED } from './applied'
import { BASICS } from './basics'
import { CURIOSITIES } from './curiosities'
import { GEOMETRY } from './geometry'

export type * from './types'

// Order matters: matchGuide takes the first template that fits, so specific
// shapes must precede broader ones (see the greediness notes per group).
export const GUIDES: Guide[] = [...BASICS, ...CURIOSITIES, ...GEOMETRY, ...ALGEBRA, ...APPLIED]

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
