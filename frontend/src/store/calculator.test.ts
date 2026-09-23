import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MathfieldElement } from 'mathlive'
import { editor } from '../editor/field'
import { useCalculator } from './calculator'
import { useHistory } from './history'
import { useUi } from './ui'

type FakeField = MathfieldElement & {
  executeCommand: ReturnType<typeof vi.fn>
  focus: ReturnType<typeof vi.fn>
}

// Mirrors the one MathLive behavior the store depends on: inserts append.
function attachField(latex = ''): FakeField {
  const field = {
    value: latex,
    executeCommand: vi.fn((cmd: unknown) => {
      if (Array.isArray(cmd) && cmd[0] === 'insert') field.value += cmd[1]
      if (cmd === 'deleteBackward') field.value = field.value.slice(0, -1)
    }),
    focus: vi.fn(),
  }
  editor.attach(field as unknown as MathfieldElement)
  return field as unknown as FakeField
}

function stubFetch(...results: number[]) {
  const spy = vi.fn((_url: string, init: RequestInit) => {
    const result = results.length > 1 ? results.shift() : results[0]
    return init.signal?.aborted
      ? Promise.reject(new DOMException('aborted', 'AbortError'))
      : Promise.resolve(new Response(JSON.stringify({ result }), { status: 200 }))
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

const state = () => useCalculator.getState()

function typeInto(field: FakeField, latex: string) {
  field.value = latex
  state().edit(latex)
}

beforeEach(() => {
  state().edit('')
  useCalculator.setState({ latex: '', committed: null, preview: null, guide: null, guideStale: false })
  useHistory.setState({ entries: [] })
  useUi.setState({ panel: 'none', examplesOpen: true, scatterSeed: 1 })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  editor.attach(null)
})

describe('live preview', () => {
  it('evaluates after a short pause, not on every keystroke', async () => {
    vi.useFakeTimers()
    const spy = stubFetch(42)
    const field = attachField()
    typeInto(field, '7\\cdot')
    typeInto(field, '7\\cdot6')
    await vi.advanceTimersByTimeAsync(200)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(state().preview).toBe(42)
    expect(state().committed).toBeNull()
  })

  it('shows no preview for an expression that does not evaluate', async () => {
    vi.useFakeTimers()
    const spy = stubFetch(1)
    typeInto(attachField(), '2+')
    await vi.advanceTimersByTimeAsync(200)
    expect(spy).not.toHaveBeenCalled()
    expect(state().preview).toBeNull()
  })

  it('drops a preview whose latex was edited away meanwhile', async () => {
    vi.useFakeTimers()
    stubFetch(4)
    const field = attachField()
    typeInto(field, '2+2')
    await vi.advanceTimersByTimeAsync(160)
    typeInto(field, '2+2+')
    await vi.advanceTimersByTimeAsync(200)
    expect(state().preview).toBeNull()
  })
})

describe('commit', () => {
  it('does nothing for an empty field', async () => {
    const spy = stubFetch(1)
    attachField('')
    await state().commit()
    expect(spy).not.toHaveBeenCalled()
    expect(state().committed).toBeNull()
  })

  it('shows translation errors without contacting the server', async () => {
    const spy = stubFetch(1)
    attachField('x+1')
    await state().commit()
    expect(spy).not.toHaveBeenCalled()
    expect(state().committed).toEqual({ kind: 'error', message: 'unsupported: x' })
  })

  it('shows backend errors', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { code: 'division_by_zero', message: 'division by zero' } }), {
          status: 422,
        }),
      ),
    )
    attachField('\\frac{1}{0}')
    await state().commit()
    expect(state().committed).toEqual({ kind: 'error', message: 'division by zero' })
    expect(useHistory.getState().entries).toEqual([])
  })

  it('records the value in history and the share hash', async () => {
    stubFetch(42)
    const replaceState = vi.fn()
    vi.stubGlobal('history', { replaceState })
    attachField('7\\cdot6')
    await state().commit()
    expect(state().committed).toEqual({ kind: 'value', value: 42 })
    expect(useHistory.getState().entries[0]).toMatchObject({ latex: '7\\cdot6', value: 42 })
    expect(replaceState).toHaveBeenCalledWith(null, '', '#e=7%5Ccdot6')
  })

  it('reuses the in-flight preview for the same latex', async () => {
    vi.useFakeTimers()
    const spy = stubFetch(42)
    typeInto(attachField(), '7\\cdot6')
    await vi.advanceTimersByTimeAsync(160)
    await state().commit()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(state().committed).toEqual({ kind: 'value', value: 42 })
    expect(state().preview).toBeNull()
  })

  it('ignores a result that lands after the field changed', async () => {
    let release: (r: Response) => void = () => {}
    vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => (release = resolve)))
    const field = attachField('1+1')
    const pending = state().commit()
    typeInto(field, '1+1+')
    release(new Response(JSON.stringify({ result: 2 }), { status: 200 }))
    await pending
    expect(state().committed).toBeNull()
    expect(useHistory.getState().entries).toEqual([])
  })
})

