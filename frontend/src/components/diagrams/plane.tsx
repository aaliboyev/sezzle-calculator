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
