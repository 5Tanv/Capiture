import { getEvent, lessonForEvent } from '../content'
import {
  acknowledgeQuestion,
  answerQuestion,
  choiceBlockers,
  chooseOption,
  continueRun,
  dueItems,
  previewState,
  progress,
  resolveDeadline,
  resolveDraft,
  resolveItem,
  resolveShortfall,
  type Ctx,
} from '../engine'
import type { PlayerProgress } from '../mastery'
import { previewChoice } from '../money'
import { ROLES, type Bucket } from '../roles'
import { createRun, type CampaignRun } from '../run'
import { rng } from '../selection'
import type { ChoiceDef, EventDef, RoleId } from '../types'

export const freshPlayer = (): PlayerProgress => ({ coinBase: 0, mastery: {} })
export const ALL_ROLES: RoleId[] = ['college', 'adult', 'business', 'athlete']

export function newCtx(role: RoleId = 'college', seed = 1, patch: Partial<CampaignRun> = {}): Ctx {
  const run = { ...createRun(role, seed), ...patch }
  run.opening = { ...run.accounts }
  return { run, player: freshPlayer() }
}

/** Replace the event at a position with another event from the same slot. */
export function force(ctx: Ctx, eventId: string): Ctx {
  const ev = getEvent(eventId)
  const positions = ctx.run.positions.map((p) => (p.chapter === ev.chapter && p.slot === ev.slot ? { ...p, eventId } : p))
  return { ...ctx, run: { ...ctx.run, positions } }
}

export const positionOf = (ctx: Ctx, eventId: string) => ctx.run.positions.findIndex((p) => p.eventId === eventId)

export type Chooser = (ev: EventDef, available: ChoiceDef[], ctx: Ctx) => ChoiceDef

export interface PlayOptions {
  choose?: Chooser
  answer?: (ev: EventDef, qIndex: number) => number
  shortfall?: 'transfer' | 'decline'
  renew?: boolean
  extend?: boolean
  stopAt?: number
}

export const firstFree: Chooser = (_ev, available) => available.find((c) => !c.money.some((m) => m.op === 'spend')) ?? available[0]
export const pick = (id: string, fallback: Chooser = firstFree): Chooser => (ev, av, ctx) => av.find((c) => c.id === id) ?? fallback(ev, av, ctx)

let clock = 1
/** Resolve pauses and finish events step by step until the run reaches stopAt (with no event open) or ends. */
export function play(ctx: Ctx, opts: PlayOptions = {}): Ctx {
  const choose = opts.choose ?? firstFree
  let guard = 0
  while (!ctx.run.finished) {
    if (++guard > 8000) throw new Error('play() did not converge')
    const r = ctx.run
    if (opts.stopAt !== undefined && r.index >= opts.stopAt && !r.current && !r.pause) break
    if (r.pause) {
      if (r.pause.kind === 'deadline') {
        const extended = opts.extend ? resolveDeadline(ctx, 'extend') : ctx
        ctx = extended === ctx ? resolveDeadline(ctx) : extended
      }
      else if (opts.shortfall === 'transfer') {
        const next = resolveShortfall(ctx, { kind: 'transfer' })
        ctx = next === ctx ? resolveShortfall(ctx, { kind: 'decline' }) : next
      } else ctx = resolveShortfall(ctx, { kind: 'decline' })
      continue
    }
    if (!r.current) {
      ctx = progress(ctx)
      continue
    }
    const ev = getEvent(r.current.eventId)
    if (r.current.stage === 'learn') {
      lessonForEvent(ev).quiz.forEach((q, i) => {
        if (!ctx.run.current!.quiz[q.id]?.attempts.length) ctx = answerQuestion(ctx, q.id, opts.answer ? opts.answer(ev, i) : q.answer_index, clock++)
        ctx = acknowledgeQuestion(ctx, q.id)
      })
      continue
    }
    if (r.current.stage === 'decide') {
      if (choiceBlockers(r).includes('draft')) {
        ctx = resolveDraft(ctx, 'revise')
        continue
      }
      const available = ev.choices.filter((c) => previewChoice(previewState(r), c).ok)
      const choice = choose(ev, available, ctx)
      ctx = chooseOption(ctx, choice.id)
      if (ctx.run.current?.stage !== 'done') throw new Error(`Choice ${ev.id}.${choice.id} did not apply`)
      continue
    }
    for (const it of dueItems(r)) ctx = resolveItem(ctx, it.id, opts.renew && it.renewable && it.dueChapter < 3 ? 'renew' : 'return')
    ctx = continueRun(ctx)
  }
  return ctx
}

/** Answer and acknowledge the current lesson's questions correctly, stopping at the decision. */
export function finishLesson(ctx: Ctx): Ctx {
  const cur = ctx.run.current
  if (!cur || cur.stage !== 'learn') return ctx
  for (const q of lessonForEvent(getEvent(cur.eventId)).quiz) {
    ctx = answerQuestion(ctx, q.id, q.answer_index, clock++)
    ctx = acknowledgeQuestion(ctx, q.id)
  }
  return ctx
}

/** Play to `index`, then open that event (resolving pauses on the way) with its lesson finished. */
export function openAt(ctx: Ctx, index: number, opts: PlayOptions = {}): Ctx {
  ctx = play(ctx, { ...opts, stopAt: index })
  let guard = 0
  while (!ctx.run.current) {
    if (++guard > 50) throw new Error('openAt could not open the event')
    const r = ctx.run
    if (r.pause?.kind === 'deadline') ctx = resolveDeadline(ctx)
    else if (r.pause) ctx = resolveShortfall(ctx, { kind: opts.shortfall === 'transfer' ? 'transfer' : 'decline' })
    else ctx = progress(ctx)
  }
  return finishLesson(ctx)
}

export function randomChooser(seed: number): Chooser {
  const next = rng(seed)
  return (_ev, available) => available[Math.floor(next() * available.length)]
}

/** Opening balances plus every ledger change must equal the current balances, per account and arrears bucket. */
export function reconciles(r: CampaignRun) {
  for (const a of ROLES[r.role].accounts) {
    const sum = r.ledger.reduce((s, l) => s + (l.accounts[a] ?? 0), 0)
    if ((r.opening[a] ?? 0) + sum !== (r.accounts[a] ?? 0)) return false
  }
  for (const b of ['personal', 'business'] as Bucket[]) {
    const sum = r.ledger.reduce((s, l) => s + (l.arrears[b] ?? 0), 0)
    if (sum !== r.arrears.filter((x) => x.bucket === b).reduce((s, x) => s + x.cents, 0)) return false
  }
  return Object.values(r.accounts).every((v) => (v ?? 0) >= 0)
}
