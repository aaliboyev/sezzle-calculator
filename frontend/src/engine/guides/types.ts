export type GuideStep = { label: string; latex: string }

export type GuideValues = Record<string, number>

// Diagrams are data: pure shape lists in a 220-wide viewBox, rendered by a
// single component. Tones map to theme colors there.
export type Tone = 'peach' | 'peach-strong' | 'violet' | 'orange' | 'muted'
export type Fill = 'violet-soft' | 'orange-soft' | 'surface' | 'none'

export type DiagramShape =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; tone?: Tone; width?: number; dash?: boolean }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill?: Fill; tone?: Tone; rx?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; tone?: Tone; filled?: boolean }
  | { kind: 'polygon' | 'polyline'; points: [number, number][]; fill?: Fill; tone?: Tone; width?: number }
  | { kind: 'text'; x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; tone?: Tone }

export type DiagramSpec = { height: 70 | 140; shapes: DiagramShape[] }

export type Guide = {
  name: string
  intro: string
  latex: string
  template: Template
  accept?: (values: GuideValues, latex: string) => boolean
  steps: (values: GuideValues) => GuideStep[]
  // Returns null when the values are out of drawable range.
  diagram?: (values: GuideValues) => DiagramSpec | null
}

export type GuideMatch = {
  name: string
  intro: string
  values: GuideValues
  steps: GuideStep[]
  diagram: DiagramSpec | null
}

export type Template = number | string | readonly [string, ...Template[]]
