import { vi } from 'vitest'
import trees from '../engine/latex-trees.json'

// Trees the Go parser is verified against (backend/latex_test.go), so tests
// here see exactly what the server would send.
export function treeOf(latex: string): unknown {
  if (!(latex in trees)) throw new Error(`no fixture tree for ${latex}; add it to latex-trees.json`)
  return trees[latex as keyof typeof trees]
}

type Reply = number | { code: string; message: string }

// Stubs fetch as the evaluate endpoint. The test supplies the result or
// error; the tree comes from the fixture, absent like a parse error when
// the fixture has none.
export function stubEvaluate(reply: Reply | ((latex: string) => Reply)) {
  const spy = vi.fn((_url: string, init: RequestInit) => {
    if (init.signal?.aborted) return Promise.reject(new DOMException('aborted', 'AbortError'))
    const { latex } = JSON.parse(init.body as string) as { latex: string }
    const answer = typeof reply === 'function' ? reply(latex) : reply
    const tree = latex in trees ? treeOf(latex) : undefined
    const body = typeof answer === 'number' ? { result: answer, tree } : { error: answer, tree }
    return Promise.resolve(new Response(JSON.stringify(body), { status: typeof answer === 'number' ? 200 : 422 }))
  })
  vi.stubGlobal('fetch', spy)
  return spy
}
