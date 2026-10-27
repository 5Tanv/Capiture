import { dayKey, makeStore } from './localStore'
import { pickQuestions, questionByKey } from './questions'

// Daily challenge: five random questions a day, 20 FiCoins for each one answered correctly.
// Keep It Lit: a streak of the days the app was opened.

export const DAILY_COUNT = 5
export const DAILY_COINS = 20

interface DailyData {
  visits: string[]
  day: string
  /** question key -> whether the first answer was right */
  answers: Record<string, boolean>
}

const clean = (raw: unknown): DailyData => {
  const r = (raw ?? {}) as Partial<DailyData>
  return {
    visits: Array.isArray(r.visits) ? r.visits.filter((v): v is string => typeof v === 'string').slice(-400) : [],
    day: typeof r.day === 'string' ? r.day : '',
    answers: r.answers && typeof r.answers === 'object' ? Object.fromEntries(Object.entries(r.answers).filter(([, v]) => typeof v === 'boolean')) : {},
  }
}

export const dailyStore = makeStore<DailyData>('filife.daily.v1', () => ({ visits: [], day: '', answers: {} }), clean)

const shift = (key: string, days: number) => {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + days))
}

/** Count consecutive days ending today (or yesterday, if today has not been visited yet). */
export function streakOf(visits: readonly string[], today = dayKey()): number {
  const set = new Set(visits)
  let cursor = set.has(today) ? today : shift(today, -1)
  let n = 0
  while (set.has(cursor)) {
    n++
    cursor = shift(cursor, -1)
  }
  return n
}

export function recordVisit(today = dayKey()) {
  const d = dailyStore.get()
  if (d.visits.includes(today)) return
  dailyStore.set({ ...d, visits: [...d.visits, today].slice(-400) })
}

const dailyCache = new Map<string, ReturnType<typeof pickQuestions>>()
export const dailyQuestions = (today = dayKey()) => {
  let q = dailyCache.get(today)
  if (!q) dailyCache.set(today, (q = pickQuestions(`daily:${today}`, DAILY_COUNT)))
  return q
}

/** Today's answers only; a new day starts clean. */
const answersFor = (d: DailyData, today: string) => (d.day === today ? d.answers : {})

/**
 * Record the first answer to a daily question. Returns the FiCoins to grant: 20 for a
 * correct first answer, otherwise 0. A question can only ever pay once per day.
 */
export function answerDaily(key: string, option: number, today = dayKey()): number {
  const d = dailyStore.get()
  const q = questionByKey(key)
  if (!q || !dailyQuestions(today).some((p) => p.key === key)) return 0
  const answers = answersFor(d, today)
  if (key in answers) return 0
  const correct = option === q.q.answer_index
  dailyStore.set({ ...d, day: today, answers: { ...answers, [key]: correct } })
  return correct ? DAILY_COINS : 0
}

export function useDaily() {
  const d = dailyStore.use()
  const today = dayKey()
  const questions = dailyQuestions(today)
  const answers = answersFor(d, today)
  const answered = questions.filter((p) => p.key in answers).length
  const correct = questions.filter((p) => answers[p.key]).length
  return { today, questions, answers, answered, correct, total: questions.length, streak: streakOf(d.visits, today), litToday: d.visits.includes(today) }
}
