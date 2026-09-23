import { beforeEach, describe, expect, it } from 'vitest'
import { useUi } from './ui'

const state = () => useUi.getState()

beforeEach(() => {
  useUi.setState({ panel: 'none', examplesOpen: true, scatterSeed: 1 })
})

describe('panels', () => {
  it('toggle, close on repeat, and are exclusive', () => {
    state().togglePanel('keypad')
    expect(state().panel).toBe('keypad')
    state().togglePanel('search')
    expect(state().panel).toBe('search')
    state().togglePanel('search')
    expect(state().panel).toBe('none')
  })
})

describe('examples', () => {
  it('hide without reseeding and rescatter on reopen', () => {
    state().toggleExamples()
    expect(state()).toMatchObject({ examplesOpen: false, scatterSeed: 1 })
    state().toggleExamples()
    expect(state()).toMatchObject({ examplesOpen: true, scatterSeed: 2 })
  })
})
