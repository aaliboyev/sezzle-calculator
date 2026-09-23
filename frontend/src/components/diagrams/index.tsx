import type { GuideMatch } from '../../engine/guides'
import { DIAGRAMS } from './registry'

export function Diagram({ guide }: { guide: GuideMatch }) {
  const Draw = DIAGRAMS[guide.id]
  return Draw ? <Draw values={guide.values} /> : null
}
