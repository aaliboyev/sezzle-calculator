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

const GRID = [0, 0.25, 0.5, 0.75, 1]

export function PlaneGrid({ L, R, T, B }: { L: number; R: number; T: number; B: number }) {
  return (
    <>
      {GRID.map((t) => (
        <line key={`v${t}`} x1={L + t * (R - L)} y1={T} x2={L + t * (R - L)} y2={B} stroke="var(--muted)" strokeOpacity="0.18" />
      ))}
      {GRID.map((t) => (
        <line key={`h${t}`} x1={L} y1={T + t * (B - T)} x2={R} y2={T + t * (B - T)} stroke="var(--muted)" strokeOpacity="0.18" />
      ))}
    </>
  )
}
