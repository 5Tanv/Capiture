import { useLayoutEffect } from 'react'

// The top HUD and the fixed bottom nav change height with breakpoints, short
// screens, zoom, and the phone's safe area. Publishing their measured heights as
// CSS variables lets the page reserve exactly that room instead of guessing.
const parts = [
  ['top', '--header-h'],
  ['bottom', '--nav-h'],
] as const

export function useChromeMetrics() {
  useLayoutEffect(() => {
    const root = document.documentElement.style
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement
        const name = parts.find(([id]) => id === el.dataset.chrome)?.[1]
        if (name) root.setProperty(name, `${el.offsetHeight}px`)
      }
    })
    for (const [id] of parts) {
      const el = document.querySelector(`[data-chrome="${id}"]`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])
}
