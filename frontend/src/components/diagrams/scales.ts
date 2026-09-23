// Shared scaffolding for the coordinate-plane diagrams.
export function planeScales(x1: number, y1: number, x2: number, y2: number) {
  const spanX = Math.abs(x2 - x1) || 1
  const spanY = Math.abs(y2 - y1) || 1
  const loX = Math.min(x1, x2) - spanX * 0.25
  const hiX = Math.max(x1, x2) + spanX * 0.25
  const loY = Math.min(y1, y2) - spanY * 0.25
  const hiY = Math.max(y1, y2) + spanY * 0.25
  const L = 30
  const R = 196
  const T = 22
  const B = 116
  return {
    L,
    R,
    T,
    B,
    sx: (x: number) => L + ((x - loX) / (hiX - loX)) * (R - L),
    sy: (y: number) => B - ((y - loY) / (hiY - loY)) * (B - T),
  }
}
