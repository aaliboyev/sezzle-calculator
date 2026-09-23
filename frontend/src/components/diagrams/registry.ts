import type { ComponentType } from 'react'
import { BigTinyDiagram } from './BigTiny'
import { ChessboardDiagram } from './Chessboard'
import { CompoundGrowthDiagram } from './CompoundGrowth'
import { DiscriminantDiagram } from './Discriminant'
import { DistanceDiagram } from './Distance'
import { ECompoundingDiagram } from './ECompounding'
import { ExponentDiagram } from './ExponentLaws'
import { GeometricMeanDiagram } from './GeometricMean'
import { GoldenDiagram } from './GoldenRatio'
import { MidpointDiagram } from './Midpoint'
import { PythagorasDiagram } from './Pythagoras'
import { DiscountDiagram, TipDiagram } from './ShareBar'
import { SlopeDiagram } from './Slope'
import { SquareDiagonalDiagram } from './SquareDiagonal'
import { TriangleAreaDiagram } from './TriangleArea'
import { WeightedDiagram } from './WeightedAverage'
import type { DiagramProps } from './types'

export const DIAGRAMS: Record<string, ComponentType<DiagramProps>> = {
  pythagoras: PythagorasDiagram,
  'compound-growth': CompoundGrowthDiagram,
  discount: DiscountDiagram,
  tip: TipDiagram,
  'e-by-compounding': ECompoundingDiagram,
  chessboard: ChessboardDiagram,
  'big-and-tiny': BigTinyDiagram,
  distance: DistanceDiagram,
  slope: SlopeDiagram,
  'triangle-area': TriangleAreaDiagram,
  'square-diagonal': SquareDiagonalDiagram,
  'geometric-mean': GeometricMeanDiagram,
  discriminant: DiscriminantDiagram,
  'golden-ratio': GoldenDiagram,
  'weighted-average': WeightedDiagram,
  'exponent-laws': ExponentDiagram,
  midpoint: MidpointDiagram,
}
