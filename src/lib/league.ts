import { randomAppearance, type Appearance } from '../sprites/catalog'
import { makeStore, rngFrom, weekKey } from './localStore'

// The weekly league, for the demo: you against one random rival. League XP comes only from
// duels: 100 for every question answered correctly. A new week brings a new rival.

export const XP_PER_CORRECT = 100
export const DUEL_QUESTIONS = 10
export const DUEL_SECONDS = 60

const NAMES = ['Priya', 'Marcus', 'Elena', 'Tomás', 'Aisha', 'Kenji', 'Sofia', 'Dante', 'Mei', 'Omar', 'Zara', 'Luca', 'Nia', 'Felix', 'Ravi', 'Hana']

export interface Rival {
  name: string
  appearance: Appearance
  /** 0..1 chance of a correct answer, and seconds per answer. */
  skill: number
  pace: number
}

export interface DuelRecord {
  /** The duel's seed; a duel is recorded at most once. */
  id?: string
  at: number
  mine: number
  theirs: number
}

interface LeagueData {
  week: string
  rival: Rival
  myXp: number
  rivalXp: number
  duels: DuelRecord[]
}

export function newWeek(week: string): LeagueData {
  const r = rngFrom(`league:${week}`)
  const seed = Math.floor(r() * 2_000_000_000) + 1
  return {
    week,
    rival: { name: NAMES[Math.floor(r() * NAMES.length)], appearance: randomAppearance(seed), skill: 0.55 + r() * 0.3, pace: 4.5 + r() * 3 },
    myXp: 0,
    // They have already been playing this week.
    rivalXp: Math.floor((2 + r() * 4)) * XP_PER_CORRECT,
    duels: [],
  }
}

const clean = (raw: unknown): LeagueData => {
  const cur = weekKey()
  const r = raw as Partial<LeagueData> | null
  if (!r || r.week !== cur || !r.rival || typeof r.rival.name !== 'string' || !r.rival.appearance) return newWeek(cur)
  return {
    week: cur,
    rival: r.rival,
    myXp: Number.isFinite(r.myXp) ? Math.max(0, r.myXp as number) : 0,
    rivalXp: Number.isFinite(r.rivalXp) ? Math.max(0, r.rivalXp as number) : 0,
    duels: Array.isArray(r.duels) ? r.duels.slice(-20) : [],
  }
}

export const leagueStore = makeStore<LeagueData>('filife.league.v1', () => newWeek(weekKey()), clean)

/** The league for this week; rolls over to a new rival when the week changes. */
export function currentLeague(): LeagueData {
  const d = leagueStore.get()
  if (d.week === weekKey()) return d
  const fresh = newWeek(weekKey())
  leagueStore.set(fresh)
  return fresh
}

/** Adds one finished duel to the league. Returns false if this duel was already recorded. */
export function recordDuel(id: string, mine: number, theirs: number): boolean {
  const d = currentLeague()
  if (d.duels.some((x) => x.id === id)) return false
  leagueStore.set({
    ...d,
    myXp: d.myXp + mine * XP_PER_CORRECT,
    rivalXp: d.rivalXp + theirs * XP_PER_CORRECT,
    duels: [...d.duels, { id, at: Date.now(), mine, theirs }].slice(-20),
  })
  return true
}

/** Days until the league resets on Monday (1..7). */
export function daysUntilReset(d = new Date()) {
  return 7 - ((d.getDay() + 6) % 7)
}

export interface BotAnswer {
  at: number
  correct: boolean
}

/** When the rival answers each question during the minute, and whether each is right. */
export function botTimeline(rival: Rival, seed: string): BotAnswer[] {
  const r = rngFrom(`bot:${seed}`)
  const out: BotAnswer[] = []
  let t = 0
  for (let i = 0; i < DUEL_QUESTIONS; i++) {
    t += rival.pace * (0.6 + r() * 0.8)
    if (t > DUEL_SECONDS) break
    out.push({ at: t, correct: r() < rival.skill })
  }
  return out
}

/** The rival's right answers `seconds` into the duel. */
export const rivalRightAt = (bot: BotAnswer[], seconds: number) => bot.filter((b) => b.at <= seconds && b.correct).length
