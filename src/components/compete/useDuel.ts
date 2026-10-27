import { useCallback, useEffect, useRef, useState } from 'react'
import { botTimeline, currentLeague, DUEL_QUESTIONS, DUEL_SECONDS, recordDuel, rivalRightAt, type BotAnswer, type Rival } from '../../lib/league'
import { pickQuestions, type PoolQuestion } from '../../lib/questions'

// One duel from the lobby's point of view: ready → play → results. The clock lives
// here, as a start timestamp, so re-rendering or remounting the dialog never resets it.
// Every way a duel can end goes through `finish`, which records the league once.

/** How long answer feedback stays up before the next question. */
export const FEEDBACK_MS = 1300

export type EndReason = 'complete' | 'timeout' | 'left'

export interface DuelResult {
  mine: number
  theirs: number
  reason: EndReason
}

export interface DuelData {
  id: string
  rival: Rival
  questions: PoolQuestion[]
  bot: BotAnswer[]
  /** Set when the player says they are ready; the minute runs from here. */
  startedAt: number | null
  idx: number
  /** The option picked for each answered question, in order. */
  picks: number[]
  endedAt: number | null
  result: DuelResult | null
  showResults: boolean
}

export type DuelPhase = 'closed' | 'ready' | 'play' | 'results'

export const phaseOf = (d: DuelData | null): DuelPhase =>
  !d ? 'closed' : d.startedAt === null ? 'ready' : d.showResults ? 'results' : 'play'

export const rightCount = (d: DuelData) => d.picks.filter((p, i) => p === d.questions[i]?.q.answer_index).length

function newDuel(): DuelData {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const rival = currentLeague().rival
  return {
    id,
    rival,
    questions: pickQuestions(`duel:${id}`, DUEL_QUESTIONS),
    bot: botTimeline(rival, id),
    startedAt: null,
    idx: 0,
    picks: [],
    endedAt: null,
    result: null,
    showResults: false,
  }
}

export function useDuel() {
  const [duel, setDuel] = useState<DuelData | null>(null)
  const [now, setNow] = useState(() => Date.now())
  // The latest duel, updated synchronously so two clicks in one frame see the first.
  const live = useRef<DuelData | null>(null)
  const advanceTimer = useRef<number | undefined>(undefined)

  const commit = useCallback((next: DuelData | null) => {
    live.current = next
    setDuel(next)
  }, [])
  const clearAdvance = () => window.clearTimeout(advanceTimer.current)

  const finish = useCallback(
    (reason: EndReason, at: number, showResults: boolean) => {
      const d = live.current
      if (!d || d.startedAt === null || d.result) return
      const seconds = Math.min(DUEL_SECONDS, Math.max(0, (at - d.startedAt) / 1000))
      // Leaving counts as letting the clock run out: the rival plays the whole minute,
      // so walking away early can never beat staying.
      const theirs = rivalRightAt(d.bot, reason === 'left' ? DUEL_SECONDS : seconds)
      const result = { mine: rightCount(d), theirs, reason }
      recordDuel(d.id, result.mine, result.theirs)
      commit({ ...d, endedAt: d.startedAt + seconds * 1000, result, showResults: d.showResults || showResults })
    },
    [commit],
  )

  const advance = useCallback(() => {
    clearAdvance()
    const d = live.current
    if (!d || phaseOf(d) !== 'play' || d.picks.length <= d.idx) return
    if (d.result) commit({ ...d, showResults: true })
    else commit({ ...d, idx: d.idx + 1 })
  }, [commit])

  const open = useCallback(() => {
    clearAdvance()
    commit(newDuel())
  }, [commit])

  const start = useCallback(() => {
    const d = live.current
    if (!d || d.startedAt !== null || d.questions.length === 0) return
    const t = Date.now()
    setNow(t)
    commit({ ...d, startedAt: t })
  }, [commit])

  const answer = useCallback(
    (option: number) => {
      const d = live.current
      if (!d || phaseOf(d) !== 'play' || d.result || d.picks.length > d.idx) return
      const t = Date.now()
      if (d.startedAt !== null && t - d.startedAt >= DUEL_SECONDS * 1000) return finish('timeout', t, true)
      commit({ ...d, picks: [...d.picks, option] })
      if (d.idx + 1 >= d.questions.length) finish('complete', t, false)
      clearAdvance()
      advanceTimer.current = window.setTimeout(advance, FEEDBACK_MS)
    },
    [advance, commit, finish],
  )

  /** Ends a running duel now, scored as if the clock had run out. */
  const leave = useCallback(() => {
    clearAdvance()
    finish('left', Date.now(), true)
  }, [finish])

  /** Closes the arena. A running duel must be left first. */
  const close = useCallback(() => {
    const d = live.current
    if (d && phaseOf(d) === 'play' && !d.result) return
    clearAdvance()
    commit(null)
  }, [commit])

  // The clock: tick while a duel runs and end it, once, when the minute is up.
  const running = duel !== null && duel.startedAt !== null && duel.result === null
  useEffect(() => {
    if (!running) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const d = live.current
      if (d?.startedAt != null && t - d.startedAt >= DUEL_SECONDS * 1000) {
        clearAdvance()
        finish('timeout', d.startedAt + DUEL_SECONDS * 1000, true)
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running, finish])

  // Leaving Compete mid-duel (another tab, browser back) ends the duel like Leave does,
  // so a bad start can't be thrown away for a fresh one.
  useEffect(
    () => () => {
      clearAdvance()
      const d = live.current
      if (d && phaseOf(d) === 'play' && !d.result) finish('left', Date.now(), true)
    },
    [finish],
  )

  const elapsed = duel?.startedAt != null ? Math.min(DUEL_SECONDS, ((duel.endedAt ?? now) - duel.startedAt) / 1000) : 0
  return { duel, phase: phaseOf(duel), elapsed, open, start, answer, advance, leave, close }
}

export type DuelController = ReturnType<typeof useDuel>
