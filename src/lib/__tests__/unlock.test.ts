import { describe, expect, it } from 'vitest'
import { createRun } from '../../campaign/run'
import { lifeOrder } from '../../data/lives'
import { streakOf } from '../daily'
import { lifeUnlocked } from '../unlock'
import { roleOfLife } from '../../campaign/roles'
import type { LifeId } from '../../types/game'

const runs = () => Object.fromEntries(lifeOrder.map((id) => [id, createRun(roleOfLife[id], 1)])) as Record<LifeId, ReturnType<typeof createRun>>

describe('life unlocks', () => {
  it('opens each life only after the one before finishes chapter 1', () => {
    const r = runs()
    expect(lifeOrder.map((id) => lifeUnlocked(r, lifeOrder, id))).toEqual([true, false, false, false])
    r[lifeOrder[0]] = { ...r[lifeOrder[0]], index: 15 }
    expect(lifeOrder.map((id) => lifeUnlocked(r, lifeOrder, id))).toEqual([true, true, false, false])
    r[lifeOrder[2]] = { ...r[lifeOrder[2]], finished: true }
    expect(lifeUnlocked(r, lifeOrder, lifeOrder[3])).toBe(true)
  })
})

describe('streak', () => {
  it('counts consecutive visited days, and survives until the end of today', () => {
    expect(streakOf(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26')).toBe(3)
    expect(streakOf(['2026-10-24', '2026-10-25'], '2026-10-26')).toBe(2)
    expect(streakOf(['2026-10-22', '2026-10-26'], '2026-10-26')).toBe(1)
    expect(streakOf([], '2026-10-26')).toBe(0)
  })
})
