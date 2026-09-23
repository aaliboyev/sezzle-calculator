import { createJSONStorage } from 'zustand/middleware'

const memory = new Map<string, string>()

// localStorage in the browser, an in-memory map under tests.
export const storage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? window.localStorage
    : {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => void memory.set(key, value),
        removeItem: (key: string) => void memory.delete(key),
      },
)
