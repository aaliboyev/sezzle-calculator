// Renders the raw Claude Code session transcript (session.jsonl) into a
// readable Markdown log: verbatim prompts, assistant prose, tool calls
// collapsed into per-run summaries, and token statistics up top.
// Run: node prompts/render.ts  (writes prompts/session.md)

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

type Block = {
  type: string
  text?: string
  thinking?: string
  name?: string
  input?: Record<string, unknown>
  id?: string
  tool_use_id?: string
  is_error?: boolean
}

type Entry = {
  type: string
  timestamp?: string
  message?: { role?: string; content?: string | Block[]; usage?: Record<string, number>; model?: string }
  attachment?: { type: string; prompt?: string; timestamp?: string }
}

type ToolCall = { name: string; label: string; failed: boolean }

const dir = dirname(fileURLToPath(import.meta.url))
const lines = readFileSync(join(dir, 'session.jsonl'), 'utf8').split('\n').filter(Boolean)
const entries: Entry[] = lines.map((l) => JSON.parse(l))

const stripReminders = (text: unknown) =>
  String(text ?? '').replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim()

const truncate = (text: string, max = 90) =>
  text.length > max ? text.slice(0, max - 1) + '…' : text

function toolLabel(name: string, input: Record<string, unknown>): string {
  const rel = (p: unknown) => String(p ?? '').replace(/^.*\/sezzle-calculator\//, '')
  switch (name) {
    case 'Bash':
      return truncate(String(input.description ?? input.command ?? ''))
    case 'Read':
    case 'Write':
    case 'Edit':
      return rel(input.file_path)
    case 'Agent':
      return truncate(String(input.description ?? ''))
    case 'TaskCreate':
      return truncate(String(input.subject ?? ''))
    case 'TaskUpdate':
      return `#${input.taskId} → ${input.status ?? 'update'}`
    default: {
      const first = Object.values(input).find((v) => typeof v === 'string')
      return truncate(String(first ?? ''))
    }
  }
}

// Failures come back as tool_result blocks in later user entries.
const failedIds = new Set<string>()
for (const e of entries) {
  const content = e.message?.content
  if (e.type !== 'user' || !Array.isArray(content)) continue
  for (const b of content) {
    if (b.type === 'tool_result' && b.is_error && b.tool_use_id) failedIds.add(b.tool_use_id)
  }
}

// Aggregates
const usage = { output: 0, input: 0, cacheRead: 0, cacheWrite: 0 }
const toolCounts = new Map<string, number>()
let assistantMessages = 0
let thinkingBlocks = 0
let promptCount = 0
let model = ''

// Document assembly: prompts and prose stream in order; consecutive tool
// calls (across API turns) pool into one collapsible run.
const out: string[] = []
let run: ToolCall[] = []

function flushRun() {
  if (run.length === 0) return
  const byName = new Map<string, number>()
  for (const c of run) byName.set(c.name, (byName.get(c.name) ?? 0) + 1)
  const summary = [...byName.entries()].map(([n, c]) => (c > 1 ? `${n} ×${c}` : n)).join(', ')
  const failures = run.filter((c) => c.failed).length
  const failNote = failures ? ` · ${failures} failed` : ''
  out.push(`<details><summary>⚙️ ${run.length} tool call${run.length > 1 ? 's' : ''} — ${summary}${failNote}</summary>\n`)
  for (const c of run) out.push(`- ${c.failed ? '✗ ' : ''}\`${c.name}\` ${c.label}`)
  out.push('\n</details>\n')
  run = []
}

function pushPrompt(kind: string, text: string) {
  const clean = stripReminders(text)
  if (!clean) return
  flushRun()
  promptCount++
  out.push(`### 🧑 Prompt ${promptCount}${kind}\n`)
  out.push(clean.split('\n').map((l) => `> ${l}`).join('\n') + '\n')
}

for (const e of entries) {
  if (e.type === 'user') {
    const content = e.message?.content
    if (typeof content === 'string') {
      pushPrompt('', content)
    } else if (Array.isArray(content)) {
      // Tool results, except the occasional typed interruption.
      for (const b of content) {
        if (b.type === 'text' && b.text) pushPrompt(' *(interrupting)*', b.text)
      }
    }
  } else if (e.type === 'attachment' && e.attachment?.type === 'queued_command' && e.attachment.prompt) {
    pushPrompt(' *(queued while Claude worked)*', e.attachment.prompt)
  } else if (e.type === 'assistant') {
    const m = e.message
    if (!m) continue
    assistantMessages++
    model = m.model ?? model
    if (m.usage) {
      usage.output += m.usage.output_tokens ?? 0
      usage.input += m.usage.input_tokens ?? 0
      usage.cacheRead += m.usage.cache_read_input_tokens ?? 0
      usage.cacheWrite += m.usage.cache_creation_input_tokens ?? 0
    }
    for (const b of (Array.isArray(m.content) ? m.content : [])) {
      if (b.type === 'thinking') thinkingBlocks++
      else if (b.type === 'text' && b.text?.trim()) {
        flushRun()
        out.push(b.text.trim() + '\n')
      } else if (b.type === 'tool_use' && b.name) {
        toolCounts.set(b.name, (toolCounts.get(b.name) ?? 0) + 1)
        run.push({
          name: b.name,
          label: toolLabel(b.name, b.input ?? {}),
          failed: b.id ? failedIds.has(b.id) : false,
        })
      }
    }
  }
}
flushRun()

const stamps = entries.map((e) => e.timestamp).filter(Boolean).sort() as string[]
const started = stamps[0]
const ended = stamps[stamps.length - 1]
const minutes = Math.round((Date.parse(ended) - Date.parse(started)) / 60000)
const totalTools = [...toolCounts.values()].reduce((a, b) => a + b, 0)
const fmt = (n: number) => n.toLocaleString('en-US')

const header = [
  '# Build session transcript',
  '',
  `Claude Code session that built this project, rendered from [\`session.jsonl\`](session.jsonl) by [\`render.ts\`](render.ts).`,
  `Prompts are verbatim; assistant prose is verbatim; tool calls are collapsed into per-run summaries.`,
  '',
  '| | |',
  '|---|---|',
  `| Date | ${started?.slice(0, 10)} (${minutes} min, one sitting) |`,
  `| Model | ${model} |`,
  `| Human prompts | ${promptCount} |`,
  `| Assistant messages | ${assistantMessages} (${thinkingBlocks} with internal reasoning) |`,
  `| Tool calls | ${totalTools} — ${[...toolCounts.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ×${c}`).join(', ')} |`,
  `| Output tokens | ${fmt(usage.output)} |`,
  `| Input tokens | ${fmt(usage.input)} fresh · ${fmt(usage.cacheRead)} cache-read · ${fmt(usage.cacheWrite)} cache-write |`,
  '',
  '---',
  '',
]

writeFileSync(join(dir, 'session.md'), header.concat(out).join('\n'))
console.log(`session.md: ${promptCount} prompts, ${assistantMessages} messages, ${totalTools} tool calls`)
