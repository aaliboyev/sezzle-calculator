import type { ComponentType } from 'react'
import { formatResult } from '../lib/format'
import type { DiagramShape, DiagramSpec, Fill, Tone, GuideValues } from '../engine/guides'

// Bespoke diagram contract: a component gets the live slot bindings and
// re-renders as the user edits digits. Guard first and return null when the
// values are not drawable. viewBox 220 wide, theme tones only, class
// "guide-diagram". CSS transitions/transforms may animate; the global
// reduced-motion rule silences them.
export type DiagramProps = { values: GuideValues }

function ECompoundingDiagram({ values }: DiagramProps) {
  const n = values.n
  if (!(n >= 1 && Number.isFinite(n))) return null
  const top = 22
  const bottom = 112
  const left = 18
  const right = 206
  const vMin = 2
  const vMax = Math.E
  const maxN = Math.max(n, 1000)
  const xOf = (s: number) => left + (Math.log10(s) / Math.log10(maxN)) * (right - left)
  const yOf = (v: number) => bottom - ((Math.min(v, vMax) - vMin) / (vMax - vMin)) * (bottom - top)
  const samples = [...new Set([1, 2, 5, 10, 100, 1000])].filter((s) => s !== n).sort((p, q) => p - q)
  const value = Math.pow(1 + 1 / n, n)
  const you = { x: xOf(n), y: yOf(value) }
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <line x1={left} y1={top} x2={right} y2={top} stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={right} y={top - 5} textAnchor="end" className="accent">
        e
      </text>
      {samples.map((s) => (
        <circle key={s} cx={xOf(s)} cy={yOf(Math.pow(1 + 1 / s, s))} r="3" fill="var(--peach-strong)" />
      ))}
      <circle cx={you.x} cy={you.y} r="4" fill="var(--orange)" />
      <text x={Math.min(Math.max(you.x, 52), 206)} y={you.y + 16} textAnchor="end" className="accent">
        {formatResult(value)}
      </text>
    </svg>
  )
}

function ChessboardDiagram({ values }: DiagramProps) {
  const exp = values.k
  if (!(Number.isInteger(exp) && exp >= 1 && exp <= 1023)) return null
  const bars = Math.min(8, exp + 1)
  const top = 12
  const bottom = 58
  const left = 14
  const barW = 18
  const gap = (206 - left - bars * barW) / (bars - 1)
  const usable = bottom - top - 3
  const cells = Array.from({ length: bars }, (_, i) => Math.round((i / (bars - 1)) * exp))
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      {cells.map((e, i) => {
        const h = 3 + (e / exp) * usable
        const x = left + i * (barW + gap)
        return (
          <rect
            key={i}
            x={x}
            y={bottom - h}
            width={barW}
            height={h}
            rx="2"
            fill={i === bars - 1 ? 'var(--orange)' : 'rgba(255, 140, 90, 0.45)'}
          />
        )
      })}
      <text x="206" y="9" textAnchor="end" className="accent">
        {`2^${exp}`}
      </text>
    </svg>
  )
}

function BigTinyDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!(a > 0 && b > 0 && a <= 308 && b <= 308)) return null
  const left = 16
  const right = 204
  const axisY = 46
  const tinyX = left
  const bigX = right
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <line x1={left} y1={axisY} x2={right} y2={axisY} stroke="var(--muted)" strokeWidth="1" />
      <line x1={tinyX} y1={axisY} x2={tinyX} y2={axisY - 10} stroke="var(--peach-strong)" strokeWidth="2" />
      <line x1={bigX} y1={axisY} x2={bigX} y2={axisY - 34} stroke="var(--violet)" strokeWidth="2" />
      <circle cx={bigX} cy={axisY - 34} r="3" fill="var(--orange)" />
      <line x1={tinyX} y1="16" x2={bigX} y2="16" stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
      <text x={(tinyX + bigX) / 2} y="12" textAnchor="middle" className="accent">
        {`${formatResult(a + b)} orders`}
      </text>
      <text x={tinyX} y={axisY + 12} textAnchor="start">{`10^-${formatResult(b)}`}</text>
      <text x={bigX} y={axisY + 12} textAnchor="end">{`10^${formatResult(a)}`}</text>
    </svg>
  )
}

