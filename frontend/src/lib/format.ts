// Round to 12 significant digits for display: hides float noise
// (0.1+0.2) without lying about genuinely long results.
export function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString()
  return parseFloat(n.toPrecision(12)).toString()
}
