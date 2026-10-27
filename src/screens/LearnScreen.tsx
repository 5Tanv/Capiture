import { useEffect, useMemo, useState } from 'react'
import { categories, getEvent, lessonByKey, lessonKey, lessons, lessonsById, sources } from '../campaign/content'
import { totalCoins, type Mastery } from '../campaign/mastery'
import { ROLES, ROLE_ORDER, lifeOfRole } from '../campaign/roles'
import type { Lesson, RoleId } from '../campaign/types'
import { DailyChallenge } from '../components/compete/DailyChallenge'
import { LessonText, Question } from '../components/campaign/LessonView'
import { Portrait } from '../components/lobby/Portrait'
import { Icon } from '../components/ui/Icon'
import { ProgressBar } from '../components/ui/ProgressBar'
import type { IconName } from '../components/world/sprites'
import { useGame, useGameDispatch } from '../state/GameProvider'

// The Learn library: every published lesson, browsable from the start, shelved
// by category. Completing a lesson here or in a story is the same completion:
// both use the player's one set of lesson receipts.

const CATEGORY_ICONS: Record<string, IconName> = {
  money: 'chart',
  banking: 'bank',
  saving: 'piggy',
  spending: 'bag',
  income: 'income',
  credit: 'card',
  borrowing: 'bill',
  tax: 'bill',
  security: 'shield',
  protection: 'shield',
  housing: 'home',
  investing: 'sprout',
  markets: 'chart',
  retirement: 'hourglass',
  business: 'briefcase',
  contracts: 'book',
  decisions: 'target',
  economy: 'coin',
  planning: 'road',
}

type View = { kind: 'home' } | { kind: 'category'; id: string } | { kind: 'lesson'; id: string }
type Completion = 'all' | 'new' | 'started' | 'done'

const stateOf = (m: Mastery, l: Lesson): 'new' | 'started' | 'done' => {
  const rec = m[lessonKey(l)]
  if (rec?.completed) return 'done'
  return rec && (Object.keys(rec.receipts).length > 0 || rec.acknowledged.length > 0) ? 'started' : 'new'
}
const STATE_LABEL = { new: 'New', started: 'In progress', done: 'Completed ✓' }
const rolesOf = (l: Lesson) => ROLE_ORDER.filter((r) => l.eventRefs.some((e) => e.character === r))

