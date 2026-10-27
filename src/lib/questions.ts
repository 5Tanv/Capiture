import { categories, lessons } from '../campaign/content'
import type { QuizQuestion } from '../campaign/types'
import { rngFrom } from './localStore'

export interface PoolQuestion {
  /** lessonId/questionId, stable. */
  key: string
  lessonId: string
  topic: string
  q: QuizQuestion
}

const topicOf = (categoryId: string) => categories.find((c) => c.id === categoryId)?.title ?? 'Money'

export const questionPool: PoolQuestion[] = lessons.flatMap((l) => l.quiz.map((q) => ({ key: `${l.id}/${q.id}`, lessonId: l.id, topic: topicOf(l.categoryId), q })))
const byKey = new Map(questionPool.map((p) => [p.key, p]))
export const questionByKey = (key: string) => byKey.get(key)

/** `n` questions, each from a different topic while topics last, in a seeded random order. */
export function pickQuestions(seed: string, n: number): PoolQuestion[] {
  const rnd = rngFrom(seed)
  const shuffled = [...questionPool].sort(() => rnd() - 0.5)
  const out: PoolQuestion[] = []
  const topics = new Set<string>()
  for (const p of shuffled) {
    if (out.length === n) break
    if (!topics.has(p.topic)) {
      topics.add(p.topic)
      out.push(p)
    }
  }
  for (const p of shuffled) {
    if (out.length === n) break
    if (!out.includes(p)) out.push(p)
  }
  return out
}
