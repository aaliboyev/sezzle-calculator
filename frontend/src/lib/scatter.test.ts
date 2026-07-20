import { describe, expect, it } from 'vitest'
import { scatterPositions, type ScatterSlot } from './scatter'

const SLOTS: ScatterSlot[] = [
  { top: 16, left: 11 },
  { top: 44, left: 6 },
  { top: 15, right: 11 },
  { top: 45, right: 6 },
]

describe('scatterPositions', () => {
  it('is deterministic for a seed', () => {
    expect(scatterPositions(7, SLOTS)).toEqual(scatterPositions(7, SLOTS))
  })

  it('differs between seeds', () => {
    expect(scatterPositions(1, SLOTS)).not.toEqual(scatterPositions(2, SLOTS))
  })

  it('stays near its slot and keeps the slot side', () => {
    for (const seed of [1, 2, 3, 99]) {
      const positions = scatterPositions(seed, SLOTS)
      positions.forEach((p, i) => {
        expect(Math.abs(p.top - SLOTS[i].top)).toBeLessThanOrEqual(6)
        if (SLOTS[i].left !== undefined) {
          expect(p.right).toBeUndefined()
          expect(Math.abs(p.left! - SLOTS[i].left!)).toBeLessThanOrEqual(4)
        } else {
          expect(p.left).toBeUndefined()
          expect(Math.abs(p.right! - SLOTS[i].right!)).toBeLessThanOrEqual(4)
        }
      })
    }
  })

  it('produces gentle tilts and slow drift timings', () => {
    for (const p of scatterPositions(5, SLOTS)) {
      expect(Math.abs(p.tilt)).toBeLessThanOrEqual(3)
      expect(p.driftDuration).toBeGreaterThanOrEqual(10)
      expect(p.driftDuration).toBeLessThanOrEqual(16)
      expect(p.driftDelay).toBeLessThanOrEqual(0)
    }
  })
})
