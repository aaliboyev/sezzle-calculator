import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculate } from './api'

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
    expect(outcome).toEqual({ ok: true, result: 4 })
    expect(spy).toHaveBeenCalledWith('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: '2+2' }),
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
    expect(outcome).toEqual({ ok: false, code: 'division_by_zero', message: 'division by zero' })
  })

  it('reports network failures', async () => {
    stubFetch(() => Promise.reject(new TypeError('fetch failed')))
    const outcome = await calculate('1+1')
    expect(outcome).toMatchObject({ ok: false, code: 'network' })
  })

  it('reports non-JSON responses', async () => {
    stubFetch(() => Promise.resolve(new Response('<html>', { status: 502 })))
    const outcome = await calculate('1+1')
    expect(outcome).toMatchObject({ ok: false, code: 'bad_response' })
  })

  it('rejects a 200 with an unexpected shape', async () => {
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ value: 4 }), { status: 200 })),
    )
    const outcome = await calculate('2+2')
    expect(outcome).toMatchObject({ ok: false, code: 'bad_response' })
  })
})
