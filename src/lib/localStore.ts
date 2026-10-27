import { useSyncExternalStore } from 'react'

// A tiny persisted store for demo features (daily challenge, streak, league) that live
// outside the game save. Reads and writes never throw; storage can be blocked or cleared.

export interface Store<T> {
  get: () => T
  set: (next: T) => void
  use: () => T
}

export function makeStore<T>(key: string, init: () => T, clean: (raw: unknown) => T): Store<T> {
  let cache: T | null = null
  const listeners = new Set<() => void>()
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? clean(JSON.parse(raw)) : init()
    } catch {
      return init()
    }
  }
  const get = () => (cache ??= read())
  const emit = () => listeners.forEach((l) => l())
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      cache = null
      emit()
    })
  }
  return {
    get,
    set(next) {
      cache = next
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* keep the in-memory copy */
      }
      emit()
    },
    use: () => useSyncExternalStore(subscribe, get),
  }
}

/** Deterministic random numbers from a string seed. */
export function rngFrom(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let s = (h >>> 0) || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** The Monday that starts this date's league week. */
export function weekKey(d = new Date()) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return dayKey(m)
}