export function LearnScreen() {
  const { mastery, coinBase, learnFocus } = useGame()
  const focused = learnFocus ? lessonByKey(learnFocus) : undefined
  const [view, setView] = useState<View>(focused ? { kind: 'lesson', id: focused.id } : { kind: 'home' })
  const [query, setQuery] = useState('')
  const [completion, setCompletion] = useState<Completion>('all')
  const [role, setRole] = useState<RoleId | 'all'>('all')
  useEffect(() => {
    if (focused) setView({ kind: 'lesson', id: focused.id })
  }, [focused])

  const done = lessons.filter((l) => stateOf(mastery, l) === 'done').length
  const lessonCoins = totalCoins({ coinBase: 0, mastery })
  const filtering = query.trim() !== '' || completion !== 'all' || role !== 'all'
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lessons.filter((l) => {
      if (completion !== 'all' && stateOf(mastery, l) !== completion) return false
      if (role !== 'all' && !rolesOf(l).includes(role)) return false
      if (!q) return true
      const cat = categories.find((c) => c.id === l.categoryId)?.title ?? ''
      return [l.title, l.objective, cat, ...l.sentences].join(' ').toLowerCase().includes(q)
    })
  }, [query, completion, role, mastery])

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pt-5 pb-10 lg:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] border-[3px] border-ink bg-xp-500 shadow-[inset_0_3px_0_rgb(255_255_255/0.35)]">
            <Icon name="book" className="h-9 w-9" />
          </span>
          <div>
            <h1 className="txt-game text-3xl leading-none sm:text-4xl">The Library</h1>
            <p className="mt-1.5 max-w-[38rem] text-[14px] font-semibold text-sage-300">
              Every lesson is open from the start. Finish one here or in any life and it counts everywhere; each question's first answer can earn 5 FiCoins once.
            </p>
          </div>
        </div>
        <div className="surface-hud flex items-center gap-4 px-4 py-2.5">
          <div className="min-w-[10rem]">
            <p className="flex items-center justify-between text-[12px] font-extrabold text-sage-300">
              <span>Lessons completed</span>
              <span className="text-parch-100 tabular-nums">
                {done}/{lessons.length}
              </span>
            </p>
            <ProgressBar value={done} max={lessons.length} fill="bg-xp-500" className="mt-1 h-3" label="Lessons completed" />
          </div>
          <div className="border-l-2 border-white/10 pl-4 text-center">
            <p className="font-display flex items-center justify-center gap-1 text-2xl leading-none tabular-nums">
              {lessonCoins}
              <Icon name="coin" className="h-5 w-5" label="FiCoins" />
            </p>
            <p className="text-[11px] font-extrabold text-sage-300 uppercase">From lessons</p>
          </div>
        </div>
      </header>

      {view.kind === 'home' && <DailyChallenge />}

      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]" role="search">
        <label className="sr-only" htmlFor="learn-search">
          Search lessons
        </label>
        <input
          id="learn-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (view.kind === 'lesson') setView({ kind: 'home' })
          }}
          placeholder="Search titles, goals and lesson text"
          className="min-h-11 rounded-[10px] border-[3px] border-ink bg-parch-100 px-3 text-[15px] font-semibold text-ink placeholder:text-ink-soft/70"
        />
        <label className="sr-only" htmlFor="learn-completion">
          Completion
        </label>
        <select
          id="learn-completion"
          value={completion}
          onChange={(e) => {
            setCompletion(e.target.value as Completion)
            if (view.kind === 'lesson') setView({ kind: 'home' })
          }}
          className="min-h-11 rounded-[10px] border-[3px] border-ink bg-parch-100 px-2 text-[14px] font-bold text-ink"
        >
          <option value="all">Any progress</option>
          <option value="new">New</option>
          <option value="started">In progress</option>
          <option value="done">Completed</option>
        </select>
        <label className="sr-only" htmlFor="learn-life">
          Used in life
        </label>
        <select
          id="learn-life"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as RoleId | 'all')
            if (view.kind === 'lesson') setView({ kind: 'home' })
          }}
          className="min-h-11 rounded-[10px] border-[3px] border-ink bg-parch-100 px-2 text-[14px] font-bold text-ink"
        >
          <option value="all">Any life</option>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLES[r].title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {view.kind === 'lesson' && lessonsById[view.id] ? (
          <LessonPage lesson={lessonsById[view.id]} mastery={mastery} onBack={() => setView({ kind: 'category', id: lessonsById[view.id].categoryId })} onOpen={(id) => setView({ kind: 'lesson', id })} />
        ) : filtering ? (
          <section aria-labelledby="results-h">
            <h2 id="results-h" className="txt-game-sm mb-3 text-xl">
              {results.length} {results.length === 1 ? 'lesson' : 'lessons'} found
            </h2>
            <LessonList items={results} mastery={mastery} onOpen={(id) => setView({ kind: 'lesson', id })} />
          </section>
        ) : view.kind === 'category' ? (
          <CategoryPage id={view.id} mastery={mastery} onBack={() => setView({ kind: 'home' })} onOpen={(id) => setView({ kind: 'lesson', id })} />
        ) : (
          <section aria-labelledby="cats-h">
            <h2 id="cats-h" className="txt-game-sm mb-3 text-xl">
              {categories.length} subjects
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((c) => {
                const list = c.lessonIds.map((id) => lessonsById[id])
                const n = list.filter((l) => stateOf(mastery, l) === 'done').length
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setView({ kind: 'category', id: c.id })}
                      className="btn-3d btn-parch h-full w-full flex-col items-stretch gap-2 px-3.5 py-3 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name={CATEGORY_ICONS[c.id] ?? 'book'} className="h-8 w-8 shrink-0" />
                        <span className="font-display text-[17px] leading-tight">{c.title}</span>
                      </span>
                      <span className="text-[12px] font-bold text-ink-soft">
                        {list.length} {list.length === 1 ? 'lesson' : 'lessons'} · {n} completed
                      </span>
                      <ProgressBar value={n} max={list.length} fill="bg-cash-500" className="h-2.5" label={`${c.title}: ${n} of ${list.length} completed`} />
                    </button>
                  </li>
                )
              })}
            </ul>
            {coinBase > 0 && <p className="mt-4 text-[12px] font-semibold text-sage-300">FiCoins you had before lesson receipts are kept as they were.</p>}
          </section>
        )}
      </div>
    </div>
  )
}

