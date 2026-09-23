// Round to 12 significant digits for display: hides float noise
// (0.1+0.2) without lying about genuinely long results.
export function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString()
  return parseFloat(n.toPrecision(12)).toString()
}

export function formatLatex(n: number): string {
  if (!Number.isFinite(n)) return '\\infty'
  const text = formatResult(n)
  // "1e-15" in latex reads as the variable e; render ×10^n instead.
  const exp = text.match(/^(-?[\d.]+)e([+-]\d+)$/)
  return exp ? `${exp[1]}\\times10^{${Number(exp[2])}}` : text
}
