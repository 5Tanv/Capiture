import { useEffect, useRef } from 'react'
import { XP_PER_CORRECT } from '../../lib/league'
import type { PoolQuestion } from '../../lib/questions'
import { Icon } from '../ui/Icon'

type AnswerState = 'idle' | 'right' | 'wrong' | 'dim'

/**
 * One duel question on a paper card. Answers are full-width buttons, also reachable
 * with the 1–4 keys. After a pick the buttons stay focusable but inert, the right
 * answer is marked with an icon and a word, and focus moves to Next.
 */
export function QuestionCard({
  pq,
  number,
  total,
  picked,
  isLast,
  keys,
  onAnswer,
  onNext,
}: {
  pq: PoolQuestion
  number: number
  total: number
  picked: number | null
  isLast: boolean
  /** Whether the 1–4 shortcuts are live (off while a confirmation covers the card). */
  keys: boolean
  onAnswer: (i: number) => void
  onNext: () => void
}) {
  const { q } = pq
  const promptRef = useRef<HTMLHeadingElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const answered = picked !== null
  const right = answered && picked === q.answer_index

  // A new question takes focus so it is announced; a pick hands focus to Next.
  useEffect(() => {
    promptRef.current?.focus({ preventScroll: true })
  }, [pq.key])
  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true })
  }, [answered])

  useEffect(() => {
    if (answered || !keys) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault()
        onAnswer(n - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, keys, onAnswer, q.options.length])

  const stateOf = (i: number): AnswerState => (!answered ? 'idle' : i === q.answer_index ? 'right' : i === picked ? 'wrong' : 'dim')

  return (
    <section className="arena-paper flex flex-col gap-4 p-4 sm:px-6 sm:py-5" aria-labelledby="duel-q" data-duel-question={number}>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-extrabold tracking-wide text-ink-soft uppercase">
        <span>
          Question {number} of {total}
        </span>
        <span aria-hidden className="h-1.5 w-1.5 bg-ink-soft/60" />
        <span className="text-xp-700">{pq.topic}</span>
      </p>
      <h3 id="duel-q" ref={promptRef} tabIndex={-1} className="outline-none text-[20px] leading-snug font-extrabold break-words text-ink sm:text-[23px]">
        {q.prompt}
      </h3>

      <ul className="flex flex-col gap-3" aria-label="Answers">
        {q.options.map((opt, i) => {
          const state = stateOf(i)
          const mark = state === 'right' ? (i === picked ? 'Correct' : 'Correct answer') : state === 'wrong' ? 'Your answer' : null
          return (
            <li key={i}>
              <button
                type="button"
                data-state={state}
                aria-disabled={answered}
                aria-keyshortcuts={String(i + 1)}
                onClick={() => onAnswer(i)}
                className="arena-answer"
                data-duel-answer={i}
              >
                <span className="arena-key" aria-hidden>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-[16px] leading-snug font-bold break-words sm:text-[17px]">{opt}</span>
                {mark && (
                  <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-extrabold uppercase">
                    <Icon name={state === 'right' ? 'check' : 'close'} className={`h-6 w-6 ${state === 'wrong' ? '[filter:brightness(0.2)]' : ''}`} />
                    {mark}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="status" aria-live="polite">
        {answered ? (
          <>
            <p className="text-[15px] leading-snug font-bold">
              {right ? (
                <>
                  <span className="text-cash-700">Correct!</span> +{XP_PER_CORRECT} league XP
                </>
              ) : (
                <>
                  <span className="text-ember-700">Not quite.</span> The answer is “{q.options[q.answer_index]}”.
                </>
              )}
            </p>
            <button ref={nextRef} type="button" onClick={onNext} className="btn-3d btn-teal min-h-12 shrink-0 gap-2 px-5 text-white" data-duel-next>
              <span className="txt-game-sm text-[17px] leading-none">{isLast ? 'See results' : 'Next question'}</span>
              <Icon name="arrow" className="h-5 w-4" />
            </button>
          </>
        ) : (
          <p className="text-[13px] font-semibold text-ink-soft">Pick an answer, or press 1–{q.options.length}.</p>
        )}
      </div>
    </section>
  )
}
