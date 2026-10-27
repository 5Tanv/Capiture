import { useEffect, useMemo, useRef, useState } from 'react'
import { sceneExtras } from '../../campaign/callbacks'
import { dayLabel } from '../../campaign/calendar'
import { CHAPTER_POSITIONS, eventLessonKey, getEvent, lessonForEvent } from '../../campaign/content'
import {
  canCheckIn,
  canRecover,
  choiceBlockers,
  choiceConsequences,
  choiceDeltas,
  currentEventDef,
  dueItems,
  eventDay,
  previewShortfallSale,
  previewState,
  shortfallNeed,
  shortfallSources,
  upcomingBills,
} from '../../campaign/engine'
import type { Mastery } from '../../campaign/mastery'
import { formatCents, previewChoice } from '../../campaign/money'
import { fillName, type RoleNames } from '../../campaign/names'
import { ASSET_NAMES, formatUnits, portfolioValue, unitsHeld } from '../../campaign/portfolio'
import { ACCOUNT_NAMES, ROLES, pricesOn } from '../../campaign/roles'
import { arrearsTotal, bal, chapterOf, chapterStart, netWorth, stat, type CampaignRun, type CurrentEvent, type Stats } from '../../campaign/run'
import type { AssetId, ChoiceDef, EventDef, StatKey } from '../../campaign/types'
import { eventScene } from '../../data/eventScenes'
import { useActiveLife, useCampaign, useGameDispatch, useRoleNames } from '../../state/GameProvider'
import type { CampaignOp } from '../../state/gameReducer'
import { useGame } from '../../state/GameProvider'
import { LedgerLine, StatChip, StatChips, statNames } from '../campaign/parts'
import { LessonText, Question } from '../campaign/LessonView'
import { Portrait } from '../lobby/Portrait'
import { Icon } from '../ui/Icon'
import { SceneWindow } from './SceneWindow'

type Step = (s: CampaignOp) => void

/**
 * A campaign event: what happened since last time, a new lesson with two
 * questions (or a review), the scenario with your story so far, four choices
 * with exact costs, then the outcome and its reasons.
 */