function CategoryPage({ id, mastery, onBack, onOpen }: { id: string; mastery: Mastery; onBack: () => void; onOpen: (id: string) => void }) {
  const cat = categories.find((c) => c.id === id)!
  const list = cat.lessonIds.map((l) => lessonsById[l])
  return (
    <section aria-labelledby="cat-h">
      <button type="button" onClick={onBack} className="mb-2 flex min-h-9 items-center gap-1.5 text-[14px] font-extrabold text-brass-300 hover:text-brass-400">
        <Icon name="arrow" className="h-3.5 w-3 rotate-180" />
        All subjects
      </button>
      <h2 id="cat-h" className="txt-game flex items-center gap-2 text-2xl">
        <Icon name={CATEGORY_ICONS[cat.id] ?? 'book'} className="h-8 w-8" />
        {cat.title}
      </h2>
      <p className="mb-3 text-[13px] font-semibold text-sage-300">
        {list.filter((l) => stateOf(mastery, l) === 'done').length} of {list.length} completed
      </p>
      <LessonList items={list} mastery={mastery} onOpen={onOpen} />
    </section>
  )
}

function LessonList({ items, mastery, onOpen }: { items: Lesson[]; mastery: Mastery; onOpen: (id: string) => void }) {
  if (items.length === 0) return <p className="surface-reading px-4 py-3 text-[14px] font-semibold">No lessons match. Try a different word or filter.</p>
  return (
    <ul className="surface-collection grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((l) => {
        const st = stateOf(mastery, l)
        return (
          <li key={l.id}>
            <button type="button" onClick={() => onOpen(l.id)} className="flex h-full w-full flex-col gap-1 rounded-[11px] border-2 border-ink bg-parch-100 px-3 py-2.5 text-left text-ink transition-transform hover:-translate-y-0.5">
              <span className="font-display text-[16px] leading-tight">{l.title}</span>
              <span className="text-[12px] font-bold text-ink-soft">Foundation · short lesson + 2 questions</span>
              <span className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${st === 'done' ? 'bg-cash-500 text-ink' : st === 'started' ? 'bg-brass-400 text-ink' : 'bg-xp-500 text-white'}`}>
                  {STATE_LABEL[st]}
                </span>
                <span className="text-[11px] font-bold text-ink-soft">Used by: {rolesOf(l).map((r) => ROLES[r].title).join(', ')}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function LessonPage({ lesson, mastery, onBack, onOpen }: { lesson: Lesson; mastery: Mastery; onBack: () => void; onOpen: (id: string) => void }) {
  const dispatch = useGameDispatch()
  const { runs, lives } = useGame()
  const rec = mastery[lessonKey(lesson)]
  const completed = Boolean(rec?.completed)
  const [attempts, setAttempts] = useState<Record<string, number[]>>({})
  const [review, setReview] = useState<Record<string, number[]>>({})
  useEffect(() => {
    setAttempts({})
    setReview({})
  }, [lesson.id])
  const cat = categories.find((c) => c.id === lesson.categoryId)!
  const active = lesson.quiz.findIndex((q) => !rec?.acknowledged.includes(q.id))

  const answer = (qid: string, option: number) => {
    setAttempts((a) => ({ ...a, [qid]: [...(a[qid] ?? []), option] }))
    dispatch({ type: 'learnAnswer', lessonId: lesson.id, questionId: qid, option, now: Date.now() })
  }

  return (
    <article className="flex flex-col gap-4" aria-labelledby="lesson-h">
      <div>
        <button type="button" onClick={onBack} className="flex min-h-9 items-center gap-1.5 text-[14px] font-extrabold text-brass-300 hover:text-brass-400">
          <Icon name="arrow" className="h-3.5 w-3 rotate-180" />
          {cat.title}
        </button>
        <h2 id="lesson-h" className="txt-game text-2xl leading-tight sm:text-3xl">
          {lesson.title}
        </h2>
        <p className="mt-1 text-[13px] font-bold text-sage-300">
          {completed ? 'Completed ✓ · review anytime; reviews earn no FiCoins' : 'Short lesson + 2 questions · 5 FiCoins for each correct first answer'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-3">
          <LessonText lesson={lesson} label={completed ? 'Review' : 'Lesson'} />
          {lesson.quiz.map((q, i) =>
            completed ? (
              <Question key={q.id} q={q} n={i + 1} practice attempts={review[q.id] ?? []} acknowledged={false} onAnswer={(o) => setReview((r) => ({ ...r, [q.id]: [...(r[q.id] ?? []), o] }))} />
            ) : i <= active ? (
              <Question
                key={q.id}
                q={q}
                n={i + 1}
                attempts={attempts[q.id] ?? []}
                acknowledged={Boolean(rec?.acknowledged.includes(q.id))}
                receipt={rec?.receipts[q.id]}
                onAnswer={(o) => answer(q.id, o)}
                onAck={() => dispatch({ type: 'learnAcknowledge', lessonId: lesson.id, questionId: q.id })}
              />
            ) : null,
          )}
          {!completed && rec?.receipts && Object.keys(rec.receipts).length > 0 && (
            <p className="text-[12px] font-semibold text-sage-300">Answers already recorded for this lesson keep their FiCoin result; answering again is for practice.</p>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          {lesson.prerequisites.length > 0 && (
            <section className="surface-reading px-3.5 py-3">
              <h3 className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">Helpful first (optional)</h3>
              <ul className="mt-1.5 flex flex-col gap-1">
                {lesson.prerequisites.map((p) => (
                  <li key={p}>
                    <button type="button" onClick={() => onOpen(p)} className="text-left text-[14px] font-extrabold text-xp-700 underline underline-offset-2">
                      {lessonsById[p].title}
                    </button>
                    <span className="ml-1 text-[12px] font-bold text-ink-soft">{STATE_LABEL[stateOf(mastery, lessonsById[p])]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[12px] font-semibold text-ink-soft">A suggestion, not a requirement: this lesson is open now.</p>
            </section>
          )}
          <section className="surface-reading px-3.5 py-3">
            <h3 className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">Where it comes up</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {lesson.eventRefs.map((ref) => {
                const lifeId = lifeOfRole[ref.character]
                const run = runs[lifeId]
                const played = run.history.some((h) => h.eventId === ref.eventId)
                const inRun = run.positions.some((p) => p.eventId === ref.eventId)
                return (
                  <li key={ref.eventId} className="flex items-center gap-2">
                    <Portrait lifeId={lifeId} worldId={lives[lifeId].worldId} className="h-9 w-9 shrink-0 rounded-[8px] border-2 border-ink" />
                    <span className="min-w-0 flex-1 text-[13px] leading-tight font-bold text-ink">
                      <span className="block truncate">
                        {lives[lifeId].name} · {getEvent(ref.eventId).title}
                      </span>
                      <span className="block font-semibold text-ink-soft">
                        Ch. {ref.chapter}, event {ref.slot} · {played ? 'played' : inRun ? 'in this run' : ref.required ? 'every run' : 'not in this run'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'selectLife', lifeId })
                        dispatch({ type: 'setTab', tab: 'life' })
                      }}
                      className="btn-3d btn-parch h-9 shrink-0 rounded-[8px] px-2 text-[12px] font-extrabold [--lip:3px]"
                      aria-label={`Open ${lives[lifeId].name}'s road`}
                    >
                      Road
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
          {lesson.sourceIds.length > 0 && (
            <section className="surface-reading px-3.5 py-3">
              <h3 className="text-[12px] font-extrabold tracking-wide text-ink-soft uppercase">Learn more</h3>
              <ul className="mt-1.5 flex flex-col gap-1">
                {lesson.sourceIds.map((s) => (
                  <li key={s}>
                    <a href={sources[s].url} target="_blank" rel="noreferrer noopener" className="text-[13px] font-bold text-xp-700 underline underline-offset-2">
                      {sources[s].title}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] font-semibold text-ink-soft">Educational references, not endorsements. Figures in lessons are simplified examples.</p>
            </section>
          )}
        </aside>
      </div>
    </article>
  )
}
