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

function matchNode(node: unknown, template: Template, values: GuideValues): boolean {
  if (typeof template === 'string' && template.startsWith('$')) {
    if (typeof node !== 'number') return false
    const slot = template.slice(1)
    if (slot in values && values[slot] !== node) return false
    values[slot] = node
    return true
  }
  if (typeof template === 'number') return node === template
  if (!Array.isArray(node) || node.length !== template.length) return false
  const [head, ...args] = template
  return node[0] === head && args.every((t, i) => matchNode(node[i + 1], t, values))
}

// tree is the server's parse of latex; latex is kept for accept predicates
// that look at notation the tree folds away, like a literal percent sign.
export function matchGuide(tree: unknown, latex: string): GuideMatch | null {
  for (const guide of GUIDES) {
    const values: GuideValues = {}
    if (matchNode(tree, guide.template, values) && (guide.accept?.(values, latex) ?? true)) {
      return { id: guide.id, name: guide.name, intro: guide.intro, values, steps: guide.steps(values) }
    }
  }
  return null
}
