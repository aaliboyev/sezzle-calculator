import { flushSync } from 'react-dom'

export function withViewTransition(update: () => void) {
  if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    document.startViewTransition(() => flushSync(update))
  } else {
    update()
  }
}
