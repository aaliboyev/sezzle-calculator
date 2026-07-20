import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react'

const EXIT_MS = 220

// Keeps a closing sheet mounted long enough for its exit animation, so
// panels animate without the View Transition API (whose full-page snapshot
// swap reads as a background flicker, most visibly on mobile).
export function Sheet({
  open,
  children,
  ...rest
}: { open: boolean; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const [present, setPresent] = useState(open)
  useEffect(() => {
    if (open) {
      setPresent(true)
      return
    }
    const timer = setTimeout(() => setPresent(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [open])
  if (!open && !present) return null
  return (
    <div {...rest} data-closing={open ? undefined : ''}>
      {children}
    </div>
  )
}
