import type { DiagramShape, DiagramSpec, Fill, Tone } from '../../engine/guides'

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

// Renders the declarative shape specs guides produce as data.
export function SpecDiagram({ spec }: { spec: DiagramSpec | null }) {
  if (!spec) return null
  return (
    <svg className="guide-diagram" viewBox={`0 0 220 ${spec.height}`} aria-hidden="true">
      {spec.shapes.map((shape, i) => (
        <Shape key={i} shape={shape} />
      ))}
    </svg>
  )
}
