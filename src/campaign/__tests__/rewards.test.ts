import { describe, expect, it } from 'vitest'
import { eventLessonKey, getEvent, lessonForEvent, lessonsById } from '../content'
import { acknowledgeQuestion, answerQuestion, chooseOption, progress, type Ctx } from '../engine'
import { acknowledgeLesson, answerLesson, mergeMastery, totalCoins, type PlayerProgress } from '../mastery'
import { createRun } from '../run'
import { finishLesson, freshPlayer, newCtx, play } from './helpers'

const budget = lessonsById.budget
const [q1, q2] = budget.quiz
const wrong = (q: { answer_index: number }) => (q.answer_index + 1) % 3
const learnAll = (p: PlayerProgress, lesson = budget, correct = true) => {
  for (const q of lesson.quiz) {
    p = answerLesson(p, lesson, q.id, correct ? q.answer_index : wrong(q), 1, 'learn')
    p = acknowledgeLesson(p, lesson, q.id, 'learn')
  }
  return p
}

describe('lesson rewards', () => {
  it('pays 5 FiCoins per correct first answer, at most 10 per lesson', () => {
    let p = freshPlayer()
    p = answerLesson(p, budget, q1.id, q1.answer_index, 1, 'learn')
    expect(totalCoins(p)).toBe(5)
    p = answerLesson(p, budget, q2.id, q2.answer_index, 2, 'learn')
    expect(totalCoins(p)).toBe(10)
    p = answerLesson(p, budget, q2.id, q2.answer_index, 3, 'learn')
    expect(totalCoins(p)).toBe(10)
  })

  it('records a wrong first answer and never pays for the retry', () => {
    let p = answerLesson(freshPlayer(), budget, q1.id, wrong(q1), 1, 'learn')
    p = answerLesson(p, budget, q1.id, q1.answer_index, 2, 'learn')
    expect(totalCoins(p)).toBe(0)
    expect(p.mastery['budget@1'].receipts[q1.id]).toEqual({ correct: false, coins: 0, at: 1 })
  })

  it('completes on acknowledging both explanations, even with wrong answers', () => {
    let p = learnAll(freshPlayer(), budget, false)
    expect(p.mastery['budget@1'].completed).toBe(true)
    expect(totalCoins(p)).toBe(0)
    p = answerLesson(p, budget, q1.id, q1.answer_index, 9, 'learn')
    expect(totalCoins(p)).toBe(0) // a review never pays
  })

  it('Learn first makes the story event a review with no reward', () => {
    const player = learnAll(freshPlayer())
    const ctx = progress({ run: createRun('adult', 3), player })
    expect(getEvent(ctx.run.current!.eventId).lessonId).toBe('budget')
    expect(ctx.run.current).toMatchObject({ mode: 'review', stage: 'decide' })
    expect(totalCoins(ctx.player)).toBe(10)
  })

  it('story first marks the lesson completed for Learn', () => {
    const ctx = finishLesson(progress(newCtx('business', 2)))
    expect(ctx.player.mastery[eventLessonKey(getEvent(ctx.run.current!.eventId))].completed).toBe(true)
    const again = answerLesson(ctx.player, budget, q1.id, q1.answer_index, 99, 'learn')
    expect(totalCoins(again)).toBe(totalCoins(ctx.player))
  })

  it('another character meets the same lesson as a review, with that character’s own money', () => {
    const college = play(newCtx('college', 4), { stopAt: 1 })
    const coins = totalCoins(college.player)
    const athlete = progress({ run: createRun('athlete', 4), player: college.player })
    expect(athlete.run.current!.mode).toBe('review')
    expect(totalCoins(athlete.player)).toBe(coins)
    expect(athlete.run.accounts.checking).toBe(1500000)
  })

  it('pays only once when Learn answers a question the open story event already answered', () => {
    let ctx: Ctx = progress(newCtx('adult', 5))
    const lesson = lessonForEvent(getEvent(ctx.run.current!.eventId))
    const q = lesson.quiz[0]
    ctx = answerQuestion(ctx, q.id, q.answer_index, 10)
    const learnView = answerLesson(ctx.player, lesson, q.id, q.answer_index, 11, 'learn')
    expect(totalCoins(learnView)).toBe(5)
  })

  it('finishing the lesson in Learn while the story quiz is open does not strand the event', () => {
    let ctx: Ctx = progress(newCtx('adult', 5))
    const lesson = lessonForEvent(getEvent(ctx.run.current!.eventId))
    ctx = { ...ctx, player: learnAll(ctx.player, lesson) }
    for (const q of lesson.quiz) {
      ctx = answerQuestion(ctx, q.id, q.answer_index, 20)
      ctx = acknowledgeQuestion(ctx, q.id)
    }
    expect(ctx.run.current!.stage).toBe('decide')
    expect(totalCoins(ctx.player)).toBe(10)
    expect(chooseOption(ctx, 'D').run.current!.stage).toBe('done')
  })

  it('merging two open views keeps one receipt per question and never double pays', () => {
    const base = freshPlayer()
    const tabA = answerLesson(base, budget, q1.id, q1.answer_index, 100, 'learn')
    const tabB = answerLesson(base, budget, q1.id, wrong(q1), 50, 'story')
    const merged = mergeMastery(tabA.mastery, tabB.mastery)
    expect(Object.keys(merged['budget@1'].receipts)).toEqual([q1.id])
    expect(merged['budget@1'].receipts[q1.id].at).toBe(50) // the earlier answer wins
    expect(totalCoins({ coinBase: 0, mastery: merged })).toBe(0)
    const both = mergeMastery(tabA.mastery, tabA.mastery)
    expect(totalCoins({ coinBase: 0, mastery: both })).toBe(5)
  })

  it('ignores questions that do not belong to the lesson', () => {
    const p = answerLesson(freshPlayer(), budget, lessonsById.stocks.quiz[0].id, 0, 1, 'learn')
    expect(p.mastery).toEqual({})
  })
})
