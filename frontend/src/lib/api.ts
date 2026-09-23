import { matchGuide, type GuideMatch } from '../engine/guides'

export type Outcome =
  | { kind: 'value'; value: number }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'empty' }

export type Evaluation = { outcome: Outcome; guide: GuideMatch | null }

type ApiError = { code: string; message: string }
type EvaluateBody = { result?: number; tree?: unknown; error?: ApiError }

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as ApiError).code === 'string' &&
    typeof (err as ApiError).message === 'string'
  )
}

function failure(code: string, message: string): Evaluation {
  return { outcome: { kind: 'error', code, message }, guide: null }
}

// The server parses and evaluates the LaTeX and returns its tree, even
// alongside an evaluation error, so 1/0 still gets its guide.
export async function evaluate(latex: string, signal?: AbortSignal): Promise<Evaluation> {
  if (!latex.trim()) return { outcome: { kind: 'empty' }, guide: null }
  let response: Response
  try {
    response = await fetch('/api/v1/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex }),
      signal,
    })
  } catch {
    return failure('network', 'cannot reach the server')
  }
  let body: EvaluateBody
  try {
    body = await response.json()
  } catch {
    return failure('bad_response', 'server returned an unreadable response')
  }
  const guide = body?.tree === undefined ? null : matchGuide(body.tree, latex)
  if (response.ok && typeof body.result === 'number') {
    return { outcome: { kind: 'value', value: body.result }, guide }
  }
  if (isApiError(body?.error)) {
    return { outcome: { kind: 'error', code: body.error.code, message: body.error.message }, guide }
  }
  return failure('bad_response', 'server returned an unexpected response')
}
