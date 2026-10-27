import { useEffect, useRef, useState } from 'react'

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Rolls a displayed number toward its target, like a game counter. */
export function useCountUp(target: number, duration = 700, initial = target) {
  const [value, setValue] = useState(initial)
  const from = useRef(initial)

  useEffect(() => {
    const start = from.current
    if (start === target) return
    if (reducedMotion()) {
      from.current = target
      setValue(target)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      const v = p < 1 ? Math.round(start + (target - start) * eased) : target
      from.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
