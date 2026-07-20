import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MathfieldElement } from 'mathlive'
import { useCalculator } from './calculator'

function fakeField(latex: string) {
  return {
    value: latex,
    executeCommand: vi.fn(),
    focus: vi.fn(),
  } as unknown as MathfieldElement & { executeCommand: ReturnType<typeof vi.fn>; focus: ReturnType<typeof vi.fn> }
}

function stubFetch(impl: () => Promise<Response>) {
  const spy = vi.fn(impl)
  vi.stubGlobal('fetch', spy)
  return spy
}

beforeEach(() => {
  useCalculator.setState({ field: null, outcome: null, panel: 'none', history: [] })
})

function okResponse(result: number) {
  return () => Promise.resolve(new Response(JSON.stringify({ result }), { status: 200 }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('submit', () => {
  it('does nothing without an attached field', async () => {
    const spy = stubFetch(() => Promise.resolve(new Response('{}')))
    await useCalculator.getState().submit()
    expect(spy).not.toHaveBeenCalled()
    expect(useCalculator.getState().outcome).toBeNull()
  })

  it('does nothing for an empty field', async () => {
    const spy = stubFetch(() => Promise.resolve(new Response('{}')))
    useCalculator.setState({ field: fakeField('') })
    await useCalculator.getState().submit()
    expect(spy).not.toHaveBeenCalled()
    expect(useCalculator.getState().outcome).toBeNull()
  })

  it('shows translation errors without contacting the server', async () => {
    const spy = stubFetch(() => Promise.resolve(new Response('{}')))
    useCalculator.setState({ field: fakeField('x+1') })
    await useCalculator.getState().submit()
    expect(spy).not.toHaveBeenCalled()
    expect(useCalculator.getState().outcome).toEqual({ kind: 'error', message: 'unsupported: x' })
  })

  it('formats a successful result', async () => {
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ result: 0.30000000000000004 }), { status: 200 })),
    )
    useCalculator.setState({ field: fakeField('0.1+0.2') })
    await useCalculator.getState().submit()
    expect(useCalculator.getState().outcome).toEqual({ kind: 'result', text: '0.3' })
  })

  it('shows backend errors', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ error: { code: 'division_by_zero', message: 'division by zero' } }),
          { status: 422 },
        ),
      ),
    )
    useCalculator.setState({ field: fakeField('\\frac{1}{0}') })
    await useCalculator.getState().submit()
    expect(useCalculator.getState().outcome).toEqual({ kind: 'error', message: 'division by zero' })
  })

  it('ignores a stale response that lands after a newer submit', async () => {
    let releaseFirst!: (r: Response) => void
    const first = new Promise<Response>((resolve) => {
      releaseFirst = resolve
    })
    const spy = stubFetch(() => first)
    useCalculator.setState({ field: fakeField('1+1') })
    const firstSubmit = useCalculator.getState().submit()

    spy.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ result: 4 }), { status: 200 })),
    )
    useCalculator.setState({ field: fakeField('2+2') })
    await useCalculator.getState().submit()
    expect(useCalculator.getState().outcome).toEqual({ kind: 'result', text: '4' })

    releaseFirst(new Response(JSON.stringify({ result: 2 }), { status: 200 }))
    await firstSubmit
    expect(useCalculator.getState().outcome).toEqual({ kind: 'result', text: '4' })
  })
})

describe('pressKey', () => {
  it('inserts and refocuses, clearing the previous outcome', () => {
    const field = fakeField('')
    useCalculator.setState({ field, outcome: { kind: 'result', text: '1' } })
    useCalculator.getState().pressKey('√', '\\sqrt{#0}')
    expect(field.executeCommand).toHaveBeenCalledWith(['insert', '\\sqrt{#0}'])
    expect(field.focus).toHaveBeenCalled()
    expect(useCalculator.getState().outcome).toBeNull()
  })

  it('falls back to the label when no insert is given', () => {
    const field = fakeField('')
    useCalculator.setState({ field })
    useCalculator.getState().pressKey('7')
    expect(field.executeCommand).toHaveBeenCalledWith(['insert', '7'])
  })

  it('AC empties the field and outcome', () => {
    const field = fakeField('1+1')
    useCalculator.setState({ field, outcome: { kind: 'error', message: 'x' } })
    useCalculator.getState().pressKey('AC')
    expect(field.value).toBe('')
    expect(useCalculator.getState().outcome).toBeNull()
  })

  it('backspace deletes backward', () => {
    const field = fakeField('12')
    useCalculator.setState({ field })
    useCalculator.getState().pressKey('⌫')
    expect(field.executeCommand).toHaveBeenCalledWith('deleteBackward')
  })

  it('= submits the field content', async () => {
    stubFetch(() => Promise.resolve(new Response(JSON.stringify({ result: 42 }), { status: 200 })))
    useCalculator.setState({ field: fakeField('7\\times6') })
    useCalculator.getState().pressKey('=')
    await vi.waitFor(() => {
      expect(useCalculator.getState().outcome).toEqual({ kind: 'result', text: '42' })
    })
  })

  it('is a no-op without a field', () => {
    expect(() => useCalculator.getState().pressKey('7')).not.toThrow()
  })
})

