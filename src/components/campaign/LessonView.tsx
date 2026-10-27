import type { Receipt } from '../../campaign/mastery'
import type { Lesson, QuizQuestion } from '../../campaign/types'
import { Icon } from '../ui/Icon'

// The one lesson renderer. Story events and the Learn library show the same
// canonical lesson text and the same two questions through these components.

export function LessonText({ lesson, label }: { lesson: Lesson; label: string }) {
  return (
    <section className="rounded-[12px] border-2 border-ink bg-[#e6f3fa] px-4 py-3 text-ink shadow-[inset_0_-3px_0_#bcdcee]">
      <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-wide text-xp-700 uppercase">
        <Icon name="book" className="h-5 w-5" />
        {label}
      </p>
      <h3 className="font-display mt-0.5 text-[19px] leading-tight">{lesson.title}</h3>
      <p className="mt-0.5 text-[13px] font-bold text-ink-soft">{lesson.objective}</p>
      <p className="mt-2 text-[16px] leading-relaxed font-semibold">{lesson.sentences.join(' ')}</p>
    </section>
  )
}

export function Question({
  q,
  n,
  attempts,
  acknowledged,
  receipt,
  onAnswer,
  onAck,
  practice = false,
}: {
  q: QuizQuestion
  n: number
  attempts: number[]
  acknowledged: boolean
  /** The player's first-answer receipt for this question, if one exists. */
  receipt?: Receipt
  onAnswer: (i: number) => void
  onAck?: () => void
  /** Review/practice: explanations only, never FiCoins. */
  practice?: boolean
}) {
  const last = attempts[attempts.length - 1]
  const answered = attempts.length > 0
  const solved = attempts.includes(q.answer_index)
  return (
    <fieldset className="surface-reading px-4 py-3" aria-describedby={answered ? `${q.id}-why` : undefined}>
      <legend className="sr-only">Question {n}</legend>
      <p className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">Question {n} of 2</p>
      <p className="font-display mt-0.5 text-[18px] leading-snug">{q.prompt}</p>
      <ul className="mt-2.5 flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const tried = attempts.includes(i)
          const isRight = i === q.answer_index
          const state = tried ? (isRight ? 'right' : 'wrong') : solved && isRight ? 'right' : 'idle'
          return (
            <li key={opt}>
              <button
                type="button"
                disabled={acknowledged || solved || tried}
                onClick={() => onAnswer(i)}
                aria-pressed={tried}
                className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] border-2 border-ink px-3 py-2 text-left text-[15px] font-bold transition-transform enabled:hover:-translate-y-0.5 ${
                  state === 'right' ? 'bg-cash-300' : state === 'wrong' ? 'bg-[#ffd2c2]' : 'bg-parch-100'
                }`}
              >
                <span className="font-display grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-parch-200 text-[14px]">{'ABC'[i]}</span>
                <span className="flex-1">{opt}</span>
                {state === 'right' && <span className="text-[12px] font-extrabold">✓ Correct</span>}
                {state === 'wrong' && <span className="text-[12px] font-extrabold">✗ Not this one</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {answered && (
        <div id={`${q.id}-why`} className="mt-3 rounded-[10px] border-2 border-dashed border-parch-500 px-3 py-2" aria-live="polite">
          <p className="text-[14px] font-extrabold">{last === q.answer_index ? 'Correct.' : solved ? 'You found it.' : 'Not quite.'}</p>
          <p className="text-[14px] leading-relaxed font-semibold">{q.explanation}</p>
          {practice ? (
            <p className="mt-1 text-[12px] font-bold text-ink-soft">Review practice: no FiCoins.</p>
          ) : (
            receipt && (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-extrabold">
                <Icon name="coin" className="h-4 w-4" label="FiCoins" />
                {receipt.coins > 0 ? `+${receipt.coins} FiCoins for your first answer` : 'First answer recorded: no FiCoins this time, and retrying is still worth it.'}
              </p>
            )
          )}
          {!solved && !acknowledged && <p className="mt-1 text-[12px] font-bold text-ink-soft">You can try another answer to understand it (no new FiCoins).</p>}
          {onAck && !acknowledged && (
            <button type="button" onClick={onAck} autoFocus className="btn-3d btn-green mt-2 min-h-10 rounded-[10px] px-4 text-[14px] font-extrabold text-white">
              Got it{n === 2 ? ': done' : ': next question'}
            </button>
          )}
        </div>
      )}
    </fieldset>
  )
}
