import { useEffect, useMemo, useRef, useState } from 'react'
import { dayLabel } from '../campaign/calendar'
import { CHAPTER_POSITIONS, eventLessonKey, getEvent, lessonByKey } from '../campaign/content'
import { eventDay } from '../campaign/engine'
import { fillName } from '../campaign/names'
import { ROLES } from '../campaign/roles'
import { chapterOf, chapterStart } from '../campaign/run'
import { LedgerLine, StatChips } from '../components/campaign/parts'
import { Notebook } from '../components/campaign/Notebook'
import { CharacterSelect } from '../components/lobby/CharacterSelect'
import { CharacterSprite } from '../components/sprite/CharacterSprite'
import { Icon } from '../components/ui/Icon'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ROAD_ASPECT, roadMaps, stopsAlong } from '../data/roadMaps'
import { useActiveLife, useCampaign, useGameDispatch, useRoleNames } from '../state/GameProvider'

type NodeState = 'done' | 'current' | 'locked'

const firstSentence = (t: string) => t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t

/**
 * A life's year as a walk along their neighborhood's own path, one chapter at a time. Only the 15/15/10 events
 * chosen for this run appear, numbered from 1 in each chapter. Earlier chapters
 * stay readable; replaying their history grants nothing.
 */
export function CampaignRoadScreen() {
  const life = useActiveLife()
  const { run, mastery } = useCampaign()
  const names = useRoleNames()
  const chapters = ROLES[run.role].chapters.map((title, i) => ({ number: i + 1, title, positions: CHAPTER_POSITIONS[i] }))
  const dispatch = useGameDispatch()
  const map = roadMaps[life.id]
  const liveChapter = run.finished ? 3 : chapterOf(run.index)
  const [viewChapter, setViewChapter] = useState(liveChapter)
  const ch = chapters[viewChapter - 1]
  const start = chapterStart(viewChapter)
  const total = ch.positions
  const currentN = run.finished || viewChapter !== liveChapter ? 0 : run.index - start + 1
  const [selected, setSelected] = useState(currentN || total)
  const currentRef = useRef<HTMLButtonElement>(null)
  // Set when "Jump to current" has to switch chapters first; the scroll then waits for that chapter's map.
  const jumpPending = useRef(false)

  useEffect(() => setViewChapter(liveChapter), [liveChapter])
  useEffect(() => {
    setSelected(currentN || 1)
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    if (jumpPending.current) currentRef.current?.focus({ preventScroll: true })
    jumpPending.current = false
  }, [viewChapter, currentN, life.id])

  const jumpToCurrent = () => {
    if (viewChapter !== liveChapter) {
      jumpPending.current = true
      setViewChapter(liveChapter)
      return
    }
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    currentRef.current?.focus({ preventScroll: true })
    setSelected(currentN)
  }

  // Exactly this chapter's events, spaced evenly along the map's own path: event 1 at the bottom, the finale at the top.
  const nodes = useMemo(
    () =>
      stopsAlong(map.route, total).map(({ x, y }, i) => {
        const n = i + 1
        const index = start + i
        const state: NodeState = index < run.index ? 'done' : index === run.index && !run.finished ? 'current' : 'locked'
        return { n, index, state, x, y }
      }),
    [map, total, start, run.index, run.finished],
  )
  const doneCount = nodes.filter((p) => p.state === 'done').length

  const sel = nodes[selected - 1]
  const record = sel ? run.history.find((h) => h.index === sel.index) : undefined
  const currentEv = sel?.state === 'current' ? getEvent(run.positions[sel.index].eventId) : null
  const play = () => {
    dispatch({ type: 'setTab', tab: 'home' })
    dispatch({ type: 'openEvent' })
  }

  return (
    <div className="mx-auto w-full max-w-[1140px] px-4 pt-5 pb-10 lg:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 lg:self-start lg:tall:sticky lg:tall:top-5">
          <div className="surface-reading life-stripe flex items-end gap-3 overflow-hidden px-3 pt-4">
            <CharacterSprite appearance={life.appearance} className="h-24" />
            <div className="min-w-0 pb-3">
              <h1 className="font-display text-[24px] leading-tight text-ink">{life.name.split(' ')[0]}&rsquo;s Road</h1>
              <p className="text-[13px] font-bold text-ink-soft">
                Chapter {viewChapter}: {ch.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <ProgressBar value={doneCount} max={total} fill="bg-brass-500" className="h-2.5 flex-1" label="Chapter progress" />
                <span className="text-[12px] font-extrabold text-ink-soft tabular-nums">
                  {doneCount}/{total}
                </span>
              </div>
            </div>
          </div>

          <nav aria-label="Chapters" className="grid grid-cols-3 gap-2">
            {chapters.map((c) => {
              const locked = c.number > liveChapter
              const on = c.number === viewChapter
              return (
                <button
                  key={c.number}
                  type="button"
                  disabled={locked}
                  onClick={() => setViewChapter(c.number)}
                  aria-pressed={on}
                  className={`btn-3d min-h-12 flex-col rounded-[10px] px-1 py-1 text-[12px] leading-tight font-extrabold ${on ? 'btn-gold' : 'btn-parch'} disabled:opacity-50`}
                >
                  <span>Ch. {c.number}</span>
                  <span className="font-semibold">{locked ? 'Locked' : c.number < liveChapter || run.finished ? 'Read only' : 'Now'}</span>
                </button>
              )
            })}
          </nav>

          {sel && (
            <section className="surface-hud p-4" aria-live="polite">
              <p className="text-[12px] font-extrabold tracking-wide text-sage-300 uppercase">
                Chapter {viewChapter} · Event {sel.n} of {total}
                {sel.n === total ? ' · Chapter finale' : ''}
              </p>
              {sel.state === 'done' && record && (
                <>
                  <h2 className="txt-game-sm mt-1 text-xl leading-tight">{record.title}</h2>
                  <p className="text-[12px] font-bold text-sage-300">{dayLabel(run.role, record.day, true)}</p>
                  <p className="mt-1 text-[14px] font-semibold text-parch-200">You chose: {record.choiceLabel}</p>
                  <p className="mt-1 text-[13px] font-semibold text-sage-300">{record.rationale}</p>
                  <div className="mt-2 rounded-[10px] bg-parch-100 p-2 text-ink">
                    <StatChips changes={record.statChanges} />
                    <ul className="mt-1">
                      {run.ledger
                        .filter((l) => record.ledgerIds.includes(l.id))
                        .map((l) => (
                          <LedgerLine key={l.id} e={l} role={run.role} />
                        ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'openLesson', lessonKey: record.lessonKey })}
                    className="btn-3d btn-parch mt-3 min-h-11 w-full gap-2 rounded-[10px] px-3 text-left text-[13px] font-extrabold"
                  >
                    <Icon name="book" className="h-5 w-5" />
                    Review: {lessonByKey(record.lessonKey)?.title}
                  </button>
                  <p className="mt-1.5 text-[11px] font-bold text-sage-300">History is read-only: reviewing it earns nothing and changes nothing.</p>
                </>
              )}
              {sel.state === 'current' && currentEv && (
                <>
                  <h2 className="txt-game-sm mt-1 text-xl leading-tight">{currentEv.title}</h2>
                  <p className="text-[12px] font-bold text-sage-300">{dayLabel(run.role, eventDay(currentEv), true)}</p>
                  <p className="mt-1 text-[14px] leading-snug font-semibold text-parch-200">{firstSentence(fillName(currentEv.scenario, names, run.role))}</p>
                  <p className="mt-1 text-[12px] font-bold text-sage-300">
                    {mastery[eventLessonKey(currentEv)]?.completed ? 'Review topic: straight to the decision.' : 'New lesson: two questions first.'}
                  </p>
                  <button type="button" onClick={play} className="btn-3d btn-gold btn-shine mt-3 min-h-12 w-full gap-2 rounded-[12px]">
                    <span className="txt-game text-lg leading-none">{run.current || run.pause ? 'RESUME' : run.index === 0 ? 'START' : 'PLAY'}</span>
                    <Icon name="arrow" className="h-5 w-4" />
                  </button>
                </>
              )}
              {sel.state === 'locked' && (
                <>
                  <h2 className="txt-game-sm mt-1 text-xl leading-tight">{sel.n === total ? `Finish Chapter ${viewChapter}` : 'Locked'}</h2>
                  <p className="mt-1 text-[14px] font-semibold text-parch-200">
                    {sel.n === total
                      ? viewChapter === 3
                        ? 'Reach the finale to complete the year.'
                        : `Reach the finale to unlock Chapter ${viewChapter + 1}.`
                      : `Play event ${sel.n - 1} to reach this stop.`}
                  </p>
                </>
              )}
            </section>
          )}

          <section className="surface-rail pt-3 pr-3 pb-3 pl-6" aria-label="Your lives">
            <h2 className="txt-game-sm px-1 text-center text-[14px]">Your Lives</h2>
            <CharacterSelect layout="grid" />
          </section>
        </aside>

        <div className="min-w-0">
          {/* Map toolbar: stays in reach while the long map scrolls under it. */}
          <div className="surface-hud sticky top-0 z-30 mx-auto mb-3 flex max-w-[36rem] items-center gap-3 px-3 py-2">
            <p className="min-w-0 flex-1 text-[13px] leading-tight font-extrabold text-parch-200">
              Chapter {viewChapter} · {doneCount}/{total} played
            </p>
            {!run.finished && (
              <button type="button" onClick={jumpToCurrent} className="btn-3d btn-gold min-h-10 shrink-0 gap-1.5 rounded-[10px] px-3 [--lip:3px]">
                <Icon name="road" className="h-5 w-5" />
                <span className="text-[13px] font-extrabold text-ink">Jump to current</span>
              </button>
            )}
          </div>

          {/* The artwork and its stops share one box, so they scale together; the box keeps the image's own ratio. */}
          <div
            className="@container relative mx-auto w-full max-w-[36rem] overflow-hidden rounded-[22px] border-[3px] border-ink bg-ink shadow-[0_10px_22px_-6px_rgb(0_0_0/0.55)]"
            style={{ aspectRatio: `${ROAD_ASPECT.w} / ${ROAD_ASPECT.h}` }}
          >
            <img
              src={map.art}
              alt={map.alt}
              width={ROAD_ASPECT.w}
              height={ROAD_ASPECT.h}
              draggable={false}
              className="pixelated absolute inset-0 h-full w-full select-none"
            />
            <ol aria-label={`Chapter ${viewChapter} events`}>
              {[...nodes].reverse().map((p) => {
                const on = p.n === selected
                const isFinale = p.n === total
                const rec = p.state === 'done' ? run.history.find((h) => h.index === p.index) : undefined
                const curTitle = p.state === 'current' ? getEvent(run.positions[p.index].eventId).title : undefined
                const big = p.state === 'current' || isFinale
                // Sized from the map's width (cqw) so stops never crowd each other on a narrow map.
                const size = big ? 'clamp(2.25rem, 10cqw, 4rem)' : p.state === 'done' ? 'clamp(2rem, 8cqw, 3rem)' : 'clamp(1.75rem, 6.5cqw, 2.5rem)'
                const face =
                  p.state === 'done'
                    ? 'bg-gradient-to-b from-cash-500 to-cash-700'
                    : big
                      ? 'bg-gradient-to-b from-brass-400 to-brass-600'
                      : 'bg-gradient-to-b from-[#6b7f73] to-[#4a5c52]'
                const label = rec ? rec.title : (curTitle ?? (isFinale ? `Chapter ${viewChapter} finale` : undefined))
                // Labels sit on the roomier side of the path and never reach past the map's edge.
                const labelRight = p.x < 0.5
                const room = `calc(${((labelRight ? 1 - p.x : p.x) * 100).toFixed(2)}cqw - ${size} / 2 - 0.75rem)`
                return (
                  <li key={p.n} className="absolute" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
                    {label && (
                      <p
                        title={label}
                        className={`pointer-events-none absolute top-0 z-10 w-max -translate-y-1/2 rounded-[8px] border-2 border-ink px-2 py-1 text-[12px] leading-tight font-extrabold shadow-[0_3px_0_rgb(0_0_0/0.3)] ${
                          p.state === 'current' ? 'bg-brass-400 text-ink' : 'bg-parch-100 text-ink'
                        } ${p.state === 'done' ? 'hidden @[30rem]:block' : ''}`}
                        style={{ [labelRight ? 'left' : 'right']: `calc(${size} / 2 + 0.375rem)`, maxWidth: `min(14rem, ${room})` }}
                      >
                        <span className="line-clamp-2 break-words">{label}</span>
                      </p>
                    )}
                    <button
                      ref={p.state === 'current' ? currentRef : undefined}
                      type="button"
                      onClick={() => setSelected(p.n)}
                      aria-pressed={on}
                      aria-label={`Event ${p.n}${rec ? `: ${rec.title}, played` : curTitle ? `: ${curTitle}, up next` : isFinale ? ', chapter finale, locked' : ', locked'}`}
                      className={`absolute top-0 left-0 z-20 grid -translate-x-1/2 -translate-y-1/2 scroll-mt-20 scroll-mb-4 place-items-center rounded-full border-[3px] border-ink ${face} shadow-[inset_0_3px_0_rgb(255_255_255/0.35),0_5px_0_rgb(0_0_0/0.35)] ${
                        on ? 'ring-4 ring-parch-100/90' : ''
                      } ${p.state === 'current' ? 'motion-safe:animate-[glow_2.4s_ease-in-out_infinite]' : ''}`}
                      style={{ width: size, height: size }}
                    >
                      {isFinale && p.state !== 'done' ? (
                        <Icon name="trophy" className="h-[62%] w-[62%]" />
                      ) : p.state === 'locked' ? (
                        <Icon name="lock" className="h-[58%] w-[58%] opacity-80" />
                      ) : (
                        <span className="txt-game-sm leading-none" style={{ fontSize: `calc(${size} * 0.42)` }}>
                          {p.n}
                        </span>
                      )}
                      {p.state === 'done' && <Icon name="check" className="absolute -top-1.5 -right-1.5 h-[45%] w-[45%]" />}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="notebook-h">
        <h2 id="notebook-h" className="txt-game mb-3 flex items-center gap-2 text-2xl">
          <Icon name="book" className="h-7 w-7" />
          {life.name.split(' ')[0]}&rsquo;s Notebook
        </h2>
        <Notebook run={run} mastery={mastery} />
      </section>
    </div>
  )
}
