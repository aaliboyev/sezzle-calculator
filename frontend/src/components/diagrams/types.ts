import type { GuideValues } from '../../engine/guides'

// Bespoke diagram contract: a component gets the live slot bindings and
// re-renders as the user edits digits. Guard first and return null when the
// values are not drawable. viewBox 220 wide, theme tones only, class
// "guide-diagram". CSS transitions animate attribute changes; the global
// reduced-motion rule silences them.
export type DiagramProps = { values: GuideValues }
