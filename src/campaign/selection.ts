import { CHAPTER_POSITIONS, eventsAt } from './content'
import type { RoleId } from './types'

/** mulberry32: small, fast and the same on every device for a given seed. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Position {
  chapter: number
  /** 1-based position inside the chapter. */
  slot: number
  eventId: string
}

/**
 * One event per dated position. Required positions always hold their event;
 * other positions pick one alternative from the run seed. The result is stored
 * in the run, so it never rerolls.
 */
export function selectPositions(role: RoleId, seed: number): Position[] {
  const next = rng(seed)
  const out: Position[] = []
  CHAPTER_POSITIONS.forEach((count, i) => {
    const chapter = i + 1
    for (let slot = 1; slot <= count; slot++) {
      const options = eventsAt(role, chapter, slot)
      const pick = options.find((e) => e.required) ?? options[Math.floor(next() * options.length)]
      out.push({ chapter, slot, eventId: pick.id })
    }
  })
  return out
}

export const newSeed = () => (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1
