import { useEffect, useRef, useState } from 'react'
import { DUEL_QUESTIONS, DUEL_SECONDS, rivalRightAt, XP_PER_CORRECT } from '../../lib/league'
import { useGame } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'
import { DuelResults } from './DuelResults'
import { QuestionCard } from './QuestionCard'
import { Fighter, RivalPortrait, RivalTag, YouPortrait, YouTag } from './parts'
import { rightCount, type DuelController, type DuelData } from './useDuel'

/**
 * The duel arena: a modal <dialog> over the Compete lobby. The native modal makes
 * everything behind it inert and keeps Tab inside; Escape closes before the clock
 * starts and asks before leaving once it runs.
 */
export function DuelDialog({ ctl }: { ctl: DuelController }) {
  const { duel, phase } = ctl
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  // Which duel the leave confirmation belongs to, so a timeout can't leave it hanging over the next one.
  const [confirmFor, setConfirmFor] = useState<string | null>(null)
  const running = phase === 'play' && !duel?.result
  const askLeave = running && confirmFor === duel?.id
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (phase !== 'closed' && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (phase === 'closed' && dialog.open) {
      dialog.close()
      returnFocus.current?.focus()
    }
  }, [phase])

  // Back from "Continue duel": focus returns to the arena, not the page body.
  const wasAsking = useRef(false)
  useEffect(() => {
    if (wasAsking.current && !askLeave && phase === 'play') closeRef.current?.focus()
    wasAsking.current = askLeave
  }, [askLeave, phase])

  const requestClose = () => {
    if (running) setConfirmFor(duel?.id ?? null)
    else ctl.close()
  }
  const onEscape = () => {
    if (askLeave) setConfirmFor(null)
    else requestClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="arena-title"
      onKeyDown={(e) => {
        // Handle Escape here so the browser never closes the modal on its own.
        if (e.key !== 'Escape') return
        e.preventDefault()
        onEscape()
      }}
      onCancel={(e) => {
        e.preventDefault()
        onEscape()
      }}
      onClose={() => {
        // A forced close (repeated close requests) must not hide a duel that is still on.
        if (phaseRef.current !== 'closed') {
          dialogRef.current?.showModal()
          if (running) setConfirmFor(duel?.id ?? null)
        }
      }}
      className="arena arena-dialog"
      data-duel-dialog
    >
      {duel && (
        <>
          <header className="flex shrink-0 items-center gap-3 border-b-[3px] border-ink bg-[var(--ar-night)]/60 px-4 py-3 sm:px-6">
            <Icon name="bolt" className="h-8 w-8" />
            <div className="min-w-0 flex-1">
              <h2 id="arena-title" className="txt-game-sm text-[20px] leading-none">
                Duel Arena
              </h2>
              <p className="mt-1 truncate text-[13px] font-bold text-[var(--ar-mute)]">Practice duel against this week&rsquo;s computer rival</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={requestClose}
              disabled={askLeave}
              aria-label={running ? 'Leave duel…' : 'Close the arena'}
              className="btn-3d grid h-11 w-11 shrink-0 place-items-center p-0"
              data-duel-close
            >
              <Icon name="close" className="h-6 w-6" />
            </button>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div inert={askLeave} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:px-6 sm:py-5">
              {phase === 'ready' && <ReadyView duel={duel} onReady={ctl.start} onCancel={ctl.close} />}
              {phase === 'play' && (
                <>
                  <Scoreboard duel={duel} elapsed={ctl.elapsed} />
                  {duel.questions[duel.idx] && (
                    <QuestionCard
                      pq={duel.questions[duel.idx]}
                      number={duel.idx + 1}
                      total={duel.questions.length}
                      picked={duel.picks[duel.idx] ?? null}
                      isLast={duel.idx + 1 >= duel.questions.length}
                      keys={!askLeave}
                      onAnswer={ctl.answer}
                      onNext={ctl.advance}
                    />
                  )}
                </>
              )}
              {phase === 'results' && duel.result && (
                <DuelResults key={duel.id} duel={duel} result={duel.result} onAgain={ctl.open} onBack={ctl.close} />
              )}
            </div>
            {askLeave && <LeaveConfirm duel={duel} onStay={() => setConfirmFor(null)} onLeave={ctl.leave} />}
          </div>
        </>
      )}
    </dialog>
  )
}

