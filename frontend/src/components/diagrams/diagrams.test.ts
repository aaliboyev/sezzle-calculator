import { describe, expect, it } from 'vitest'
import { GUIDES } from '../../engine/guides'
import { DIAGRAMS } from './registry'

describe('diagram registry', () => {
  it('every diagram is keyed by a real guide id', () => {
    const ids = new Set(GUIDES.map((g) => g.id))
    expect(Object.keys(DIAGRAMS).filter((id) => !ids.has(id))).toEqual([])
  })

  it('guide ids are unique', () => {
    expect(new Set(GUIDES.map((g) => g.id)).size).toBe(GUIDES.length)
  })
})
