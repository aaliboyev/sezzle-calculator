export type ScatterSlot = { top: number; left?: number; right?: number }

export type ScatterPosition = {
  top: number
  left?: number
  right?: number
  tilt: number
  driftDuration: number
  driftDelay: number
}

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Jitters each slot deterministically for a seed: same seed, same layout.
export function scatterPositions(seed: number, slots: ScatterSlot[]): ScatterPosition[] {
  const rand = mulberry32(seed)
  return slots.map((slot) => {
    const top = slot.top + rand() * 12 - 6
    const side = rand() * 8 - 4
    return {
      top,
      left: slot.left !== undefined ? slot.left + side : undefined,
      right: slot.right !== undefined ? slot.right + side : undefined,
      tilt: rand() * 6 - 3,
      driftDuration: 10 + rand() * 6,
      driftDelay: -(rand() * 10),
    }
  })
}