export function CampaignEventModal({ onComplete }: { onComplete: () => void }) {
  const { eventOpen } = useGame()
  const life = useActiveLife()
  const { run, mastery } = useCampaign()
  const names = useRoleNames()
  const dispatch = useGameDispatch()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const step: Step = (s) => dispatch({ type: 'campaign', step: s })
  const cur = run.current
  const ev = cur ? getEvent(cur.eventId) : currentEventDef(run)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (eventOpen && !dialog.open) dialog.showModal()
    else if (!eventOpen && dialog.open) dialog.close()
  }, [eventOpen])

  const close = () => dispatch({ type: 'closeEvent' })
  const finish = () => {
    step({ op: 'continue' })
    onComplete()
  }
  const scene = ev ? eventScene(ev) : { sceneId: life.worldId, npcs: [] }
  const index = cur?.index ?? run.index
  const chapter = chapterOf(index)
  const title = run.pause ? 'Before your next event' : (ev?.title ?? 'Your year')

  return (
    <dialog
      ref={dialogRef}
      id="event-dialog"
      aria-labelledby="event-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      className="m-auto max-h-[100dvh] w-[min(46rem,calc(100vw-1.5rem))] overflow-visible bg-transparent px-0 pt-7 pb-3 text-parch-100 backdrop:backdrop-blur-[2px]"
    >
      {eventOpen && (
        <div className="panel-wood anim-rise flex max-h-[calc(100dvh-2.5rem)] flex-col">
          <div className="relative z-10 mx-auto -mt-5 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-brass-400 to-brass-600 px-5 py-2 shadow-[inset_0_3px_0_rgb(255_255_255/0.55),0_6px_12px_-4px_rgb(0_0_0/0.6)]">
            <Portrait lifeId={life.id} worldId={life.worldId} className="h-9 w-9 shrink-0 rounded-[8px] border-2 border-ink" />
            <h2 id="event-title" className="txt-game text-xl leading-none sm:text-2xl">
              {title}
            </h2>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto px-4 pt-4 pb-5 sm:px-6">
            <SceneWindow life={life} sceneId={scene.sceneId} npcs={scene.npcs} />
            {ev && (
              <p className="-mt-1 text-center text-[13px] font-extrabold text-brass-300">
                {life.name} · Chapter {chapter} · Event {index - chapterStart(chapter) + 1} of {CHAPTER_POSITIONS[chapter - 1]} · {dayLabel(run.role, eventDay(ev), true)}
              </p>
            )}

            {run.pause ? (
              <PausePanel run={run} step={step} />
            ) : !cur || !ev ? (
              <p className="surface-reading px-4 py-3 text-[15px] font-semibold">There is no event waiting right now.</p>
            ) : (
              <>
                <TransitionLedger run={run} cur={cur} ev={ev} step={step} />
                {cur.stage === 'learn' && <LearnPhase ev={ev} cur={cur} mastery={mastery} step={step} />}
                {cur.stage === 'decide' && <DecidePhase run={run} ev={ev} cur={cur} names={names} step={step} />}
                {cur.stage === 'done' && <OutcomePhase run={run} ev={ev} cur={cur} step={step} />}
              </>
            )}

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              {ev ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'openLesson', lessonKey: eventLessonKey(ev) })}
                  className="flex items-center gap-2 rounded-md text-[14px] font-extrabold text-xp-300 underline decoration-2 underline-offset-4 hover:text-white"
                >
                  <Icon name="book" className="h-5 w-5" />
                  Open “{lessonForEvent(ev).title}” in Learn
                </button>
              ) : (
                <span />
              )}
              {cur?.stage === 'done' && !run.pause ? (
                <button
                  type="button"
                  onClick={finish}
                  disabled={dueItems(run).length > 0}
                  autoFocus
                  data-tour="continue"
                  className="btn-3d btn-gold min-h-14 gap-3 rounded-[14px] px-8 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="txt-game text-2xl leading-none">CONTINUE</span>
                  <Icon name="arrow" className="h-6 w-5" />
                </button>
              ) : (
                <button type="button" onClick={close} className="btn-3d min-h-11 rounded-[10px] px-5 text-[14px] font-extrabold text-parch-100">
                  Decide later
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}

// ── Transition: what the calendar did since the last event ────────────────

function TransitionLedger({ run, cur, ev, step }: { run: CampaignRun; cur: CurrentEvent; ev: EventDef; step: Step }) {
  const entries = run.ledger.slice(cur.ledgerStart).filter((e) => e.eventId !== ev.id)
  const prev = run.history[run.history.length - 1]
  const fromDay = prev ? prev.day : -1
  const toDayN = eventDay(ev)
  const valueNow = portfolioValue(run.lots, pricesOn(run.role, toDayN))
  const valueThen = portfolioValue(run.lots, pricesOn(run.role, Math.max(-1, fromDay)))
  const notes = run.utilities.filter((u) => u.day > fromDay && u.day <= toDayN && (u.id.startsWith('deadline:') || u.id.startsWith('ready:')))
  const support = canRecover(run) || canCheckIn(run)
  const [open, setOpen] = useState(cur.stage !== 'done')
  if (!entries.length && !notes.length && valueNow === valueThen && !support) return null
  return (
    <section className="surface-reading px-4 py-3" aria-labelledby="since-h">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left">
        <span>
          <span id="since-h" className="font-display block text-[17px] leading-tight">
            {prev ? `Since ${dayLabel(run.role, fromDay)}` : 'Your first days'}
          </span>
          <span className="text-[12px] font-bold text-ink-soft">
            {entries.length} money {entries.length === 1 ? 'entry' : 'entries'} up to {dayLabel(run.role, toDayN)}
          </span>
        </span>
        <Icon name="arrow" className={`h-3.5 w-3 shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      {open && (
        <>
          {entries.length > 0 && (
            <ul className="mt-2">
              {entries.map((e) => (
                <LedgerLine key={e.id} e={e} role={run.role} />
              ))}
            </ul>
          )}
          {notes.map((u) => (
            <p key={u.id} className="mt-1.5 text-[13px] font-bold">
              ✓ {dayLabel(run.role, u.day)}: {u.label}
            </p>
          ))}
          {valueNow !== valueThen && (
            <p className="mt-1.5 text-[13px] font-bold">
              Classroom portfolio value {formatCents(valueThen)} → {formatCents(valueNow)} ({formatCents(valueNow - valueThen, true)}, not cash).
            </p>
          )}
          {arrearsTotal(run) > 0 && (
            <p className="mt-1.5 rounded-[8px] border-2 border-dashed border-ember-700 px-2 py-1 text-[13px] font-extrabold">
              Unpaid costs: {formatCents(arrearsTotal(run))}. The next income settles them first; no fee or interest is added.
            </p>
          )}
          <SupportActions run={run} step={step} />
        </>
      )}
    </section>
  )
}

export function SupportActions({ run, step }: { run: CampaignRun; step: Step }) {
  const rest = canRecover(run)
  const checkin = canCheckIn(run)
  if (!rest && !checkin) return null
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[10px] border-2 border-ink bg-[#e6f3fa] p-3 text-ink">
      {rest && (
        <div>
          <p className="text-[13px] font-bold">Stress is high ({stat(run, 'stress')}). A free recovery break is available once a week; no time passes and no money changes.</p>
          <button type="button" onClick={() => step({ op: 'recover' })} className="btn-3d btn-parch mt-2 min-h-10 rounded-[10px] px-3 text-[13px] font-extrabold">
            Take a recovery break (Stress −4)
          </button>
        </div>
      )}
      {checkin && (
        <div>
          <p className="text-[13px] font-bold">Feeling disconnected? The campus peer-support desk can connect you with a friend for a check-in (once a week).</p>
          <button type="button" onClick={() => step({ op: 'checkin' })} className="btn-3d btn-parch mt-2 min-h-10 rounded-[10px] px-3 text-[13px] font-extrabold">
            Check in with a friend (Happiness +2)
          </button>
        </div>
      )}
    </div>
  )
}

// ── Pauses: a short practical decision before the calendar moves on ───────

function PausePanel({ run, step }: { run: CampaignRun; step: Step }) {
  const pause = run.pause!
  const entries = run.ledger.slice(run.transitionStart)
  return (
    <>
      {entries.length > 0 && (
        <section className="surface-reading px-4 py-3">
          <h3 className="font-display text-[17px]">So far</h3>
          <ul className="mt-1">
            {entries.map((e) => (
              <LedgerLine key={e.id} e={e} role={run.role} />
            ))}
          </ul>
        </section>
      )}
      {pause.kind === 'deadline' ? <DeadlineCard run={run} step={step} /> : <ShortfallCard run={run} step={step} />}
    </>
  )
}

function ShortfallCard({ run, step }: { run: CampaignRun; step: Step }) {
  const pause = run.pause
  if (pause?.kind !== 'shortfall') return null
  const need = shortfallNeed(run)
  const src = shortfallSources(run, pause.account)
  const acct = ACCOUNT_NAMES[pause.account].toLowerCase()
  return (
    <section className="rounded-[12px] border-[3px] border-ink bg-parch-100 px-4 py-3 text-ink" aria-labelledby="short-h">
      <h3 id="short-h" className="font-display text-[19px] leading-tight">
        {pause.label}: {formatCents(pause.billCents)} due {dayLabel(run.role, pause.day)}
      </h3>
      <p className="mt-1 text-[14px] font-semibold">
        {ACCOUNT_NAMES[pause.account]} has {formatCents(bal(run, pause.account))}, so you are {formatCents(need)} short. Nothing moves without your say-so.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {bal(run, src.reserve) > 0 && (
          <button type="button" onClick={() => step({ op: 'shortfall', action: { kind: 'transfer' } })} className="btn-3d btn-parch min-h-11 rounded-[10px] px-3 text-left text-[14px] font-extrabold">
            Move {formatCents(Math.min(need, bal(run, src.reserve)))} from {ACCOUNT_NAMES[src.reserve].toLowerCase()} to {acct} (free)
          </button>
        )}
        {src.owner && (
          <button type="button" onClick={() => step({ op: 'shortfall', action: { kind: 'owner' } })} className="btn-3d btn-parch min-h-11 flex-col items-start rounded-[10px] px-3 py-2 text-left text-[14px] font-extrabold">
            Contribute {formatCents(Math.min(need, bal(run, 'checking')))} from personal checking to the studio
            <span className="text-[12px] font-bold text-ink-soft">An owner contribution: a transfer of your own money, not revenue.</span>
          </button>
        )}
        {src.sale &&
          (['broad', 'single'] as AssetId[]).map((asset) => {
            const q = unitsHeld(run.lots, asset) > 0 ? previewShortfallSale(run, asset) : null
            if (!q) return null
            return (
              <button
                key={asset}
                type="button"
                onClick={() => step({ op: 'shortfall', action: { kind: 'sell', asset } })}
                className="btn-3d btn-parch min-h-11 flex-col items-start rounded-[10px] px-3 py-2 text-left text-[14px] font-extrabold"
              >
                Sell {formatUnits(q.units)} units of the {ASSET_NAMES[asset]} at {formatCents(q.price)} for {formatCents(q.proceeds)}
                <span className="text-[12px] font-bold text-ink-soft">Realized result {formatCents(q.realized, true)} · classroom simulation</span>
              </button>
            )
          })}
        <button type="button" onClick={() => step({ op: 'shortfall', action: { kind: 'decline' } })} className="btn-3d min-h-11 rounded-[10px] px-3 text-left text-[14px] font-extrabold text-parch-100">
          Pay {formatCents(bal(run, pause.account))} now and record {formatCents(need)} as unpaid (no fee or interest)
        </button>
      </div>
    </section>
  )
}

function DeadlineCard({ run, step }: { run: CampaignRun; step: Step }) {
  const pause = run.pause
  const d = pause?.kind === 'deadline' ? run.deadlines.find((x) => x.id === pause.deadlineId) : undefined
  if (!d) return null
  const loan = d.kind === 'loan_review'
  return (
    <section className="rounded-[12px] border-[3px] border-ink bg-parch-100 px-4 py-3 text-ink">
      <p className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">{dayLabel(run.role, d.day)} · Reminder</p>
      <h3 className="font-display text-[19px] leading-tight">{d.label}</h3>
      <p className="mt-1 text-[14px] font-semibold">
        {loan
          ? 'The supported loan is due for review. Returning it switches you to the free support alternative; an extension is possible once. Neither costs anything.'
          : 'It is ready. Collecting it costs nothing, and the temporary loaner goes back.'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => step({ op: 'deadline' })} autoFocus className="btn-3d btn-gold min-h-11 rounded-[10px] px-4">
          <span className="txt-game-sm text-[15px]">{loan ? 'Return it and use the free alternative' : 'Collect it'}</span>
        </button>
        {loan && !d.extended && (
          <button type="button" onClick={() => step({ op: 'deadline', action: 'extend' })} className="btn-3d btn-parch min-h-11 rounded-[10px] px-4 text-[14px] font-extrabold">
            Agree a 30-day supported extension
          </button>
        )}
      </div>
    </section>
  )
}

// ── Learn: lesson and two questions ───────────────────────────────────────

function LearnPhase({ ev, cur, mastery, step }: { ev: EventDef; cur: CurrentEvent; mastery: Mastery; step: Step }) {
  const lesson = lessonForEvent(ev)
  const receipts = mastery[eventLessonKey(ev)]?.receipts ?? {}
  const active = lesson.quiz.findIndex((q) => !cur.quiz[q.id]?.acknowledged)
  return (
    <div className="flex flex-col gap-3" data-tour="choices">
      <LessonText lesson={lesson} label="New lesson · two questions, 5 FiCoins per correct first answer" />
      {lesson.quiz.map((q, i) =>
        i <= active ? (
          <Question
            key={q.id}
            q={q}
            n={i + 1}
            attempts={cur.quiz[q.id]?.attempts ?? []}
            acknowledged={Boolean(cur.quiz[q.id]?.acknowledged)}
            receipt={receipts[q.id]}
            onAnswer={(option) => step({ op: 'answer', questionId: q.id, option, now: Date.now() })}
            onAck={() => step({ op: 'acknowledge', questionId: q.id })}
          />
        ) : null,
      )}
    </div>
  )
}

function ReviewLesson({ ev }: { ev: EventDef }) {
  const lesson = lessonForEvent(ev)
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn-3d btn-parch min-h-10 gap-2 rounded-[10px] px-3 text-[13px] font-extrabold">
        <Icon name="book" className="h-5 w-5" />
        {open ? 'Hide the review' : `Review lesson: ${lesson.title}`}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <LessonText lesson={lesson} label="Review · you have learned this already · no FiCoins" />
          {lesson.quiz.map((q, i) => (
            <Question
              key={q.id}
              q={q}
              n={i + 1}
              practice
              attempts={answers[q.id] ?? []}
              acknowledged={false}
              onAnswer={(opt) => setAnswers((a) => ({ ...a, [q.id]: [...(a[q.id] ?? []), opt] }))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Decide: scenario, story memory, four choices ──────────────────────────

function projected(run: CampaignRun, deltas: Stats) {
  return (Object.keys(deltas) as StatKey[])
    .filter((k) => deltas[k])
    .map((k) => {
      const before = stat(run, k)
      const after = Math.min(100, Math.max(0, before + (deltas[k] ?? 0)))
      return { k, delta: after - before, authored: deltas[k] ?? 0, before, after }
    })
}

function DecidePhase({ run, ev, cur, names, step }: { run: CampaignRun; ev: EventDef; cur: CurrentEvent; names: RoleNames; step: Step }) {
  const extras = useMemo(() => sceneExtras(run, ev), [run, ev])
  const blockers = choiceBlockers(run)
  const [picked, setPicked] = useState<string | null>(null)
  const spec = ROLES[run.role]
  const shown = spec.accounts.filter((a) => a === spec.spendAccount || a === spec.primaryAccount || bal(run, a) > 0 || ev.choices.some((c) => c.money.some((m) => 'account' in m && m.account === a)))
  const nextBill = upcomingBills(run)[0]
  return (
    <>
      {cur.mode === 'review' && (
        <p className="rounded-[10px] border-2 border-ink bg-xp-300 px-3 py-2 text-[13px] font-extrabold text-ink">
          You have already learned “{lessonForEvent(ev).title}”. The lesson is here to review if you want it; reviews don't earn FiCoins.
        </p>
      )}
      <div className="surface-reading px-4 py-3.5">
        <p className="text-[16px] leading-relaxed font-semibold">{fillName(ev.scenario, names, run.role)}</p>
        {ev.caseTerms.length > 0 && (
          <div className="mt-2.5 rounded-[10px] border-2 border-parch-500 bg-parch-200 px-3 py-2">
            <p className="text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">The terms</p>
            {ev.caseTerms.map((t) => (
              <p key={t} className="text-[14px] leading-snug font-semibold">
                {fillName(t, names, run.role)}
              </p>
            ))}
          </div>
        )}
        {extras.lines.length > 0 && (
          <ul className="mt-2.5 flex flex-col gap-1.5 border-t-2 border-dashed border-parch-300 pt-2.5" aria-label="From your story">
            {extras.lines.map((l) => (
              <li key={l} className="flex gap-2 text-[14px] leading-snug font-bold text-ink-soft">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-brass-600" aria-hidden />
                {fillName(l, names, run.role)}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t-2 border-dashed border-parch-300 pt-2.5 text-[14px] font-extrabold">
          {shown.map((a) => (
            <span key={a} className="flex items-center gap-1.5">
              <Icon name={a === 'savings' || a.endsWith('reserve') ? 'piggy' : 'cash'} className="h-5 w-5" />
              {ACCOUNT_NAMES[a]} <span className="text-cash-700 tabular-nums">{formatCents(bal(run, a))}</span>
            </span>
          ))}
        </p>
        {nextBill && (
          <p className="mt-1 text-[13px] font-bold text-ink-soft">
            Next routine cost: {formatCents(nextBill.cents)} {nextBill.label.toLowerCase()} on {dayLabel(run.role, nextBill.day)}, from {ACCOUNT_NAMES[nextBill.account].toLowerCase()}.
          </p>
        )}
      </div>
      {cur.mode === 'review' && <ReviewLesson ev={ev} />}

      {blockers.includes('draft') && (
        <section className="rounded-[12px] border-[3px] border-ink bg-parch-100 px-4 py-3 text-ink">
          <p className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">Before you reflect</p>
          <h3 className="font-display text-[18px] leading-tight">Your instructor allows a revision of the rushed draft</h3>
          <p className="mt-1 text-[14px] font-semibold">The incomplete draft already cost Academic Standing −3. Revising is free with the writing center; keeping it is also fine.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => step({ op: 'draft', action: 'revise' })} className="btn-3d btn-parch min-h-11 flex-1 rounded-[10px] px-3 text-[13px] font-extrabold">
              Revise with free writing-center help (Academic Standing +2, Stress +1)
            </button>
            <button type="button" onClick={() => step({ op: 'draft', action: 'keep' })} className="btn-3d btn-parch min-h-11 flex-1 rounded-[10px] px-3 text-[13px] font-extrabold">
              Keep the submitted draft and plan ahead (Stress −1)
            </button>
          </div>
        </section>
      )}

      <h3 className="txt-game-sm text-center text-lg">What will you do?</h3>
      <ul className="grid gap-3 sm:grid-cols-2" data-tour="choices">
        {ev.choices.map((c, i) => (
          <ChoiceCard
            key={c.id}
            run={run}
            ev={ev}
            choice={c}
            first={i === 0}
            open={picked === c.id}
            blocked={blockers.length > 0}
            onOpen={() => setPicked(picked === c.id ? null : c.id)}
            onConfirm={() => step({ op: 'choose', choiceId: c.id })}
          />
        ))}
      </ul>
    </>
  )
}

function ChoiceCard({
  run,
  ev,
  choice,
  first,
  open,
  blocked,
  onOpen,
  onConfirm,
}: {
  run: CampaignRun
  ev: EventDef
  choice: ChoiceDef
  first: boolean
  open: boolean
  blocked: boolean
  onOpen: () => void
  onConfirm: () => void
}) {
  const preview = previewChoice(previewState(run), choice)
  const { deltas, notes } = choiceDeltas(run, ev, choice)
  const stats = projected(run, deltas)
  const failed = preview.ops.find((o) => !o.ok)
  // A missing holding or closed brokerage isn't a shortage of money, so it isn't labeled as one.
  const unaffordable = failed?.op.op === 'spend' || (failed?.op.op === 'buy_up_to' && !failed.reason?.includes('brokerage'))
  const spend = preview.ops.find((o) => o.op.op === 'spend' || o.op.op === 'buy_up_to')
  const chip = !preview.ok
    ? { text: unaffordable ? 'Not enough' : 'Unavailable', tone: 'bg-parch-300 text-ink' }
    : spend
      ? { text: `−${formatCents(spend.amount)}`, tone: 'bg-ink text-parch-100' }
      : preview.ops.length
        ? { text: 'Moves money', tone: 'bg-xp-500 text-white' }
        : { text: '$0', tone: 'bg-cash-500 text-ink' }
  const [why, setWhy] = useState(false)
  return (
    <li className={open ? 'sm:col-span-2' : ''}>
      <div className={`flex h-full flex-col rounded-[14px] ${open ? 'ring-[3px] ring-brass-400' : ''}`}>
        <button
          type="button"
          onClick={onOpen}
          autoFocus={first}
          aria-expanded={open}
          className={`btn-3d btn-parch h-full w-full flex-col items-stretch gap-1.5 px-3.5 py-3 text-left ${!preview.ok ? 'opacity-75' : ''}`}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="font-display text-[17px] leading-tight">{choice.label}</span>
            <span className={`shrink-0 rounded-full border-2 border-ink px-2 py-0.5 text-[12px] font-extrabold tabular-nums ${chip.tone}`}>{chip.text}</span>
          </span>
          {preview.ops.map((o, i) => (
            <span key={i} className="text-[13px] font-bold text-ink-soft">
              {o.text}
            </span>
          ))}
          {failed && <span className="text-[13px] font-extrabold text-ember-700">{failed.reason}</span>}
          {choiceConsequences(run, ev, choice).map((c) => (
            <span key={c} className="text-[13px] font-bold text-xp-700">
              {c}
            </span>
          ))}
          {preview.ops.some((o) => o.op.op === 'buy_up_to' || o.op.op === 'sell_up_to') && (
            <span className="text-[12px] font-bold text-ink-soft">Fictional classroom simulation: no real money, account or market.</span>
          )}
        </button>
        {open && (
          <div className="mt-2 rounded-[12px] border-2 border-ink bg-parch-100 px-3.5 py-3 text-ink">
            <p className="text-[14px] font-semibold">{choice.reason}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stats.length === 0 && <span className="text-[13px] font-bold text-ink-soft">No change to life stats.</span>}
              {stats.map((s) => (
                <StatChip key={s.k} stat={s.k} delta={s.delta} note={`${s.before} → ${s.after}${s.delta !== s.authored ? ', capped' : ''}`} />
              ))}
            </div>
            {notes.map((n) => (
              <p key={n} className="mt-2 text-[13px] font-extrabold">
                {n}
              </p>
            ))}
            <button type="button" onClick={() => setWhy((w) => !w)} aria-expanded={why} className="mt-2 text-[12px] font-extrabold text-xp-700 underline underline-offset-2">
              How certain is this?
            </button>
            {why && <p className="text-[12px] font-semibold text-ink-soft">In this story every number is exact: what you see here is what happens. Real life is less predictable.</p>}
            <button
              type="button"
              onClick={onConfirm}
              disabled={!preview.ok || blocked}
              className="btn-3d btn-gold mt-3 min-h-12 w-full rounded-[12px] px-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="txt-game-sm text-[16px]">
                {!preview.ok ? (unaffordable ? 'Not affordable right now' : 'Not available right now') : blocked ? 'Decide on the draft first' : 'Confirm this choice'}
              </span>
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

// ── Outcome ───────────────────────────────────────────────────────────────

function OutcomePhase({ run, ev, cur, step }: { run: CampaignRun; ev: EventDef; cur: CurrentEvent; step: Step }) {
  const outcome = cur.outcome!
  const choice = ev.choices.find((c) => c.id === outcome.choiceId)!
  const lines = run.ledger.filter((l) => outcome.ledgerIds.includes(l.id))
  const due = dueItems(run)
  const spec = ROLES[run.role]
  return (
    <>
      <div className="surface-reading flex flex-col gap-2 px-4 py-3">
        <p className="text-[14px] font-extrabold">You chose: {choice.label}</p>
        {lines.length > 0 ? (
          <ul>
            {lines.map((e) => (
              <LedgerLine key={e.id} e={e} role={run.role} />
            ))}
          </ul>
        ) : (
          <p className="text-[13px] font-bold text-ink-soft">No money changed hands today.</p>
        )}
        <StatChips changes={outcome.statChanges} />
        {outcome.notes.map((n) => (
          <p key={n} className="text-[13px] font-bold text-ink-soft">
            {n}
          </p>
        ))}
        <p className="flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-dashed border-parch-300 pt-2 text-[13px] font-extrabold tabular-nums">
          {spec.accounts
            .filter((a) => bal(run, a) > 0 || a === spec.primaryAccount)
            .map((a) => (
              <span key={a}>
                {ACCOUNT_NAMES[a]} {formatCents(bal(run, a))}
              </span>
            ))}
          <span>Net assets {formatCents(netWorth(run))}</span>
        </p>
      </div>
      <div data-tour="tradeoff" className="rounded-[12px] border-[3px] border-ink bg-pine-800 px-4 py-3 shadow-[inset_0_2px_0_rgb(255_255_255/0.12)]">
        <h3 className="txt-game-sm flex items-center gap-2 text-lg">
          <Icon name="xp" className="h-5 w-5" />
          Why it turned out this way
        </h3>
        <p className="mt-1.5 text-[15px] leading-relaxed font-semibold text-parch-100">{choice.reason}</p>
        {Object.keys(outcome.statChanges).length > 0 && (
          <p className="mt-1 text-[13px] font-bold text-sage-300">
            {(Object.keys(outcome.statChanges) as StatKey[])
              .map((k) => `${statNames[k]} ${outcome.statChanges[k]! > 0 ? '+' : '−'}${Math.abs(outcome.statChanges[k]!)}`)
              .join(' · ')}
            : the full effect of this choice, with nothing hidden.
          </p>
        )}
      </div>
      {due.length > 0 && (
        <section className="rounded-[12px] border-[3px] border-ink bg-parch-100 px-4 py-3 text-ink" aria-labelledby="returns-h">
          <h3 id="returns-h" className="font-display text-[18px] leading-tight">
            End-of-term checklist
          </h3>
          <p className="text-[13px] font-semibold">Resolve these before the story moves on. Every option is free.</p>
          <ul className="mt-2 flex flex-col gap-2">
            {due.map((it) => (
              <li key={it.id} className="flex flex-col gap-2 rounded-[10px] border-2 border-parch-300 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[14px] font-extrabold">{it.label}</span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => step({ op: 'item', itemId: it.id, action: 'return' })} className="btn-3d btn-parch min-h-10 rounded-[10px] px-3 text-[13px] font-extrabold">
                    {it.kind === 'lent' ? 'Get it back' : 'Return it'}
                  </button>
                  {it.renewable && it.dueChapter < 3 && (
                    <button type="button" onClick={() => step({ op: 'item', itemId: it.id, action: 'renew' })} className="btn-3d btn-parch min-h-10 rounded-[10px] px-3 text-[13px] font-extrabold">
                      Renew free for next term
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
