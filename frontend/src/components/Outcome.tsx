import { useState, type ReactNode } from 'react'
import { formatResult } from '../lib/format'
import { shareHash } from '../lib/share'
import { useCalculator } from '../store/calculator'
import { CopyIcon, LinkIcon } from './icons'
import './Outcome.css'

function CopyButton({ label, text, children }: { label: string; text: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="outcome-action"
      aria-label={label}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() =>
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        })
      }
    >
      {copied ? <span className="outcome-copied">copied</span> : children}
    </button>
  )
}

export function Outcome() {
  const committed = useCalculator((s) => s.committed)
  const preview = useCalculator((s) => s.preview)
  const latex = useCalculator((s) => s.latex)
  return (
    <div className="outcome">
      {committed?.kind === 'value' && (
        <div className="outcome-row">
          <output className="result" aria-label="result">
            {formatResult(committed.value)}
          </output>
          <CopyButton label="copy result" text={formatResult(committed.value)}>
            <CopyIcon />
          </CopyButton>
          <CopyButton label="copy link" text={location.origin + location.pathname + shareHash(latex)}>
            <LinkIcon />
          </CopyButton>
        </div>
      )}
      {committed?.kind === 'error' && (
        <div role="alert" className="error">
          {committed.message}
        </div>
      )}
      {!committed && preview !== null && (
        <output className="preview" aria-label="preview">
          = {formatResult(preview)}
        </output>
      )}
    </div>
  )
}
