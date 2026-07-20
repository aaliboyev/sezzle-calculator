export type CalcOutcome =
  | { ok: true; result: number }
  | { ok: false; code: string; message: string }

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

export async function calculate(expression: string): Promise<CalcOutcome> {
  let response: Response
  try {
    response = await fetch('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
    })
  } catch {
    return { ok: false, code: 'network', message: 'cannot reach the server' }
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, code: 'bad_response', message: 'server returned an unreadable response' }
  }
  if (response.ok && isSuccessBody(body)) return { ok: true, result: body.result }
  if (isErrorBody(body)) return { ok: false, code: body.error.code, message: body.error.message }
  return { ok: false, code: 'bad_response', message: 'server returned an unexpected response' }
}
