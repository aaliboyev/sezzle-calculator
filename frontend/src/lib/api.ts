import { matchGuide, type GuideMatch } from '../engine/guides'
import { translateLatex } from '../engine/translate'

export type Outcome =
  | { kind: 'value'; value: number }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'empty' }

export type Evaluation = { outcome: Outcome; guide: GuideMatch | null }

type SuccessBody = { result: number }
type ErrorBody = { error: { code: string; message: string } }

function isSuccessBody(body: unknown): body is SuccessBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as SuccessBody).result === 'number'
  )
}

function isErrorBody(body: unknown): body is ErrorBody {
  const err = (body as ErrorBody)?.error
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof err.code === 'string' &&
    typeof err.message === 'string'
  )
}

export async function calculate(expression: string, signal?: AbortSignal): Promise<Outcome> {
  let response: Response
  try {
    response = await fetch('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
      signal,
    })
  } catch {
    return { kind: 'error', code: 'network', message: 'cannot reach the server' }
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { kind: 'error', code: 'bad_response', message: 'server returned an unreadable response' }
  }
  if (response.ok && isSuccessBody(body)) return { kind: 'value', value: body.result }
  if (isErrorBody(body)) return { kind: 'error', code: body.error.code, message: body.error.message }
  return { kind: 'error', code: 'bad_response', message: 'server returned an unexpected response' }
}

// LaTeX in, result and guide out. Translation and guide matching run
// client-side until the server parses LaTeX itself; callers only see this.
export async function evaluate(latex: string, signal?: AbortSignal): Promise<Evaluation> {
  const guide = matchGuide(latex)
  const translation = translateLatex(latex)
  if (translation.kind === 'empty') return { outcome: { kind: 'empty' }, guide }
  if (translation.kind === 'error') {
    return { outcome: { kind: 'error', code: 'invalid_expression', message: translation.message }, guide }
  }
  return { outcome: await calculate(translation.expression, signal), guide }
}