function ReadyView({ duel, onReady, onCancel }: { duel: DuelData; onReady: () => void; onCancel: () => void }) {
  const { account } = useGame()
  const readyRef = useRef<HTMLButtonElement>(null)
  useEffect(() => readyRef.current?.focus(), [])
  const usable = duel.questions.length > 0

  return (
    <div className="flex flex-col gap-6" data-duel-ready>
      <section className="arena-frame arena-frame-gold grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6 sm:px-8">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <YouPortrait className="h-20 w-20 sm:h-24 sm:w-24" />
          <p className="txt-game-sm w-full truncate text-[18px]" title={account.username}>
            {account.username}
          </p>
          <YouTag />
        </div>
        <div className="flex flex-col items-center gap-1" aria-hidden>
          <Icon name="bolt" className="h-10 w-10" />
          <span className="txt-game text-[28px] leading-none">VS</span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <RivalPortrait rival={duel.rival} className="h-20 w-20 sm:h-24 sm:w-24" />
          <p className="txt-game-sm w-full truncate text-[18px]" title={duel.rival.name}>
            {duel.rival.name}
          </p>
          <RivalTag />
        </div>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        <Rule icon="target" title={`${DUEL_QUESTIONS} questions`} body="Each from a different money topic." />
        <Rule icon="hourglass" title={`${DUEL_SECONDS} seconds`} body="The clock starts when you press I'm ready." />
        <Rule icon="xp" title={`+${XP_PER_CORRECT} league XP each`} body="For every right answer. Wrong answers cost nothing." />
        <Rule icon="bolt" title={`${duel.rival.name} plays too`} body="The game answers for them at their own pace; their right answers earn them XP." />
      </ul>
      <p className="text-center text-[14px] font-semibold text-[var(--ar-mute)]">
        Once the clock starts, leaving counts as letting it run out.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={onCancel} className="btn-3d min-h-12 px-6 text-[15px] font-extrabold text-parch-100">
          Not now
        </button>
        <button ref={readyRef} type="button" onClick={onReady} disabled={!usable} className="btn-3d btn-gold min-h-14 gap-2 px-8" data-duel-go>
          <Icon name="bolt" className="h-6 w-6" />
          <span className="txt-game text-[22px] leading-none">I&rsquo;M READY</span>
        </button>
      </div>
      {!usable && <p className="text-center text-[14px] font-bold text-ember-500">No questions are available right now.</p>}
    </div>
  )
}

function Rule({ icon, title, body }: { icon: 'target' | 'hourglass' | 'xp' | 'bolt'; title: string; body: string }) {
  return (
    <li className="arena-well flex items-start gap-3 px-4 py-3">
      <Icon name={icon} className="h-8 w-8 shrink-0" />
      <span>
        <span className="block text-[15px] font-extrabold">{title}</span>
        <span className="block text-[14px] leading-snug font-semibold text-[var(--ar-mute)]">{body}</span>
      </span>
    </li>
  )
}

function Scoreboard({ duel, elapsed }: { duel: DuelData; elapsed: number }) {
  const { account } = useGame()
  const left = Math.max(0, Math.ceil(DUEL_SECONDS - elapsed))
  const low = left <= 10
  const theirs = duel.result?.theirs ?? rivalRightAt(duel.bot, elapsed)
  const mine = rightCount(duel)

  return (
    <section aria-label="Scoreboard" className="flex shrink-0 flex-col gap-3">
      <div className="arena-frame grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5">
        <Fighter
          portrait={<YouPortrait className="h-11 w-11 sm:h-14 sm:w-14" />}
          name={account.username}
          tag={<YouTag className="hidden sm:inline-block" />}
          score={<Score n={mine} />}
        />
        <div className="arena-timer" data-low={low} role="timer" aria-label={`${left} seconds left`} data-duel-timer>
          <span className="font-display text-[30px] leading-none tabular-nums">{left}</span>
          <span className="font-pixel text-[10px] leading-none">{low ? 'HURRY' : 'SEC'}</span>
        </div>
        <Fighter
          flip
          portrait={<RivalPortrait rival={duel.rival} className="h-11 w-11 sm:h-14 sm:w-14" />}
          name={duel.rival.name}
          tag={<RivalTag className="hidden sm:inline-block" />}
          score={<Score n={theirs} />}
        />
      </div>
      {/* Announce the clock only at a few moments, not every second. */}
      <p className="sr-only" aria-live="polite">
        {left === 30 || left === 10 ? `${left} seconds left` : ''}
      </p>
      <ol className="flex gap-1.5" aria-hidden>
        {duel.questions.map((pq, i) => {
          const p = duel.picks[i]
          const c = p === undefined ? (i === duel.idx ? 'bg-brass-400' : 'bg-[var(--ar-line)]') : p === pq.q.answer_index ? 'bg-cash-500' : 'bg-ember-500'
          return <li key={pq.key} className={`h-2 flex-1 ${c}`} />
        })}
      </ol>
    </section>
  )
}

const Score = ({ n }: { n: number }) => (
  <span className="text-[14px] font-extrabold text-[var(--ar-teal)] tabular-nums">
    <span className="font-display text-[20px] text-parch-100">{n}</span> right
  </span>
)

function LeaveConfirm({ duel, onStay, onLeave }: { duel: DuelData; onStay: () => void; onLeave: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null)
  useEffect(() => stayRef.current?.focus(), [])
  const mine = rightCount(duel)

  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-[rgb(5_8_22/0.78)] p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="leave-h" aria-describedby="leave-d" className="arena-frame arena-frame-gold flex w-full max-w-[460px] flex-col gap-4 p-6" data-duel-leave>
        <h3 id="leave-h" className="txt-game-sm text-[22px] leading-tight">
          Leave this duel?
        </h3>
        <div id="leave-d" className="flex flex-col gap-2 text-[15px] leading-relaxed font-semibold text-parch-200">
          <p>The clock is still running while you decide.</p>
          <p>
            Leaving counts as letting the clock run out. Your {mine} right {mine === 1 ? 'answer counts' : 'answers count'} (+{(mine * XP_PER_CORRECT).toLocaleString()} XP),{' '}
            {duel.rival.name} is scored for the whole minute, and the duel can&rsquo;t be replayed.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onLeave} className="btn-3d min-h-12 px-5 text-[15px] font-extrabold text-parch-100" data-duel-leave-confirm>
            Leave duel
          </button>
          <button ref={stayRef} type="button" onClick={onStay} className="btn-3d btn-gold min-h-12 px-6">
            <span className="txt-game-sm text-[17px] leading-none">CONTINUE DUEL</span>
          </button>
        </div>
      </div>
    </div>
  )
}