function planeScales(x1: number, y1: number, x2: number, y2: number) {
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

function PlaneGrid({ L, R, T, B }: { L: number; R: number; T: number; B: number }) {
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

function DistanceDiagram({ values }: DiagramProps) {
  const { x1, y1, x2, y2 } = values
  const ok = [x1, y1, x2, y2].every((n) => Number.isFinite(n) && Math.abs(n) <= 9999)
  if (!ok || (x1 === x2 && y1 === y2)) return null
  const { L, R, T, B, sx, sy } = planeScales(x1, y1, x2, y2)
  const p1x = sx(x1)
  const p1y = sy(y1)
  const p2x = sx(x2)
  const p2y = sy(y2)
  const cx = sx(x2)
  const cy = sy(y1)
  const tick = 7
  const hx = p1x >= cx ? tick : -tick
  const vy = p2y >= cy ? tick : -tick
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <PlaneGrid L={L} R={R} T={T} B={B} />
      <line x1={p1x} y1={p1y} x2={cx} y2={cy} stroke="var(--peach-strong)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1={cx} y1={cy} x2={p2x} y2={p2y} stroke="var(--peach-strong)" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points={`${cx + hx},${cy} ${cx + hx},${cy + vy} ${cx},${cy + vy}`} fill="none" stroke="var(--muted)" strokeWidth="1" />
      <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="var(--violet)" strokeWidth="2" />
      <circle cx={p1x} cy={p1y} r="3.5" fill="var(--peach-strong)" />
      <circle cx={p2x} cy={p2y} r="3.5" fill="var(--orange)" />
      <text x={p1x} y={p1y + 16} textAnchor="middle">{`(${formatResult(x1)}, ${formatResult(y1)})`}</text>
      <text x={p2x} y={p2y - 8} textAnchor="middle">{`(${formatResult(x2)}, ${formatResult(y2)})`}</text>
      <text x={(p1x + p2x) / 2 + 8} y={(p1y + p2y) / 2 - 6} className="accent">
        {formatResult(Math.hypot(x2 - x1, y2 - y1))}
      </text>
    </svg>
  )
}

function SlopeDiagram({ values }: DiagramProps) {
  const { x1, y1, x2, y2 } = values
  const ok = [x1, y1, x2, y2].every((n) => Number.isFinite(n) && Math.abs(n) <= 9999)
  const run = x2 - x1
  const rise = y2 - y1
  if (!ok || run === 0) return null
  const { L, R, T, B, sx, sy } = planeScales(x1, y1, x2, y2)
  const p1x = sx(x1)
  const p1y = sy(y1)
  const p2x = sx(x2)
  const p2y = sy(y2)
  const cx = sx(x2)
  const cy = sy(y1)
  const ex = (p2x - p1x) * 0.16
  const ey = (p2y - p1y) * 0.16
  const tick = 7
  const hx = p1x >= cx ? tick : -tick
  const vy = p2y >= cy ? tick : -tick
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <PlaneGrid L={L} R={R} T={T} B={B} />
      <line x1={p1x - ex} y1={p1y - ey} x2={p2x + ex} y2={p2y + ey} stroke="var(--violet)" strokeWidth="2" />
      <line x1={p1x} y1={p1y} x2={cx} y2={cy} stroke="var(--peach-strong)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1={cx} y1={cy} x2={p2x} y2={p2y} stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points={`${cx + hx},${cy} ${cx + hx},${cy + vy} ${cx},${cy + vy}`} fill="none" stroke="var(--muted)" strokeWidth="1" />
      <circle cx={p1x} cy={p1y} r="3.5" fill="var(--peach-strong)" />
      <circle cx={p2x} cy={p2y} r="3.5" fill="var(--orange)" />
      <text x={(p1x + cx) / 2} y={p1y + 15} textAnchor="middle">
        {formatResult(run)}
      </text>
      <text x={cx + 8} y={(cy + p2y) / 2} textAnchor="start">
        {formatResult(rise)}
      </text>
      <text x={(p1x + p2x) / 2 - 6} y={(p1y + p2y) / 2 - 8} textAnchor="end" className="accent">
        {formatResult(rise / run)}
      </text>
    </svg>
  )
}

