import { lessonKey } from './content'
import type { Lesson } from './types'

// Lesson mastery and FiCoin receipts belong to the player, not to a character.
// Story events and the Learn library both go through these functions, so a
// lesson is completed once and each question can pay at most once.
//
// FiCoins are never stored as a running total that could be added to twice:
// the balance is `coinBase` (coins earned before receipts existed) plus the sum
// of receipt coins. Merging two copies of the receipts can therefore never pay
// a question again.

export const COINS_PER_CORRECT = 5

export interface Receipt {
  correct: boolean
  coins: number
  /** When the first answer was recorded (client time; used to pick the earliest copy in a merge). */
  at: number
}

export interface MasteryRecord {
  completed: boolean
  /** Question ids whose explanation was acknowledged. Completion = all acknowledged. */
  acknowledged: string[]
  /** One receipt per canonical question id, written with the first answer. */
  receipts: Record<string, Receipt>
  /** Where the lesson was first met. */
  source: 'learn' | 'story' | 'migrated'
  firstEventId?: string
}

/** Keyed by lessonId@version. */
export type Mastery = Record<string, MasteryRecord>

export interface PlayerProgress {
  coinBase: number
  mastery: Mastery
}

export const receiptCoins = (m: Mastery) => Object.values(m).reduce((s, r) => s + Object.values(r.receipts).reduce((t, x) => t + x.coins, 0), 0)
export const totalCoins = (p: PlayerProgress) => p.coinBase + receiptCoins(p.mastery)
export const isCompleted = (m: Mastery, lesson: Pick<Lesson, 'id' | 'version'>) => Boolean(m[lessonKey(lesson)]?.completed)

const emptyRecord = (source: MasteryRecord['source'], firstEventId?: string): MasteryRecord => ({ completed: false, acknowledged: [], receipts: {}, source, firstEventId })

/**
 * Record an answer. Only the first answer to a question, ever, writes a receipt;
 * it pays 5 FiCoins if correct. Retries, reviews and other characters change nothing.
 */
export function answerLesson(
  p: PlayerProgress,
  lesson: Lesson,
  questionId: string,
  option: number,
  now: number,
  source: 'learn' | 'story',
  eventId?: string,
): PlayerProgress {
  const q = lesson.quiz.find((x) => x.id === questionId)
  if (!q || !Number.isInteger(option) || option < 0 || option >= q.options.length) return p
  const key = lessonKey(lesson)
  const rec = p.mastery[key]
  if (rec?.completed || rec?.receipts[questionId]) return p
  const correct = option === q.answer_index
  const next: MasteryRecord = {
    ...(rec ?? emptyRecord(source, eventId)),
    receipts: { ...(rec?.receipts ?? {}), [questionId]: { correct, coins: correct ? COINS_PER_CORRECT : 0, at: now } },
  }
  return { ...p, mastery: { ...p.mastery, [key]: next } }
}

/** Reading an explanation completes that question, right or wrong. Both done = lesson completed. */
export function acknowledgeLesson(p: PlayerProgress, lesson: Lesson, questionId: string, source: 'learn' | 'story', eventId?: string): PlayerProgress {
  if (!lesson.quiz.some((q) => q.id === questionId)) return p
  const key = lessonKey(lesson)
  const rec = p.mastery[key] ?? emptyRecord(source, eventId)
  if (rec.completed || rec.acknowledged.includes(questionId)) return p
  const acknowledged = [...rec.acknowledged, questionId]
  const completed = lesson.quiz.every((q) => acknowledged.includes(q.id))
  return { ...p, mastery: { ...p.mastery, [key]: { ...rec, acknowledged, completed } } }
}

/**
 * Combine two copies of the player's mastery (another tab, an older save).
 * Receipts are a union; when both copies answered the same question the
 * earlier receipt wins. Completion and acknowledgements only ever grow.
 */
export function mergeMastery(a: Mastery, b: Mastery): Mastery {
  const out: Mastery = { ...a }
  for (const [key, rb] of Object.entries(b)) {
    const ra = out[key]
    if (!ra) {
      out[key] = rb
      continue
    }
    const receipts = { ...ra.receipts }
    for (const [qid, x] of Object.entries(rb.receipts)) if (!receipts[qid] || x.at < receipts[qid].at) receipts[qid] = x
    out[key] = {
      ...ra,
      completed: ra.completed || rb.completed,
      acknowledged: [...new Set([...ra.acknowledged, ...rb.acknowledged])],
      receipts,
    }
  }
  return out
}
