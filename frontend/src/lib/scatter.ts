import { mulberry32 } from './random'

export type ScatterPosition = {
  top: number
  left: number
  tilt: number
  driftDuration: number
  driftDelay: number
}

type Box = { x1: number; y1: number; x2: number; y2: number }

// Regions cards must not cover (viewport %): the stage core and the dock.
const BLOCKED: Box[] = [
  { x1: 24, y1: 22, x2: 76, y2: 64 },
  { x1: 36, y1: 84, x2: 64, y2: 100 },
]

// Approximate compact-card footprint in viewport %.
const CARD = { w: 15, h: 13 }

// The free space around the blocked regions, as bands a whole card fits into.
const BANDS: Box[] = [
  { x1: 2, y1: 3, x2: 97, y2: 22 },
  { x1: 2, y1: 3, x2: 24, y2: 95 },
  { x1: 76, y1: 3, x2: 97, y2: 95 },
  { x1: 2, y1: 64, x2: 97, y2: 84 },
]

function intersects(a: Box, b: Box): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1
}

function cardBox(top: number, left: number, margin = 0): Box {
  return { x1: left - margin, y1: top - margin, x2: left + CARD.w + margin, y2: top + CARD.h + margin }
}

export function outsideBlocked(top: number, left: number): boolean {
  return !BLOCKED.some((b) => intersects(cardBox(top, left), b))
}

// Scatters cards across the free bands, keeping them apart. Bands are chosen
// by free area, so wide strips get more cards than thin columns.
export function scatterPositions(seed: number, count: number): ScatterPosition[] {
  const rand = mulberry32(seed)
  const weights = BANDS.map((b) => (b.x2 - b.x1 - CARD.w) * (b.y2 - b.y1 - CARD.h))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const placed: ScatterPosition[] = []
  for (let i = 0; i < count; i++) {
    let top = BANDS[0].y1
    let left = BANDS[0].x1
    for (let attempt = 0; attempt < 60; attempt++) {
      let pick = rand() * totalWeight
      let band = BANDS[0]
      for (let j = 0; j < BANDS.length; j++) {
        pick -= weights[j]
        if (pick <= 0) {
          band = BANDS[j]
          break
        }
      }
      top = band.y1 + rand() * (band.y2 - band.y1 - CARD.h)
      left = band.x1 + rand() * (band.x2 - band.x1 - CARD.w)
      if (!placed.some((p) => intersects(cardBox(p.top, p.left, 1.5), cardBox(top, left)))) break
    }
    placed.push({
      top,
      left,
      tilt: rand() * 6 - 3,
      driftDuration: 10 + rand() * 6,
      driftDelay: -(rand() * 10),
    })
  }
  return placed
}
