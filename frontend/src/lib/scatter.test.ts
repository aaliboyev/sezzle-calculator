import { describe, expect, it } from 'vitest'
import { outsideBlocked, scatterPositions } from './scatter'

describe('scatterPositions', () => {
  it('is deterministic for a seed', () => {
    expect(scatterPositions(7, 8)).toEqual(scatterPositions(7, 8))
  })

  it('differs between seeds', () => {
    expect(scatterPositions(1, 8)).not.toEqual(scatterPositions(2, 8))
  })

  it('places every card inside the viewport', () => {
    for (const seed of [1, 2, 3, 99]) {
      for (const p of scatterPositions(seed, 8)) {
        expect(p.top).toBeGreaterThanOrEqual(3)
        expect(p.top).toBeLessThanOrEqual(95)
        expect(p.left).toBeGreaterThanOrEqual(2)
        expect(p.left).toBeLessThanOrEqual(97)
      }
    }
  })

  it('keeps cards off the stage and dock regions', () => {
    for (const seed of [1, 2, 3, 4, 5, 42, 99]) {
      for (const p of scatterPositions(seed, 8)) {
        expect(outsideBlocked(p.top, p.left), `seed ${seed}: ${p.top},${p.left}`).toBe(true)
      }
    }
  })

  it('produces gentle tilts and slow drift timings', () => {
    for (const p of scatterPositions(5, 8)) {
      expect(Math.abs(p.tilt)).toBeLessThanOrEqual(3)
      expect(p.driftDuration).toBeGreaterThanOrEqual(10)
      expect(p.driftDuration).toBeLessThanOrEqual(16)
      expect(p.driftDelay).toBeLessThanOrEqual(0)
    }
  })
})
