import { formatResult } from '../../lib/format'

export function show(n: number): string {
  if (!Number.isFinite(n)) return '\\infty'
  const text = formatResult(n)
  // "1e-15" in latex reads as the variable e; render ×10^n instead.
  const exp = text.match(/^(-?[\d.]+)e([+-]\d+)$/)
  return exp ? `${exp[1]}\\times10^{${Number(exp[2])}}` : text
}
