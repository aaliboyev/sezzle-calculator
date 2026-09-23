import { beforeEach, describe, expect, it, vi } from 'vitest'
import { latestValue, useHistory } from './history'

const state = () => useHistory.getState()

beforeEach(() => {
  useHistory.setState({ entries: [] })
})

describe('history', () => {
  it('adds newest first and dedupes by latex', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3)
    state().add('1+1', 2)
    state().add('7\\cdot6', 42)
    state().add('1+1', 2)
    expect(state().entries.map((e) => e.latex)).toEqual(['1+1', '7\\cdot6'])
  })

  it('keeps pinned entries first, through re-adds and clears', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3)
    state().add('1', 1)
    state().add('2', 2)
    state().togglePin(state().entries[1].hash)
    expect(state().entries.map((e) => e.latex)).toEqual(['1', '2'])
    state().add('1', 1)
    expect(state().entries[0]).toMatchObject({ latex: '1', pinned: true })
    state().clear()
    expect(state().entries.map((e) => e.latex)).toEqual(['1'])
  })

  it('caps unpinned entries but never drops pinned ones', () => {
    state().add('pinned', 0)
    state().togglePin(state().entries[0].hash)
    for (let i = 0; i < 60; i++) state().add(`${i}`, i)
    expect(state().entries).toHaveLength(51)
    expect(state().entries[0].latex).toBe('pinned')
  })

  it('latestValue ignores pin order', () => {
    expect(latestValue([])).toBeNull()
    expect(
      latestValue([
        { hash: 'a', latex: 'a', value: 1, at: 1, pinned: true },
        { hash: 'b', latex: 'b', value: 2, at: 5, pinned: false },
      ]),
    ).toBe(2)
  })
})

describe('persisted v0 history', () => {
  it('migrates formatted results into numeric values', async () => {
    const migrate = useHistory.persist.getOptions().migrate!
    const migrated = await migrate(
      { history: [{ hash: 'h', latex: '1/3', result: '0.333333333333', at: 7 }, { hash: 'x', latex: 'x', result: 'nope', at: 1 }] },
      0,
    )
    expect(migrated).toEqual({ entries: [{ hash: 'h', latex: '1/3', value: 0.333333333333, at: 7, pinned: false }] })
  })
})
