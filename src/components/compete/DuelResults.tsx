import { useEffect, useRef, type ReactNode } from 'react'
import { leagueStore, XP_PER_CORRECT } from '../../lib/league'
import { useGame } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'
import type { DuelData, DuelResult } from './useDuel'
import { RivalPortrait, YouPortrait } from './parts'

const reasonLine: Record<DuelResult['reason'], string> = {
  complete: 'You answered all ten questions.',
  timeout: 'Time ran out.',
  left: 'You left early, so it was scored as if time ran out.',
}

/** The end of a duel: who won, both scores, the league XP it was worth, and a review. */
export function DuelResults({ duel, result, onAgain, onBack }: { duel: DuelData; result: DuelResult; onAgain: () => void; onBack: () => void }) {
  const { account } = useGame()
  const league = leagueStore.use()
  const headRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headRef.current?.focus({ preventScroll: true }), [])

  const { mine, theirs } = result
  const won = mine > theirs
  const verdict = won ? 'Victory!' : mine < theirs ? `${duel.rival.name} wins` : "It's a tie"
  const rank = league.myXp >= league.rivalXp ? 1 : 2

  return (
    <div className="flex flex-col gap-6" data-duel-result>
      <section className="arena-frame arena-frame-gold flex flex-col items-center gap-2 px-4 pt-6 pb-5 text-center">
        <div className="flex items-end gap-2" aria-hidden>
          <Icon name="star" className="h-6 w-6 opacity-80" />
          <Icon name={won ? 'trophy' : mine === theirs ? 'medal' : 'bolt'} className="anim-pop h-14 w-14" />
          <Icon name="star" className="h-6 w-6 opacity-80" />
        </div>
        <h3 ref={headRef} tabIndex={-1} className="outline-none txt-game text-[34px] leading-none sm:text-[40px]">
          {verdict}
        </h3>
        <p className="text-[15px] font-semibold text-[var(--ar-mute)]">{reasonLine[result.reason]}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScoreTile portrait={<YouPortrait className="h-14 w-14" />} name={`${account.username} (you)`} right={mine} winner={won} />
        <ScoreTile portrait={<RivalPortrait rival={duel.rival} className="h-14 w-14" />} name={`${duel.rival.name} (computer)`} right={theirs} winner={mine < theirs} />
      </div>

      <p className="arena-well flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-center text-[15px] font-bold" data-duel-xp>
        <span className="flex items-center gap-2">
          <Icon name="xp" className="h-6 w-6" />
          You earned <strong className="text-brass-400">+{(mine * XP_PER_CORRECT).toLocaleString()} league XP</strong>
        </span>
        <span className="text-[var(--ar-mute)]">
          You are #{rank} this week with {league.myXp.toLocaleString()} XP
        </span>
      </p>

      {duel.picks.length > 0 && (
      <details className="arena-well group px-4 py-3">
        <summary className="cursor-pointer text-[15px] font-extrabold text-[var(--ar-teal)]">Review the questions ({duel.picks.length} answered)</summary>
        <ol className="mt-3 flex flex-col gap-3">
          {duel.questions.map((pq, i) => {
            const pick = duel.picks[i]
            if (pick === undefined) return null
            const ok = pick === pq.q.answer_index
            return (
              <li key={pq.key} className="arena-paper flex flex-col gap-1 p-3 text-[14px]">
                <p className="flex items-start gap-2 font-extrabold">
                  <Icon name={ok ? 'check' : 'close'} className={`h-5 w-5 shrink-0 ${ok ? '' : '[filter:brightness(0.2)]'}`} />
                  <span>
                    <span className="sr-only">{ok ? 'Right: ' : 'Wrong: '}</span>
                    {pq.q.prompt}
                  </span>
                </p>
                {!ok && (
                  <p className="font-semibold text-ink-soft">
                    You said “{pq.q.options[pick]}”. Answer: “{pq.q.options[pq.q.answer_index]}”.
                  </p>
                )}
                <p className="leading-relaxed font-semibold text-ink-soft">{pq.q.explanation}</p>
              </li>
            )
          })}
        </ol>
      </details>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onBack} className="btn-3d min-h-12 px-6 text-[15px] font-extrabold text-parch-100">
          Back to Compete
        </button>
        <button type="button" onClick={onAgain} className="btn-3d btn-gold min-h-12 gap-2 px-6" data-duel-again>
          <Icon name="bolt" className="h-5 w-5" />
          <span className="txt-game text-[19px] leading-none">PLAY AGAIN</span>
        </button>
      </div>
    </div>
  )
}

function ScoreTile({ portrait, name, right, winner }: { portrait: ReactNode; name: string; right: number; winner: boolean }) {
  return (
    <div className={`arena-frame flex min-w-0 items-center gap-4 p-4 ${winner ? 'arena-frame-gold' : ''}`}>
      {portrait}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-extrabold" title={name}>
          {name}
          {winner && <span className="ml-2 font-pixel text-[12px] text-brass-400">WINNER</span>}
        </p>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className="font-display text-[30px] leading-none tabular-nums">{right}</span>
          <span className="text-[14px] font-bold text-[var(--ar-mute)]">right · +{(right * XP_PER_CORRECT).toLocaleString()} XP</span>
        </p>
      </div>
    </div>
  )
}
