import { useEffect, useRef } from 'react'
import { formatCents } from '../../campaign/money'
import { fillName } from '../../campaign/names'
import { ACCOUNT_NAMES, ROLES, STAT_LABELS, statKeys } from '../../campaign/roles'
import { arrearsTotal, bal, investmentValue, netWorth, receivablesTotal, stat, type CampaignRun, type Stats } from '../../campaign/run'
import { chapterSummary, endingParagraphs, happinessBand, playstyles, stressBand, thirdBand } from '../../campaign/summary'
import { useGame, useGameDispatch, useRoleNames } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'

/** Which summary is waiting: a finished chapter the player hasn't closed yet, or the ending. */
export function pendingSummary(run: CampaignRun): number | null {
  if (run.finished && !run.summariesSeen.includes(3)) return 3
  if (run.index === 30 && !run.current && !run.summariesSeen.includes(2)) return 2
  if (run.index === 15 && !run.current && !run.summariesSeen.includes(1)) return 1
  return null
}

/** Shown between chapters and at the end of the year, from the run's real records. */
export function CampaignSummary() {
  const { runs, activeLifeId, eventOpen, creator, tutorial, lives } = useGame()
  const names = useRoleNames()
  const run = runs[activeLifeId]
  const dispatch = useGameDispatch()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const chapter = pendingSummary(run)
  const show = chapter !== null && !eventOpen && !creator && tutorial.step === null

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (show && !d.open) d.showModal()
    else if (!show && d.open) d.close()
  }, [show])

  const close = () => chapter && dispatch({ type: 'campaign', step: { op: 'summarySeen', chapter } })
  const name = lives[activeLifeId].name

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="summary-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      className="m-auto max-h-[100dvh] w-[min(44rem,calc(100vw-1.5rem))] overflow-visible bg-transparent px-0 pt-7 pb-3 text-parch-100 backdrop:backdrop-blur-[2px]"
    >
      {show && chapter && (
        <div className="panel-wood anim-rise flex max-h-[calc(100dvh-2.5rem)] flex-col">
          <div className="relative z-10 mx-auto -mt-5 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-[12px] border-[3px] border-ink bg-gradient-to-b from-brass-400 to-brass-600 px-5 py-2 shadow-[inset_0_3px_0_rgb(255_255_255/0.55),0_6px_12px_-4px_rgb(0_0_0/0.6)]">
            <Icon name="trophy" className="h-8 w-8 shrink-0" />
            <h2 id="summary-title" className="txt-game truncate text-xl leading-none sm:text-2xl">
              {chapter === 3 ? `${name}'s year` : `Chapter ${chapter} complete`}
            </h2>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pt-4 pb-5 sm:px-6">
            {chapter === 3 ? <Ending run={run} fill={(t) => fillName(t, names, run.role)} /> : <ChapterRecap run={run} chapter={chapter} />}
            <button type="button" onClick={close} autoFocus className="btn-3d btn-gold min-h-14 self-center rounded-[14px] px-8">
              <span className="txt-game text-2xl leading-none">{chapter === 3 ? 'DONE' : `ON TO CHAPTER ${chapter + 1}`}</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}

function StatTable({ run, start, end }: { run: CampaignRun; start: Stats; end: Stats }) {
  return (
    <table className="w-full text-left text-[14px] font-bold">
      <caption className="sr-only">Life stats at the start and end</caption>
      <thead>
        <tr className="text-[12px] text-ink-soft uppercase">
          <th className="py-1 font-extrabold">Stat</th>
          <th className="py-1 font-extrabold">Start</th>
          <th className="py-1 font-extrabold">Now</th>
        </tr>
      </thead>
      <tbody>
        {statKeys(run.role).map((k) => {
          const a = start[k] ?? 0
          const b = end[k] ?? 0
          return (
            <tr key={k} className="border-t border-parch-300">
              <td className="py-1">{STAT_LABELS[k]}</td>
              <td className="py-1 tabular-nums">{a}</td>
              <td className="py-1 tabular-nums">
                {b} ({b - a >= 0 ? '+' : '−'}
                {Math.abs(b - a)})
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ChapterRecap({ run, chapter }: { run: CampaignRun; chapter: number }) {
  const s = chapterSummary(run, chapter)
  const spec = ROLES[run.role]
  return (
    <>
      <div className="surface-reading px-4 py-3">
        <p className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">Chapter {chapter}</p>
        <h3 className="font-display text-[22px] leading-tight">{s.title}</h3>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[14px] font-bold sm:grid-cols-4">
          {(
            [
              ['Income', s.earned],
              ['Routine costs', s.costs],
              ['Choices bought', s.purchases],
              ['Set aside', s.setAside],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] text-ink-soft">{k}</dt>
              <dd className="font-display text-[18px] tabular-nums">{formatCents(v)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[14px] font-bold">
          Now: {spec.accounts.map((a) => `${ACCOUNT_NAMES[a].toLowerCase()} ${formatCents(bal(run, a))}`).join(', ')}
          {arrearsTotal(run) > 0 ? `; unpaid costs ${formatCents(arrearsTotal(run))}` : ''}
          {receivablesTotal(run) > 0 ? `; ${formatCents(receivablesTotal(run))} earned and on its way` : ''}.
        </p>
        <p className="mt-1 text-[12px] font-semibold text-ink-soft">Set aside means money moved into savings or reserves: a transfer, not spending.</p>
      </div>
      <div className="surface-reading px-4 py-3">
        <StatTable run={run} start={s.statsStart} end={s.statsEnd} />
      </div>
      <div className="surface-reading px-4 py-3">
        <h4 className="font-display text-[17px]">Your {s.lines.length} decisions</h4>
        <ol className="mt-1 flex list-decimal flex-col gap-0.5 pl-5 text-[13px] font-semibold">
          {s.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </div>
      <p className="text-center text-[13px] font-bold text-sage-300">
        Chapter {chapter + 1}, {spec.chapters[chapter]}, starts again at event 1. Your money, stats and story carry over.
      </p>
    </>
  )
}

function Ending({ run, fill }: { run: CampaignRun; fill: (t: string) => string }) {
  const paras = endingParagraphs(run)
  const ps = playstyles(run)
  const spec = ROLES[run.role]
  const third = spec.thirdStat
  const rows: [string, number][] = [
    ...spec.accounts.map((a) => [ACCOUNT_NAMES[a], bal(run, a)] as [string, number]),
    ['Classroom investments', investmentValue(run)],
    ...(receivablesTotal(run) > 0 ? [['Earned, on its way', receivablesTotal(run)] as [string, number]] : []),
    ['Debt', -run.debt],
    ['Unpaid costs', -arrearsTotal(run)],
    ['Tracked net assets', netWorth(run)],
  ]
  return (
    <>
      <div className="surface-reading flex flex-col gap-2.5 px-4 py-3">
        {paras.map((p) => (
          <p key={p} className="text-[15px] leading-relaxed font-semibold">
            {fill(p)}
          </p>
        ))}
      </div>
      <div className="surface-reading grid gap-3 px-4 py-3 sm:grid-cols-2">
        <dl className="text-[14px] font-bold">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between border-t border-parch-300 py-1 first:border-t-0">
              <dt>{k}</dt>
              <dd className="tabular-nums">{formatCents(v)}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-col gap-1 text-[14px] font-bold">
          <li>
            {STAT_LABELS[third]} {stat(run, third)}: {thirdBand(stat(run, third))}
          </li>
          <li>
            Stress {stat(run, 'stress')}: {stressBand(stat(run, 'stress'))}
          </li>
          <li>
            Happiness {stat(run, 'happiness')}: {happinessBand(stat(run, 'happiness'))}
          </li>
          <li className="text-[12px] font-semibold text-ink-soft">Story labels for a fictional year, not grades or diagnoses.</li>
        </ul>
      </div>
      <section className="surface-reading px-4 py-3" aria-labelledby="style-h">
        <h3 id="style-h" className="font-display text-[18px]">
          How you tended to choose
        </h3>
        {!ps.shares ? (
          <p className="text-[14px] font-semibold">Not enough information.</p>
        ) : (
          <>
            <p className="text-[14px] font-semibold">
              Mostly {ps.primary.join(' and ')}
              {ps.primary.length > 1 ? ' (a tie)' : ''}
              {ps.secondary.length ? `, then ${ps.secondary.join(' and ')}` : ''}. These are descriptions, not scores.
            </p>
            <p className="mt-1 text-[12px] font-bold text-ink-soft">Share of tagged choices</p>
            <ul className="mt-1 flex flex-col gap-1.5">
              {ps.shares.map((x) => (
                <li key={x.tag} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-2 text-[13px] font-bold">
                  <span>{x.tag}</span>
                  <span className="bar-track h-3">
                    <span className="bar-fill block h-full bg-brass-500" style={{ width: `${x.share}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{x.share}%</span>
                </li>
              ))}
            </ul>
            {ps.primary.map((t) =>
              ps.examples[t]?.length ? (
                <p key={t} className="mt-2 text-[13px] font-semibold text-ink-soft">
                  {t}, for example: {ps.examples[t]!.map((e) => `“${e.replace(/\.$/, '')}”`).join(', ')}.
                </p>
              ) : null,
            )}
          </>
        )}
      </section>
    </>
  )
}