describe('setFormula', () => {
  it('replaces the field content, closes panels, clears the outcome', () => {
    const field = fakeField('1+1')
    useCalculator.setState({ field, panel: 'keypad', outcome: { kind: 'result', text: '2' } })
    useCalculator.getState().setFormula('\\sqrt{3^2+4^2}')
    expect(field.value).toBe('\\sqrt{3^2+4^2}')
    expect(field.focus).toHaveBeenCalled()
    expect(useCalculator.getState().panel).toBe('none')
    expect(useCalculator.getState().outcome).toBeNull()
  })

  it('is a no-op without a field', () => {
    expect(() => useCalculator.getState().setFormula('1')).not.toThrow()
  })
})

describe('togglePanel', () => {
  it('toggles a panel and closes it on repeat', () => {
    useCalculator.getState().togglePanel('keypad')
    expect(useCalculator.getState().panel).toBe('keypad')
    useCalculator.getState().togglePanel('keypad')
    expect(useCalculator.getState().panel).toBe('none')
  })

  it('panels are exclusive', () => {
    useCalculator.getState().togglePanel('keypad')
    useCalculator.getState().togglePanel('history')
    expect(useCalculator.getState().panel).toBe('history')
  })
})

describe('history', () => {
  it('records a successful calculation with its hash', async () => {
    stubFetch(okResponse(42))
    useCalculator.setState({ field: fakeField('7\\times6') })
    await useCalculator.getState().submit()
    const { history } = useCalculator.getState()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ latex: '7\\times6', result: '42' })
    expect(history[0].hash).toMatch(/^[0-9a-f]{8}$/)
  })

  it('does not record failed calculations', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { code: 'division_by_zero', message: 'division by zero' } }), {
          status: 422,
        }),
      ),
    )
    useCalculator.setState({ field: fakeField('\\frac{1}{0}') })
    await useCalculator.getState().submit()
    expect(useCalculator.getState().history).toHaveLength(0)
  })

  it('dedupes by hash, moving the entry to the top', async () => {
    stubFetch(okResponse(2))
    useCalculator.setState({ field: fakeField('1+1') })
    await useCalculator.getState().submit()
    stubFetch(okResponse(4))
    useCalculator.setState({ field: fakeField('2+2') })
    await useCalculator.getState().submit()
    stubFetch(okResponse(2))
    useCalculator.setState({ field: fakeField('1+1') })
    await useCalculator.getState().submit()
    const latexes = useCalculator.getState().history.map((h) => h.latex)
    expect(latexes).toEqual(['1+1', '2+2'])
  })

  it('caps the history length', async () => {
    const full = Array.from({ length: 50 }, (_, i) => ({
      hash: String(i).padStart(8, '0'),
      latex: `${i}`,
      result: `${i}`,
      at: i,
    }))
    useCalculator.setState({ history: full, field: fakeField('9+9') })
    stubFetch(okResponse(18))
    await useCalculator.getState().submit()
    const { history } = useCalculator.getState()
    expect(history).toHaveLength(50)
    expect(history[0].latex).toBe('9+9')
  })

  it('recall re-inputs the latex, closes the panel and clears the outcome', () => {
    const field = fakeField('')
    useCalculator.setState({
      field,
      panel: 'history',
      outcome: { kind: 'result', text: '42' },
      history: [{ hash: 'abcd1234', latex: '7\\times6', result: '42', at: 1 }],
    })
    useCalculator.getState().recall('abcd1234')
    expect(field.value).toBe('7\\times6')
    expect(field.focus).toHaveBeenCalled()
    expect(useCalculator.getState().panel).toBe('none')
    expect(useCalculator.getState().outcome).toBeNull()
  })

  it('recall of an unknown hash is a no-op', () => {
    const field = fakeField('1+1')
    useCalculator.setState({ field, panel: 'history' })
    useCalculator.getState().recall('ffffffff')
    expect(field.value).toBe('1+1')
    expect(useCalculator.getState().panel).toBe('history')
  })

  it('clearHistory empties the list', () => {
    useCalculator.setState({ history: [{ hash: 'a', latex: '1', result: '1', at: 1 }] })
    useCalculator.getState().clearHistory()
    expect(useCalculator.getState().history).toHaveLength(0)
  })
})
