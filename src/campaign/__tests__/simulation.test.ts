import { describe, expect, it } from 'vitest'
import { eventsByRole, lessonsById } from '../content'
import { totalCoins } from '../mastery'
import { arrearsTotal, stat } from '../run'
import { chapterSummary, endingParagraphs, playstyles } from '../summary'
import { ALL_ROLES, newCtx, play, randomChooser, reconciles } from './helpers'

const RUNS = 1000

describe('full-run simulation', () => {
  it.each(ALL_ROLES)(
    `%s: ${RUNS} seeded runs reach the ending with reconciled ledgers`,
    (role) => {
      const required = eventsByRole[role].filter((e) => e.required).map((e) => e.id)
      const played = new Set<string>()
      for (let seed = 1; seed <= RUNS; seed++) {
        const broke = seed % 5 === 0
        const start = newCtx(role, seed, broke ? { accounts: Object.fromEntries(Object.keys(newCtx(role, seed).run.accounts).map((a) => [a, 0])) } : {})
        const ctx = play(start, {
          choose: randomChooser(seed * 31),
          answer: (ev, i) => (seed % 3 === 0 ? (lessonsById[ev.lessonId].quiz[i].answer_index + 1) % 3 : lessonsById[ev.lessonId].quiz[i].answer_index),
          shortfall: seed % 2 ? 'transfer' : 'decline',
          renew: seed % 4 === 0,
          extend: seed % 7 === 0,
        })
        const r = ctx.run
        expect(r.finished).toBe(true)
        expect(r.history).toHaveLength(40)
        expect([1, 2, 3].map((c) => r.history.filter((h) => h.chapter === c).length)).toEqual([15, 15, 10])
        for (const id of required) expect(r.history.some((h) => h.eventId === id)).toBe(true)
        expect(reconciles(r)).toBe(true)
        expect(r.debt).toBe(0)
        expect(r.pending).toHaveLength(0)
        expect(new Set(r.ledger.map((l) => l.id)).size).toBe(r.ledger.length)
        expect(r.items.every((i) => i.status === 'returned')).toBe(true)
        for (const k of ['happiness', 'stress'] as const) expect(stat(r, k)).toBeGreaterThanOrEqual(0)
        // No more than 10 FiCoins per lesson met.
        expect(totalCoins(ctx.player)).toBeLessThanOrEqual(Object.keys(ctx.player.mastery).length * 10)
        if (!broke) expect(arrearsTotal(r)).toBeGreaterThanOrEqual(0)
        r.history.forEach((h) => played.add(h.eventId))
        if (seed <= 10) {
          expect(endingParagraphs(r).length).toBeGreaterThanOrEqual(3)
          const ps = playstyles(r)
          if (ps.shares) expect(ps.shares.reduce((s, x) => s + x.share, 0)).toBe(100)
          expect(chapterSummary(r, 2).lines).toHaveLength(15)
        }
      }
      expect(played.size).toBe(70)
    },
    300_000,
  )
})