function TriangleAreaDiagram({ values }: DiagramProps) {
  const { b, h } = values
  if (!(b > 0 && h > 0 && b <= 9999 && h <= 9999)) return null
  const scale = Math.min(176 / b, 96 / h)
  const bw = b * scale
  const hh = h * scale
  const x0 = 22
  const baseY = 122
  const apexX = x0 + bw * 0.38
  const apexY = baseY - hh
  const tick = 9
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <polygon
        points={`${x0},${baseY} ${x0 + bw},${baseY} ${apexX},${apexY}`}
        fill="rgba(167, 139, 250, 0.08)"
        stroke="var(--peach-strong)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1={apexX} y1={apexY} x2={apexX} y2={baseY} stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline
        points={`${apexX + tick},${baseY} ${apexX + tick},${baseY - tick} ${apexX},${baseY - tick}`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1"
      />
      <text x={x0 + bw / 2} y={baseY + 16} textAnchor="middle">
        {formatResult(b)}
      </text>
      <text x={apexX - 8} y={baseY - hh / 2} textAnchor="end">
        {formatResult(h)}
      </text>
      <text x={x0 + bw * 0.55} y={baseY - hh * 0.3} className="accent">
        {formatResult((b * h) / 2)}
      </text>
    </svg>
  )
}

function SquareDiagonalDiagram({ values }: DiagramProps) {
  const { s } = values
  if (!(s > 0 && s <= 9999)) return null
  const side = 92
  const x0 = 64
  const y0 = 24
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <rect x={x0} y={y0} width={side} height={side} fill="rgba(167, 139, 250, 0.08)" stroke="var(--peach-strong)" strokeWidth="1.5" />
      <line x1={x0} y1={y0 + side} x2={x0 + side} y2={y0} stroke="var(--violet)" strokeWidth="2" />
      <rect x={x0} y={y0 + side - 12} width="12" height="12" fill="none" stroke="var(--muted)" strokeWidth="1" />
      <text x={x0 + side / 2} y={y0 + side + 16} textAnchor="middle">
        {formatResult(s)}
      </text>
      <text x={x0 + side / 2 + 10} y={y0 + side / 2 - 6} className="accent">
        {formatResult(s * Math.SQRT2)}
      </text>
    </svg>
  )
}

function GeometricMeanDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!(a > 0 && b > 0 && a <= 9999 && b <= 9999)) return null
  const gm = Math.sqrt(a * b)
  const k = 88 / Math.max(a, b, gm)
  const rw = a * k
  const rh = b * k
  const sq = gm * k
  const baseY = 118
  const rectX = 64 - rw / 2
  const sqX = 166 - sq / 2
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <rect x={rectX} y={baseY - rh} width={rw} height={rh} fill="rgba(255, 255, 255, 0.05)" stroke="var(--peach-strong)" strokeWidth="1.5" />
      <text x={rectX + rw / 2} y={baseY + 15} textAnchor="middle">
        {formatResult(a)}
      </text>
      <text x={rectX - 8} y={baseY - rh / 2} textAnchor="end">
        {formatResult(b)}
      </text>
      <rect x={sqX} y={baseY - sq} width={sq} height={sq} fill="rgba(255, 140, 90, 0.45)" stroke="var(--orange)" strokeWidth="1.5" />
      <text x={sqX + sq / 2} y={baseY + 15} textAnchor="middle" className="accent">
        {formatResult(gm)}
      </text>
      <text x="118" y={baseY - 22} textAnchor="middle">
        =
      </text>
    </svg>
  )
}

