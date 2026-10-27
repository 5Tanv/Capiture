import { useState } from 'react'
import { answerDaily, DAILY_COINS, useDaily } from '../../lib/daily'
import { useGameDispatch } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'

/** Five random questions a day in the Learn tab; each right first answer pays 20 FiCoins. */
export function DailyChallenge() {
  const dispatch = useGameDispatch()
  const { questions, answers, answered, correct, total } = useDaily()
  const [picked, setPicked] = useState<Record<string, number>>({})
  const done = answered === total

  const answer = (key: string, option: number) => {
    if (key in answers) return
    setPicked((p) => ({ ...p, [key]: option }))
    const coins = answerDaily(key, option)
    if (coins > 0) dispatch({ type: 'grantCoins', amount: coins })
  }

  return (
    <section aria-labelledby="daily-h" className="surface-hud mt-5 p-4" data-daily>
      <div className="flex flex-wrap items-center gap-3">
        <Icon name="target" className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <h2 id="daily-h" className="txt-game-sm text-xl leading-tight">
            Daily Challenge
          </h2>
          <p className="text-[12px] font-bold text-sage-300">
            Five new questions every day · {DAILY_COINS} FiCoins for each one you get right
          </p>
        </div>
        <p className="rounded-full border-2 border-ink bg-black/30 px-3 py-1 text-[13px] font-extrabold tabular-nums" data-daily-count>
          {answered}/{total} answered · {correct * DAILY_COINS} earned
        </p>
      </div>
      {done ? (
        <p className="mt-3 text-[14px] font-bold text-parch-200">All done for today. Come back tomorrow for five new questions and keep your streak lit.</p>
      ) : (
        <ol className="mt-3 grid gap-3 lg:grid-cols-2">
          {questions.map((p, n) => {
            const mine = p.key in answers ? picked[p.key] : undefined
            const isDone = p.key in answers
            return (
              <li key={p.key} className="surface-reading px-3.5 py-3" data-daily-q={p.key}>
                <p className="text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
                  {n + 1} of {total} · {p.topic}
                </p>
                <p className="font-display mt-0.5 text-[16px] leading-snug">{p.q.prompt}</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {p.q.options.map((opt, i) => {
                    const state = !isDone ? 'idle' : i === p.q.answer_index ? 'right' : i === mine ? 'wrong' : 'idle'
                    return (
                      <li key={opt}>
                        <button
                          type="button"
                          disabled={isDone}
                          onClick={() => answer(p.key, i)}
                          className={`min-h-10 w-full rounded-[10px] border-[3px] border-ink px-2.5 py-1 text-left text-[14px] font-bold ${
                            state === 'right' ? 'bg-cash-500 text-ink' : state === 'wrong' ? 'bg-ember-500 text-white' : 'bg-parch-100 text-ink enabled:hover:bg-parch-200'
                          }`}
                        >
                          {opt}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {isDone && <p className="mt-2 text-[13px] font-semibold text-ink-soft">{p.q.explanation}</p>}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
