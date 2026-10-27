import { describe, expect, it } from 'vitest'
import { botTimeline, currentLeague, daysUntilReset, DUEL_SECONDS, leagueStore, recordDuel, rivalRightAt, XP_PER_CORRECT } from '../league'

describe('league', () => {
  it('records a duel once, however many times it is reported', () => {
    const start = currentLeague()
    expect(recordDuel('duel-a', 4, 2)).toBe(true)
    expect(recordDuel('duel-a', 4, 2)).toBe(false)
    expect(recordDuel('duel-a', 9, 0)).toBe(false)
    const after = leagueStore.get()
    expect(after.myXp - start.myXp).toBe(4 * XP_PER_CORRECT)
    expect(after.rivalXp - start.rivalXp).toBe(2 * XP_PER_CORRECT)
    expect(after.duels.filter((d) => d.id === 'duel-a')).toHaveLength(1)
  })

  it('counts only the rival answers given by a moment, and all of them by the end', () => {
    const bot = botTimeline(currentLeague().rival, 'seed')
    expect(rivalRightAt(bot, 0)).toBe(0)
    const full = rivalRightAt(bot, DUEL_SECONDS)
    expect(full).toBe(bot.filter((b) => b.correct).length)
    for (let t = 0; t < DUEL_SECONDS; t += 5) expect(rivalRightAt(bot, t)).toBeLessThanOrEqual(rivalRightAt(bot, t + 5))
  })

  it('resets on Monday', () => {
    expect(daysUntilReset(new Date(2026, 9, 26))).toBe(7) // a Monday
    expect(daysUntilReset(new Date(2026, 10, 1))).toBe(1) // the Sunday after
  })
})