function DiscriminantDiagram({ values }: DiagramProps) {
  const { b, a, c } = values
  const disc = b * b - 4 * a * c
  if (!Number.isFinite(disc) || a === 0) return null
  const up = a > 0
  const cx = 110
  const k = 0.012
  const vy = up ? 108 : 32
  const pts: string[] = []
  for (let x = 22; x <= 198; x += 4) {
    const dx = x - cx
    const y = up ? vy - k * dx * dx : vy + k * dx * dx
    pts.push(`${x},${y.toFixed(1)}`)
  }
  const axisY = disc === 0 ? vy : disc > 0 ? 70 : up ? 124 : 16
  const off = Math.sqrt(Math.abs(vy - axisY) / k)
  const roots = disc > 0 ? [cx - off, cx + off] : disc === 0 ? [cx] : []
  const label = disc > 0 ? 'two real roots' : disc === 0 ? 'one real root' : 'no real roots'
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke="var(--violet)" strokeWidth="2" strokeLinejoin="round" />
      <line x1="10" y1={axisY} x2="210" y2={axisY} stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
      {roots.map((rx, i) => (
        <circle key={i} cx={rx} cy={axisY} r="4" fill="var(--orange)" />
      ))}
      <text x={cx} y="15" textAnchor="middle" className="accent">{`Δ = ${formatResult(disc)}`}</text>
      <text x={cx} y="133" textAnchor="middle">
        {label}
      </text>
    </svg>
  )
}

function GoldenDiagram({ values }: DiagramProps) {
  const { a } = values
  const phi = (1 + Math.sqrt(a)) / 2
  if (!(a > 1) || !Number.isFinite(phi)) return null
  const W = 180
  const H = W / phi
  if (!(H > 0 && H <= 132)) return null
  const x0 = 20
  const y0 = (140 - H) / 2
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <rect x={x0} y={y0} width={W} height={H} fill="rgba(255, 255, 255, 0.05)" stroke="var(--peach-strong)" strokeWidth="1.5" />
      <rect x={x0} y={y0} width={H} height={H} fill="rgba(167, 139, 250, 0.08)" stroke="var(--violet)" strokeWidth="1.5" />
      <path d={`M ${x0} ${y0 + H} A ${H} ${H} 0 0 1 ${x0 + H} ${y0}`} fill="none" stroke="var(--orange)" strokeWidth="1.5" />
      <text x={x0 + W / 2} y={y0 - 5} textAnchor="middle" className="accent">{`φ = ${formatResult(phi)}`}</text>
      <text x={x0 + H / 2} y={y0 + H / 2 + 4} textAnchor="middle">
        1
      </text>
      <text x={x0 + H + (W - H) / 2} y={y0 + H / 2 + 4} textAnchor="middle">
        {(phi - 1).toFixed(3)}
      </text>
    </svg>
  )
}

