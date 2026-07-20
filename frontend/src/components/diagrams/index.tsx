import type { ComponentType } from 'react'
import type { DiagramSpec, GuideValues } from '../../engine/guides'
import { BigTinyDiagram } from './BigTiny'
import { ChessboardDiagram } from './Chessboard'
import { DiscriminantDiagram } from './Discriminant'
import { DistanceDiagram } from './Distance'
import { ECompoundingDiagram } from './ECompounding'
import { ExponentDiagram } from './ExponentLaws'
import { GeometricMeanDiagram } from './GeometricMean'
import { GoldenDiagram } from './GoldenRatio'
import { MidpointDiagram } from './Midpoint'
import { SlopeDiagram } from './Slope'
import { SquareDiagonalDiagram } from './SquareDiagonal'
import { TriangleAreaDiagram } from './TriangleArea'
import { WeightedDiagram } from './WeightedAverage'
import { SpecDiagram } from './SpecDiagram'
import type { DiagramProps } from './types'

export type { DiagramProps } from './types'

// Guides with a bespoke component; everything else falls back to the
// data-spec renderer.
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
  return <SpecDiagram spec={spec} />
}
