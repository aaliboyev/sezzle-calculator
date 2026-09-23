export type GuideStep = { label: string; latex: string }

export type GuideValues = Record<string, number>

export type Guide = {
  id: string
  name: string
  intro: string
  latex: string
  template: Template
  accept?: (values: GuideValues, latex: string) => boolean
  steps: (values: GuideValues) => GuideStep[]
}

// What a matched guide carries to the UI. Drawing stays client-side, keyed by
// id, so this shape can come from the server unchanged.
export type GuideMatch = {
  id: string
  name: string
  intro: string
  values: GuideValues
  steps: GuideStep[]
}

export type Template = number | string | readonly [string, ...Template[]]