function WeightedDiagram({ values }: DiagramProps) {
  const { w1, x1, w2, x2 } = values
  const total = w1 + w2
  if (!(total > 0) || x1 === x2 || !Number.isFinite(x1) || !Number.isFinite(x2)) return null
  const avg = w1 * x1 + w2 * x2
  const lo = Math.min(x1, x2)
  const hi = Math.max(x1, x2)
  const map = (v: number) => 20 + ((v - lo) / (hi - lo)) * 180
  const bx = Math.max(20, Math.min(200, map(avg)))
  const r1 = 4 + (Math.abs(w1) / total) * 9
  const r2 = 4 + (Math.abs(w2) / total) * 9
  const beamY = 74
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      <line x1="20" y1={beamY} x2="200" y2={beamY} stroke="var(--muted)" strokeWidth="2" />
      <circle cx={map(x1)} cy={beamY} r={r1} fill="var(--peach-strong)" />
      <circle cx={map(x2)} cy={beamY} r={r2} fill="var(--peach-strong)" />
      <line x1={bx} y1={beamY - 24} x2={bx} y2={beamY + 6} stroke="var(--orange)" strokeWidth="1" strokeDasharray="4 4" />
      <polygon points={`${bx},${beamY + 6} ${bx - 7},${beamY + 20} ${bx + 7},${beamY + 20}`} fill="var(--orange)" />
      <text x={map(x1)} y={beamY - r1 - 6} textAnchor="middle">
        {formatResult(x1)}
      </text>
      <text x={map(x2)} y={beamY - r2 - 6} textAnchor="middle">
        {formatResult(x2)}
      </text>
      <text x={map(x1)} y={beamY + 32} textAnchor="middle">
        {formatResult(w1)}
      </text>
      <text x={map(x2)} y={beamY + 32} textAnchor="middle">
        {formatResult(w2)}
      </text>
      <text x={bx} y={beamY - 28} textAnchor="middle" className="accent">
        {formatResult(avg)}
      </text>
    </svg>
  )
}

function ExponentDiagram({ values }: DiagramProps) {
  const { a, m, n } = values
  if (!Number.isInteger(m) || !Number.isInteger(n) || m < 0 || n < 0) return null
  const hi = Math.max(m, n)
  if (hi < 1 || hi > 14) return null
  const base = formatResult(a)
  const cancel = Math.min(m, n)
  const tile = Math.min(14, 180 / hi)
  const gap = 2
  const rowW = (t: number) => t * (tile + gap) - gap
  const cellX = (t: number, i: number) => 110 - rowW(t) / 2 + i * (tile + gap)
  const cell = (t: number, i: number, y: number, active: boolean) => (
    <g key={`${y}-${i}`}>
      <rect
        x={cellX(t, i)}
        y={y}
        width={tile}
        height={tile}
        rx="2"
        fill={active ? 'rgba(255, 140, 90, 0.45)' : 'rgba(255, 255, 255, 0.05)'}
        stroke={active ? 'var(--orange)' : 'var(--muted)'}
        strokeWidth="1"
      />
      <text x={cellX(t, i) + tile / 2} y={y + tile / 2 + 3} textAnchor="middle" style={{ fontSize: 8 }}>
        {base}
      </text>
      {!active && (
        <line x1={cellX(t, i)} y1={y} x2={cellX(t, i) + tile} y2={y + tile} stroke="var(--muted)" strokeWidth="1" />
      )}
    </g>
  )
  return (
    <svg className="guide-diagram" viewBox="0 0 220 140" aria-hidden="true">
      {Array.from({ length: m }, (_, i) => cell(m, i, 24, i >= cancel))}
      <line x1="12" y1="62" x2="208" y2="62" stroke="var(--violet)" strokeWidth="1.5" />
      {Array.from({ length: n }, (_, i) => cell(n, i, 84, i >= cancel))}
      <text x="110" y="128" textAnchor="middle" className="accent">
        {`${base}^${formatResult(m - n)} = ${formatResult(Math.pow(a, m - n))}`}
      </text>
    </svg>
  )
}

function MidpointDiagram({ values }: DiagramProps) {
  const { a, b } = values
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null
  const y = 40
  const xa = 15
  const xb = 205
  const xm = (xa + xb) / 2
  return (
    <svg className="guide-diagram" viewBox="0 0 220 70" aria-hidden="true">
      <line x1={xa} y1={y} x2={xb} y2={y} stroke="var(--muted)" strokeWidth="2" />
      <line x1={xa} y1={y - 6} x2={xa} y2={y + 6} stroke="var(--peach-strong)" strokeWidth="2" />
      <line x1={xb} y1={y - 6} x2={xb} y2={y + 6} stroke="var(--peach-strong)" strokeWidth="2" />
      <line x1={xm} y1={y - 10} x2={xm} y2={y + 10} stroke="var(--orange)" strokeWidth="2" />
      <circle cx={xm} cy={y} r="3.5" fill="var(--orange)" />
      <text x={xa} y={y + 20} textAnchor="middle">
        {formatResult(a)}
      </text>
      <text x={xb} y={y + 20} textAnchor="middle">
        {formatResult(b)}
      </text>
      <text x={xm} y={y - 14} textAnchor="middle" className="accent">
        {formatResult((a + b) / 2)}
      </text>
    </svg>
  )
}

