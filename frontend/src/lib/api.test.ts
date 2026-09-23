import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubEvaluate } from '../test/server'
import { evaluate } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('evaluate', () => {
  it('posts the latex and matches the guide on the returned tree', async () => {
    const spy = stubEvaluate(5)
    const { outcome, guide } = await evaluate('\\sqrt{3^2+4^2}')
    expect(outcome).toEqual({ kind: 'value', value: 5 })
    expect(guide?.id).toBe('pythagoras')
    expect(spy).toHaveBeenCalledWith('/api/v1/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: '\\sqrt{3^2+4^2}' }),
      signal: undefined,
    })
  })

  it('keeps the guide when evaluation fails but the tree parsed', async () => {
    stubEvaluate({ code: 'division_by_zero', message: 'division by zero' })
    const { outcome, guide } = await evaluate('\\frac{1}{0}')
    expect(outcome).toEqual({ kind: 'error', code: 'division_by_zero', message: 'division by zero' })
    expect(guide?.id).toBe('division-by-zero')
  })

  it('passes parse errors through without a guide', async () => {
    stubEvaluate({ code: 'unsupported', message: 'unsupported: x' })
    expect(await evaluate('x+1')).toEqual({
      outcome: { kind: 'error', code: 'unsupported', message: 'unsupported: x' },
      guide: null,
    })
  })

  it('treats blank input as empty without contacting the server', async () => {
    const spy = stubEvaluate(0)
    expect(await evaluate('  ')).toEqual({ outcome: { kind: 'empty' }, guide: null })
    expect(spy).not.toHaveBeenCalled()
  })

  it('reports network failures', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
    expect((await evaluate('1+1')).outcome).toMatchObject({ kind: 'error', code: 'network' })
  })

  it('reports non-JSON responses', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 502 })))
    expect((await evaluate('1+1')).outcome).toMatchObject({ kind: 'error', code: 'bad_response' })
  })

  it('rejects a 200 with an unexpected shape', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ value: 4 }), { status: 200 })))
    expect((await evaluate('2+2')).outcome).toMatchObject({ kind: 'error', code: 'bad_response' })
  })
})
