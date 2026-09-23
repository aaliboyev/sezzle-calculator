const PREFIX = '#e='

export function readSharedLatex(hash: string): string | null {
  if (!hash.startsWith(PREFIX)) return null
  try {
    return decodeURIComponent(hash.slice(PREFIX.length)) || null
  } catch {
    return null
  }
}

export function shareHash(latex: string): string {
  return PREFIX + encodeURIComponent(latex)
}