describe('press', () => {
  it('inserts, refocuses, and clears the committed outcome', () => {
    const field = attachField('')
    useCalculator.setState({ committed: { kind: 'value', value: 1 } })
    state().press('√', '\\sqrt{#0}')
    expect(field.executeCommand).toHaveBeenCalledWith(['insert', '\\sqrt{#0}'])
    expect(field.focus).toHaveBeenCalled()
    expect(state().committed).toBeNull()
  })

  it('falls back to the label when no insert is given', () => {
    const field = attachField('')
    state().press('7')
    expect(field.executeCommand).toHaveBeenCalledWith(['insert', '7'])
  })

  it('AC empties the field, outcome, and guide', () => {
    const field = attachField('')
    state().load('\\sqrt{3^2+4^2}')
    useCalculator.setState({ committed: { kind: 'error', message: 'x' } })
    state().press('AC')
    expect(field.value).toBe('')
    expect(state().committed).toBeNull()
    expect(state().guide).toBeNull()
  })

  it('backspace deletes backward', () => {
    const field = attachField('12')
    state().press('⌫')
    expect(field.executeCommand).toHaveBeenCalledWith('deleteBackward')
    expect(field.value).toBe('1')
  })

  it('= commits the field content', async () => {
    stubFetch(42)
    attachField('7\\times6')
    state().press('=')
    await vi.waitFor(() => expect(state().committed).toEqual({ kind: 'value', value: 42 }))
  })

  it('ans inserts the latest value, as latex and parenthesized when negative', () => {
    const field = attachField('2\\cdot')
    useHistory.setState({
      entries: [
        { hash: 'a', latex: '1-8', value: -7, at: 2, pinned: false },
        { hash: 'b', latex: '1', value: 1, at: 3, pinned: true },
      ],
    })
    state().press('ans')
    expect(field.value).toBe('2\\cdot1')
    useHistory.setState({ entries: [{ hash: 'a', latex: '1-8', value: -7e-9, at: 9, pinned: false }] })
    state().press('ans')
    expect(field.value).toBe('2\\cdot1(-7\\times10^{-9})')
  })

  it('ans does nothing without history', () => {
    const field = attachField('')
    state().press('ans')
    expect(field.value).toBe('')
  })

  it('is a no-op without a field', () => {
    expect(() => state().press('7')).not.toThrow()
  })
})

describe('guide', () => {
  it('activates on a matching formula and follows its digits', async () => {
    vi.useFakeTimers()
    stubFetch(1)
    const field = attachField()
    typeInto(field, '85\\cdot18\\%')
    await vi.advanceTimersByTimeAsync(200)
    expect(state().guide).toMatchObject({ id: 'tip', values: { a: 85, r: 0.18 } })
    typeInto(field, '90\\cdot20\\%')
    await vi.advanceTimersByTimeAsync(200)
    expect(state().guide?.values).toEqual({ a: 90, r: 0.2 })
  })

  it('pauses a broken pattern after a delay instead of hiding it', async () => {
    vi.useFakeTimers()
    stubFetch(1)
    const field = attachField()
    typeInto(field, '85\\cdot18\\%')
    await vi.advanceTimersByTimeAsync(200)
    typeInto(field, '85\\cdot18\\%+1')
    await vi.advanceTimersByTimeAsync(200)
    expect(state().guide?.id).toBe('tip')
    expect(state().guideStale).toBe(false)
    await vi.advanceTimersByTimeAsync(1000)
    expect(state().guideStale).toBe(true)
    typeInto(field, '85\\cdot20\\%')
    await vi.advanceTimersByTimeAsync(200)
    expect(state().guideStale).toBe(false)
  })

  it('a match within the pause never dims', async () => {
    vi.useFakeTimers()
    stubFetch(1)
    const field = attachField()
    typeInto(field, '85\\cdot18\\%')
    await vi.advanceTimersByTimeAsync(200)
    typeInto(field, '85\\cdot')
    await vi.advanceTimersByTimeAsync(400)
    typeInto(field, '85\\cdot20\\%')
    await vi.advanceTimersByTimeAsync(2000)
    expect(state().guideStale).toBe(false)
    expect(state().guide?.values.r).toBe(0.2)
  })

  it('clears immediately when the field empties', async () => {
    vi.useFakeTimers()
    stubFetch(1)
    const field = attachField()
    typeInto(field, '85\\cdot18\\%')
    await vi.advanceTimersByTimeAsync(200)
    typeInto(field, '')
    expect(state().guide).toBeNull()
    expect(state().guideStale).toBe(false)
  })
})

describe('load', () => {
  it('replaces the field, closes panels, clears the outcome, and evaluates at once', async () => {
    stubFetch(5)
    const field = attachField('1+1')
    useUi.setState({ panel: 'keypad' })
    useCalculator.setState({ committed: { kind: 'value', value: 2 } })
    state().load('\\sqrt{3^2+4^2}')
    expect(field.value).toBe('\\sqrt{3^2+4^2}')
    expect(field.focus).toHaveBeenCalled()
    expect(useUi.getState().panel).toBe('none')
    expect(state().committed).toBeNull()
    await vi.waitFor(() => expect(state().preview).toBe(5))
    expect(state().guide?.id).toBe('pythagoras')
  })
})
