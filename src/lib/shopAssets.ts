import { useEffect, useState, useSyncExternalStore } from 'react'

// Art is only sold once it has actually loaded. `ensureAsset` resolves true when the image
// decodes with real pixels and false when it is missing or broken. A failure is not cached, so
// a retry really retries.

const status = new Map<string, 'ready' | 'error'>()
const inflight = new Map<string, Promise<boolean>>()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function ensureAsset(url: string): Promise<boolean> {
  if (status.get(url) === 'ready') return Promise.resolve(true)
  const pending = inflight.get(url)
  if (pending) return pending
  const p = new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0)
    img.onerror = () => resolve(false)
    img.src = url
  }).then((ok) => {
    inflight.delete(url)
    if (ok) status.set(url, 'ready')
    else status.set(url, 'error')
    notify()
    return ok
  })
  inflight.set(url, p)
  return p
}

/** Forget a failure so the next check loads the file again. */
export function retryAsset(url: string) {
  if (status.get(url) === 'error') status.delete(url)
  notify()
}

export type AssetState = 'ready' | 'loading' | 'error'

/** Loads `url` (if any) and reports whether it is usable. Items drawn in code are always ready. */
export function useAsset(url: string | null): AssetState {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => (url ? (status.get(url) ?? 'loading') : 'ready'),
  )
  useEffect(() => {
    if (url && !status.has(url)) void ensureAsset(url)
  }, [url, snap])
  return snap
}

/** Pause decorative motion while the element is offscreen or the tab is hidden. */
export function useLive(ref: { current: Element | null }): boolean {
  const [live, setLive] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let visible = true
    let shown = !document.hidden
    const apply = () => setLive(visible && shown)
    const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([e]) => { visible = e.isIntersecting; apply() }, { threshold: 0 })
    io?.observe(el)
    const onVis = () => { shown = !document.hidden; apply() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [ref])
  return live
}