// Guides with a bespoke component; everything else falls back to the
// data-spec renderer below.
const BESPOKE: Record<string, ComponentType<DiagramProps>> = {
  'e by compounding': ECompoundingDiagram,
  chessboard: ChessboardDiagram,
  'big and tiny': BigTinyDiagram,
  distance: DistanceDiagram,
  slope: SlopeDiagram,
  'triangle area': TriangleAreaDiagram,
  'square diagonal': SquareDiagonalDiagram,
  'geometric mean': GeometricMeanDiagram,
  discriminant: DiscriminantDiagram,
  'golden ratio': GoldenDiagram,
  'weighted average': WeightedDiagram,
  'exponent laws': ExponentDiagram,
  midpoint: MidpointDiagram,
}

const TONES: Record<Tone, string> = {
  peach: 'var(--peach)',
  'peach-strong': 'var(--peach-strong)',
  violet: 'var(--violet)',
  orange: 'var(--orange)',
  muted: 'var(--muted)',
}

const FILLS: Record<Fill, string> = {
  'violet-soft': 'rgba(167, 139, 250, 0.08)',
  'orange-soft': 'rgba(255, 140, 90, 0.45)',
  surface: 'rgba(255, 255, 255, 0.05)',
  none: 'none',
}

function stroke(tone?: Tone): string | undefined {
  return tone ? TONES[tone] : undefined
}

function Shape({ shape }: { shape: DiagramShape }) {
  switch (shape.kind) {
    case 'line':
      return (
        <line
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          stroke={stroke(shape.tone) ?? TONES.muted}
          strokeWidth={shape.width ?? 1.5}
          strokeDasharray={shape.dash ? '4 4' : undefined}
          strokeLinecap="round"
        />
      )
    case 'rect':
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.rx}
          fill={shape.fill ? FILLS[shape.fill] : 'none'}
          stroke={stroke(shape.tone)}
        />
      )
    case 'circle':
      return (
        <circle
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={shape.filled ? (stroke(shape.tone) ?? TONES.peach) : 'none'}
          stroke={shape.filled ? undefined : stroke(shape.tone)}
        />
      )
    case 'polygon':
    case 'polyline': {
      const points = shape.points.map(([x, y]) => `${x},${y}`).join(' ')
      const common = {
        points,
        fill: shape.fill ? FILLS[shape.fill] : 'none',
        stroke: stroke(shape.tone),
        strokeWidth: shape.width ?? 1.5,
        strokeLinejoin: 'round' as const,
      }
      return shape.kind === 'polygon' ? <polygon {...common} /> : <polyline {...common} />
    }
    case 'text':
      return (
        <text
          x={shape.x}
          y={shape.y}
          textAnchor={shape.anchor}
          className={shape.tone === 'peach-strong' ? 'accent' : undefined}
        >
          {shape.text}
        </text>
      )
  }
}

export function Diagram({
  name,
  values,
  spec,
}: {
  name: string
  values: GuideValues
  spec: DiagramSpec | null
}) {
  const Bespoke = BESPOKE[name]
  if (Bespoke) return <Bespoke values={values} />
  if (!spec) return null
  return (
    <svg className="guide-diagram" viewBox={`0 0 220 ${spec.height}`} aria-hidden="true">
      {spec.shapes.map((shape, i) => (
        <Shape key={i} shape={shape} />
      ))}
    </svg>
  )
}
