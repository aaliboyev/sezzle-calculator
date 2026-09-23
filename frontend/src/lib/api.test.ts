import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculate, evaluate } from './api'

function stubFetch(impl: () => Promise<Response>) {
  const spy = vi.fn(impl)
  vi.stubGlobal('fetch', spy)
  return spy
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('calculate', () => {
  it('posts the expression and returns the result', async () => {
    const spy = stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ result: 4 }), { status: 200 })),
    )
    const outcome = await calculate('2+2')
    expect(outcome).toEqual({ kind: 'value', value: 4 })
    expect(spy).toHaveBeenCalledWith('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: '2+2' }),
      signal: undefined,
    })
  })

  it('passes through structured API errors', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ error: { code: 'division_by_zero', message: 'division by zero' } }),
          { status: 422 },
        ),
      ),
    )
    const outcome = await calculate('1/0')
    expect(outcome).toEqual({ kind: 'error', code: 'division_by_zero', message: 'division by zero' })
  })

  it('reports network failures', async () => {
    stubFetch(() => Promise.reject(new TypeError('fetch failed')))
    const outcome = await calculate('1+1')
    expect(outcome).toMatchObject({ kind: 'error', code: 'network' })
  })

  it('reports non-JSON responses', async () => {
    stubFetch(() => Promise.resolve(new Response('<html>', { status: 502 })))
    const outcome = await calculate('1+1')
    expect(outcome).toMatchObject({ kind: 'error', code: 'bad_response' })
  })

  it('rejects a 200 with an unexpected shape', async () => {
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ value: 4 }), { status: 200 })),
    )
    const outcome = await calculate('2+2')
    expect(outcome).toMatchObject({ kind: 'error', code: 'bad_response' })
  })
})

describe('evaluate', () => {
  it('translates latex, calculates, and matches the guide', async () => {
    const spy = stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ result: 5 }), { status: 200 })),
    )
    const { outcome, guide } = await evaluate('\\sqrt{3^2+4^2}')
    expect(outcome).toEqual({ kind: 'value', value: 5 })
    expect(guide?.id).toBe('pythagoras')
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ expression: '√(3^2+4^2)' })
  })

  it('reports translation errors without contacting the server', async () => {
    const spy = stubFetch(() => Promise.resolve(new Response('{}')))
    const { outcome } = await evaluate('x+1')
    expect(outcome).toEqual({ kind: 'error', code: 'invalid_expression', message: 'unsupported: x' })
    expect(spy).not.toHaveBeenCalled()
  })

  it('treats blank input as empty', async () => {
    expect(await evaluate('  ')).toEqual({ outcome: { kind: 'empty' }, guide: null })
  })
})
