import { prepModifierApplies, PREP_LINE, summerPlace } from './callbacks'
import { calendars, dayLabel, inSeries, isMonthStart, nextInSeries, nextMonthStart, type SeriesDates } from './calendar'
import { eventLessonKey, getEvent, lessonForEvent } from './content'
import { acknowledgeLesson, answerLesson, type PlayerProgress } from './mastery'
import { formatCents, previewChoice, type PreviewState } from './money'
import { ASSET_NAMES, UNIT, formatUnits, sellFifo, unitsHeld, valueOf } from './portfolio'
import { ACCOUNT_NAMES, ROLES, bucketOf, pricesOn, type Bucket } from './roles'
import { arrearsTotal, bal, flagOn, investmentValue, stat, type CampaignRun, type HeldItem, type LedgerEntry, type Stats } from './run'
import type { AccountId, AssetId, ChoiceDef, EventDef, StatKey } from './types'

// The pure state-transition layer for every life. Each function takes the current
// run and the player's learning progress and returns new copies; nothing here
// touches React, storage or the clock (callers pass `now` for receipt times), so
// the same inputs always give the same result. Every dated transaction has an ID
// and runs once, so stopping for a decision, reloading or replaying never repeats it.

export interface Ctx {
  run: CampaignRun
  player: PlayerProgress
}

const clone = <T>(x: T): T => structuredClone(x)
const clamp = (n: number) => Math.min(100, Math.max(0, n))

export const eventDay = (ev: Pick<EventDef, 'role' | 'year' | 'date'>) => calendars[ev.role].toDay(ev.year, ev.date)
export const currentEventDef = (r: CampaignRun) => (r.index < r.positions.length ? getEvent(r.positions[r.index].eventId) : null)

export const SUMMER_ROLES: Record<string, number> = { campus: 18000, local: 22000, skills: 16000, community: 18000 }
const SUMMER_PAY: SeriesDates = { first: calendars.college.toDay(2, '06-15'), every: 14, last: calendars.college.toDay(2, '08-24') }
const FEE_FLAGS = ['banking.fee_account', 'deposit_protection.fee_account']

export const previewState = (r: CampaignRun): PreviewState => ({ accounts: r.accounts, lots: r.lots, prices: r.prices, brokerage: brokerageUnlocked(r) })

/** Cash investing opens with the brokerage lesson (W218/B218/P218, C218 for college). */
export function brokerageUnlocked(r: CampaignRun) {
  return flagOn(r, 'brokerage.brokerage_unlocked') || r.history.some((h) => getEvent(h.eventId).mode === 'brokerage' || h.eventId === 'C218')
}

function addLedger(r: CampaignRun, e: Omit<LedgerEntry, 'accounts' | 'arrears'> & Partial<Pick<LedgerEntry, 'accounts' | 'arrears'>>) {
  r.ledger.push({ accounts: {}, arrears: {}, ...e })
  return e.id
}

const move = (r: CampaignRun, a: AccountId, n: number) => (r.accounts[a] = bal(r, a) + n)

/** Pay oldest unpaid costs in a bucket from money that just arrived in `account`. */
function settleArrears(r: CampaignRun, id: string, day: number, account: AccountId, available: number, eventId?: string, what = 'income'): string[] {
  const bucket = bucketOf(account)
  const settle = Math.min(available, arrearsTotal(r, bucket))
  if (settle <= 0) return []
  let left = settle
  r.arrears = r.arrears.flatMap((a) => {
    if (a.bucket !== bucket || left === 0) return [a]
    const take = Math.min(a.cents, left)
    left -= take
    return a.cents > take ? [{ ...a, cents: a.cents - take }] : []
  })
  move(r, account, -settle)
  return [
    addLedger(r, {
      id: `${id}:settle`,
      day,
      kind: 'settlement',
      label: `Unpaid ${bucket === 'business' ? 'studio' : 'living'} costs settled`,
      accounts: { [account]: -settle },
      arrears: { [bucket]: -settle },
      eventId,
      detail: `${formatCents(available)} arrived as ${what}: ${formatCents(settle)} settled unpaid costs first, ${formatCents(available - settle)} is available.`,
    }),
  ]
}

/** Earned income: recorded once, then it clears the oldest unpaid costs before the rest is spendable. */
function receiveIncome(r: CampaignRun, id: string, day: number, cents: number, account: AccountId, label: string, eventId?: string): string[] {
  move(r, account, cents)
  return [addLedger(r, { id, day, kind: 'earning', label, accounts: { [account]: cents }, eventId }), ...settleArrears(r, id, day, account, cents, eventId)]
}

/** Which voluntary sources could cover a shortfall in this account (never taken without consent). */
export function shortfallSources(r: CampaignRun, account: AccountId) {
  if (bucketOf(account) === 'business') return { reserve: 'business_reserve' as AccountId, owner: bal(r, 'checking') > 0, sale: false }
  return { reserve: 'savings' as AccountId, owner: false, sale: investmentValue(r) > 0 }
}

/** Returns false when the bill needs the player's decision before it can be charged. */
function chargeBill(r: CampaignRun, id: string, day: number, cents: number, account: AccountId, label: string, kind: 'bill' | 'fee'): boolean {
  if (bal(r, account) >= cents) {
    move(r, account, -cents)
    addLedger(r, { id, day, kind, label, accounts: { [account]: -cents } })
    return true
  }
  const src = shortfallSources(r, account)
  const canCover = bal(r, src.reserve) > 0 || src.owner || src.sale
  if (canCover && !r.declined.includes(id)) {
    r.pause = { kind: 'shortfall', txId: id, label, billCents: cents, day, account }
    return false
  }
  const paid = bal(r, account)
  const rest = cents - paid
  const bucket = bucketOf(account)
  r.accounts[account] = 0
  r.arrears.push({ id, label, day, cents: rest, bucket })
  addLedger(r, {
    id,
    day,
    kind,
    label,
    accounts: { [account]: -paid },
    arrears: { [bucket]: rest },
    detail: `${formatCents(paid)} paid from ${ACCOUNT_NAMES[account].toLowerCase()}; ${formatCents(rest)} recorded as unpaid (no fee, interest or borrowing).`,
  })
  return true
}

export function summerRoleOn(r: CampaignRun, day: number) {
  let role = null
  for (const s of r.summerRoles) if (s.fromDay <= day) role = s
  return role
}

/** Base pay plus the latest confirmed change that applies by this payday. */
export function payOn(r: CampaignRun, base: number, day: number) {
  let delta = 0
  for (const p of r.payroll) if (p.fromDay <= day) delta = p.deltaCents
  return base + delta
}

/**
 * Process the calendar through `target`, one date at a time, in a fixed order:
 * market prices, income and receivables, routine bills and fees, the studio's
 * reserve and owner-draw transfers, then utility deadlines.
 */
function processTo(r: CampaignRun, target: number) {
  const spec = ROLES[r.role]
  const done = new Set(r.processed)
  const mark = (id: string) => {
    done.add(id)
    r.processed.push(id)
  }
  const last = Math.min(target, calendars[r.role].lastDay)
  for (let day = r.day + 1; day <= last; day++) {
    const quote = spec.prices.find((q) => q.day === day)
    if (quote && !done.has(`mkt:${day}`)) {
      r.prices = { broad: quote.broad, single: quote.single }
      mark(`mkt:${day}`)
    }

    let clientReceipt = false
    for (const s of spec.series) {
      if (s.kind !== 'income' || !inSeries(day, s)) continue
      const id = `${s.id}:${day}`
      if (s.clientReceipt) clientReceipt = true
      if (done.has(id)) continue
      receiveIncome(r, id, day, s.payroll ? payOn(r, s.cents, day) : s.cents, s.account, s.label)
      mark(id)
    }
    if (r.role === 'college' && inSeries(day, SUMMER_PAY) && !done.has(`summerpay:${day}`)) {
      const role = summerRoleOn(r, day)
      if (role) receiveIncome(r, `summerpay:${day}`, day, role.cents, 'checking', `Summer pay (net): ${summerPlace(role.role)}`)
      mark(`summerpay:${day}`)
    }
    for (const p of r.pending.filter((x) => x.dueDay === day).sort((a, b) => a.id.localeCompare(b.id))) {
      if (done.has(p.id)) continue
      receiveIncome(r, p.id, day, p.cents, p.account, p.label, p.eventId)
      mark(p.id)
    }
    r.pending = r.pending.filter((p) => !done.has(p.id))

    const bills: { id: string; cents: number; account: AccountId; label: string; kind: 'bill' | 'fee' }[] = spec.series
      .filter((s) => s.kind === 'bill' && inSeries(day, s))
      .map((s) => ({ id: `${s.id}:${day}`, cents: s.cents, account: s.account, label: s.label, kind: 'bill' }))
    if (isMonthStart(r.role, day) && r.feePlan.on && day >= r.feePlan.fromDay)
      bills.push({ id: `fee:${day}`, cents: spec.fee.cents, account: spec.fee.account, label: 'Monthly account fee', kind: 'fee' })
    for (const b of bills) {
      if (done.has(b.id)) continue
      if (!chargeBill(r, b.id, day, b.cents, b.account, b.label, b.kind)) return
      mark(b.id)
    }

    // Studio policy after each client receipt and that day's bills: earmark the tax reserve,
    // then pay the owner. Both are transfers between the owner's own accounts, never revenue
    // or a tax payment, and they only use money that is actually there.
    if (spec.allocation && clientReceipt) {
      const taxId = `tax:${day}`
      if (!done.has(taxId)) {
        const amt = Math.min(spec.allocation.taxReserveCents, bal(r, 'business_cash'))
        if (amt > 0) {
          move(r, 'business_cash', -amt)
          move(r, 'tax_reserve', amt)
          addLedger(r, { id: taxId, day, kind: 'transfer', label: 'Tax reserve set aside (not a tax payment)', accounts: { business_cash: -amt, tax_reserve: amt } })
        }
        mark(taxId)
      }
      const drawId = `draw:${day}`
      if (!done.has(drawId)) {
        const amt = Math.min(spec.allocation.ownerDrawCents, bal(r, 'business_cash'))
        if (amt > 0) {
          move(r, 'business_cash', -amt)
          move(r, 'checking', amt)
          addLedger(r, { id: drawId, day, kind: 'transfer', label: 'Owner draw to personal checking (a transfer, not new income)', accounts: { business_cash: -amt, checking: amt } })
          settleArrears(r, drawId, day, 'checking', amt, undefined, 'an owner draw')
        }
        mark(drawId)
      }
    }

    for (const d of r.deadlines.filter((x) => x.day === day && !x.resolved && x.kind === 'item_ready')) {
      d.resolved = true
      r.utilities.push({ id: `ready:${d.id}`, day, label: d.label, statChanges: {} })
    }
    const due = r.deadlines.find((d) => d.day === day && !d.resolved)
    if (due) {
      r.pause = { kind: 'deadline', deadlineId: due.id }
      return
    }
    r.day = day
  }
}

/** Open the next story position: process the calendar up to its date, then start it. */
export function progress(ctx: Ctx): Ctx {
  const { run } = ctx
  if (run.finished || run.current || run.pause) return ctx
  const ev = currentEventDef(run)
  if (!ev) return ctx
  const r = clone(run)
  processTo(r, eventDay(ev))
  if (r.pause) return { run: r, player: ctx.player }
  const mode = ctx.player.mastery[eventLessonKey(ev)]?.completed ? 'review' : 'new'
  const wl = ev.callbacks.find((c) => c.type === 'workload_modifier')
  r.current = {
    index: r.index,
    eventId: ev.id,
    mode,
    stage: mode === 'new' ? 'learn' : 'decide',
    quiz: {},
    ledgerStart: r.transitionStart,
    workload: Boolean(wl && wl.type === 'workload_modifier' && stat(r, 'stress') >= wl.gte),
  }
  return { run: r, player: ctx.player }
}

// ── Lessons and quizzes (the receipts live on the player; see mastery.ts) ──

export function answerQuestion(ctx: Ctx, questionId: string, option: number, now: number): Ctx {
  const cur = ctx.run.current
  if (!cur || cur.stage !== 'learn') return ctx
  const ev = getEvent(cur.eventId)
  const lesson = lessonForEvent(ev)
  const q = lesson.quiz.find((x) => x.id === questionId)
  if (!q || !Number.isInteger(option) || option < 0 || option >= q.options.length) return ctx
  const prog = cur.quiz[questionId] ?? { attempts: [], acknowledged: false }
  if (prog.acknowledged || prog.attempts.includes(q.answer_index) || prog.attempts.includes(option)) return ctx
  const r = clone(ctx.run)
  r.current!.quiz[questionId] = { attempts: [...prog.attempts, option], acknowledged: false }
  return { run: r, player: answerLesson(ctx.player, lesson, questionId, option, now, 'story', ev.id) }
}

/** Reading the explanation completes the question, right or wrong. */
export function acknowledgeQuestion(ctx: Ctx, questionId: string): Ctx {
  const cur = ctx.run.current
  if (!cur || cur.stage !== 'learn') return ctx
  const prog = cur.quiz[questionId]
  if (!prog || prog.attempts.length === 0 || prog.acknowledged) return ctx
  const ev = getEvent(cur.eventId)
  const lesson = lessonForEvent(ev)
  const r = clone(ctx.run)
  r.current!.quiz[questionId] = { ...prog, acknowledged: true }
  if (lesson.quiz.every((q) => r.current!.quiz[q.id]?.acknowledged)) r.current!.stage = 'decide'
  return { run: r, player: acknowledgeLesson(ctx.player, lesson, questionId, 'story', ev.id) }
}

// ── Choices ────────────────────────────────────────────────────────────────

function applyStats(r: CampaignRun, deltas: Stats): Stats {
  const actual: Stats = {}
  for (const k of Object.keys(deltas) as StatKey[]) {
    const d = deltas[k] ?? 0
    if (d === 0) continue
    const before = stat(r, k)
    r.stats[k] = clamp(before + d)
    actual[k] = (r.stats[k] ?? 0) - before
  }
  return actual
}

interface ItemRule {
  eventId: string
  flag: string
  value: string
  item: Omit<HeldItem, 'status' | 'renewals'>
}

/** College: things a choice leaves the character holding (or lending), resolved at a chapter's end. */
const ITEM_RULES: ItemRule[] = [
  { eventId: 'C104', flag: 'textbook', value: 'rental', item: { id: 'textbook-rental', label: 'Semester textbook rental', kind: 'rental', dueChapter: 1, renewable: false } },
  { eventId: 'C107', flag: 'laptop', value: 'semester_loaner', item: { id: 'laptop-loaner', label: 'Campus semester loaner laptop', kind: 'loaner', dueChapter: 1, renewable: true } },
  { eventId: 'C118', flag: 'controller', value: 'lent', item: { id: 'controller-lent', label: 'Game controller lent to Alex', kind: 'lent', dueChapter: 1, renewable: false } },
  { eventId: 'C121', flag: 'winter_coat', value: 'borrowed', item: { id: 'coat-borrowed', label: 'Winter coat borrowed from family', kind: 'borrowed', dueChapter: 2, renewable: false } },
  { eventId: 'C122', flag: 'phone', value: 'battery_loan', item: { id: 'battery-loan', label: 'Campus battery pack loan', kind: 'loaner', dueChapter: 1, renewable: true } },
  { eventId: 'C302', flag: 'summer_purchase', value: 'borrowed', item: { id: 'game-borrowed', label: 'Game borrowed from a friend', kind: 'borrowed', dueChapter: 3, renewable: false } },
]

export const FINALES: Record<string, 1 | 2 | 3> = { C125: 1, C225: 2, C320: 3 }

/** Decisions that must be made before choosing (C125's draft revision comes before the reflection). */
export function choiceBlockers(r: CampaignRun): 'draft'[] {
  const cur = r.current
  if (cur?.eventId === 'C125' && flagOn(r, 'tight_deadline') && !flagOn(r, 'draft_completed') && !flagOn(r, 'draft_kept')) return ['draft']
  return []
}

/** College items that must be returned or renewed before the story moves past a chapter finale. */
export function dueItems(r: CampaignRun): HeldItem[] {
  const cur = r.current
  const chapter = cur ? FINALES[cur.eventId] : undefined
  if (!chapter) return []
  return r.items.filter((i) => i.status === 'out' && i.dueChapter <= chapter)
}

/** Stat changes a choice would make right now, including named modifiers. */
export function choiceDeltas(r: CampaignRun, ev: EventDef, choice: ChoiceDef): { deltas: Stats; notes: string[] } {
  const deltas: Stats = { ...choice.stats }
  const notes: string[] = []
  if (r.role === 'college' && prepModifierApplies(r, ev.id)) {
    deltas.stress = (deltas.stress ?? 0) - 1
    notes.push(`${PREP_LINE} Stress −1 more.`)
  }
  const wl = ev.callbacks.find((c) => c.type === 'workload_modifier')
  if (wl && wl.type === 'workload_modifier' && r.current?.workload && wl.choiceIds.includes(choice.id)) {
    deltas.stress = (deltas.stress ?? 0) + wl.stress
    notes.push(`Workload: you were already highly stressed, so this extra work adds ${wl.stress} more stress.`)
  }
  return { deltas, notes }
}

/** Future effects a choice would set up, previewed before confirming (raise, fee plan, follow-ups). */
export function choiceConsequences(r: CampaignRun, ev: EventDef, choice: ChoiceDef): string[] {
  const out: string[] = []
  const day = eventDay(ev)
  const raise = choice.flags['negotiation.salary_delta_cents']
  const paySeries = ROLES[r.role].series.find((s) => s.payroll)
  if (typeof raise === 'number' && raise > 0 && paySeries) {
    const from = nextInSeries(day, paySeries)
    if (from !== null) out.push(`Net pay +${formatCents(raise)} per paycheck from ${dayLabel(r.role, from)}; earlier pay doesn't change.`)
  }
  const feeKey = FEE_FLAGS.find((k) => k in choice.flags)
  if ((feeKey && choice.flags[feeKey] === true) || (r.role === 'college' && choice.flags.bank_plan === 'fee_account')) {
    const from = nextMonthStart(r.role, day)
    if (from !== null) out.push(`A ${formatCents(ROLES[r.role].fee.cents)} monthly fee from ${dayLabel(r.role, from)}; you can switch to fee-free before any charge.`)
  }
  for (const cb of ev.callbacks)
    if (cb.type === 'utility_deadline' && cb.choiceIds.includes(choice.id))
      out.push(cb.afterDays <= 7 ? `Pickup in ${cb.afterDays} days, with a free loaner until then.` : `A free review of the supported loan in ${cb.afterDays} days.`)
  if (Object.entries(choice.flags).some(([k, v]) => k.endsWith('.purchase_timing') && v === 'delayed')) out.push('Ready in 7 days; paid today, with no second charge.')
  return out
}

export function chooseOption(ctx: Ctx, choiceId: string): Ctx {
  const cur = ctx.run.current
  if (!cur || cur.stage !== 'decide') return ctx
  const ev = getEvent(cur.eventId)
  const choice = ev.choices.find((c) => c.id === choiceId)
  if (!choice) return ctx
  const prefix = `${ctx.run.runId}/${ev.id}/`
  if (ctx.run.applied.some((k) => k.startsWith(prefix))) return ctx
  if (choiceBlockers(ctx.run).length > 0) return ctx
  const preview = previewChoice(previewState(ctx.run), choice)
  if (!preview.ok) return ctx

  const r = clone(ctx.run)
  const role = r.role
  const day = eventDay(ev)
  const ledgerIds: string[] = []
  const notes: string[] = []
  preview.ops.forEach((p, i) => {
    const id = `${ev.id}:${choice.id}:${i}`
    const op = p.op
    switch (op.op) {
      case 'spend':
        move(r, op.account, -p.amount)
        ledgerIds.push(addLedger(r, { id, day, kind: 'purchase', label: choice.label, accounts: { [op.account]: -p.amount }, eventId: ev.id }))
        break
      case 'earn':
        ledgerIds.push(...receiveIncome(r, id, day, p.amount, op.account, ev.title, ev.id))
        break
      case 'schedule_income': {
        const pid = `inc:${ev.id}:${choice.id}:${i}`
        if (r.pending.some((x) => x.id === pid) || r.processed.includes(pid)) break
        const due = day + op.afterDays
        r.pending.push({ id: pid, dueDay: due, cents: op.cents, account: op.account, label: op.note ?? `Payment for completed work (${ev.title})`, eventId: ev.id })
        notes.push(`${formatCents(op.cents)} is earned and arrives in ${ACCOUNT_NAMES[op.account].toLowerCase()} on ${dayLabel(role, due)}.`)
        break
      }
      case 'transfer_up_to':
        move(r, op.source, -p.amount)
        move(r, op.destination, p.amount)
        ledgerIds.push(
          addLedger(r, {
            id,
            day,
            kind: 'transfer',
            label: `Moved ${ACCOUNT_NAMES[op.source].toLowerCase()} → ${ACCOUNT_NAMES[op.destination].toLowerCase()}`,
            accounts: { [op.source]: -p.amount, [op.destination]: p.amount },
            eventId: ev.id,
          }),
        )
        break
      case 'buy_up_to':
        move(r, op.account, -p.amount)
        r.lots.push({ id, asset: op.asset, units: p.units!, basisCents: p.amount, day })
        ledgerIds.push(
          addLedger(r, {
            id,
            day,
            kind: 'investment',
            label: `Bought ${ASSET_NAMES[op.asset]}`,
            accounts: { [op.account]: -p.amount },
            eventId: ev.id,
            detail: `${formatUnits(p.units!)} units at ${formatCents(r.prices[op.asset])} (classroom simulation)`,
          }),
        )
        break
      case 'sell_up_to': {
        const sold = sellFifo(r.lots, op.asset, p.units!)
        r.lots = sold.lots
        r.realizedCents += p.amount - sold.basisSold
        move(r, op.destination, p.amount)
        ledgerIds.push(
          addLedger(r, {
            id,
            day,
            kind: 'sale',
            label: `Sold ${ASSET_NAMES[op.asset]}`,
            accounts: { [op.destination]: p.amount },
            eventId: ev.id,
            detail: `${formatUnits(p.units!)} units; cost basis ${formatCents(sold.basisSold)}, realized ${formatCents(p.amount - sold.basisSold, true)}`,
          }),
        )
        break
      }
    }
  })

  const { deltas, notes: modNotes } = choiceDeltas(r, ev, choice)
  if (role === 'college' && prepModifierApplies(r, ev.id)) r.flags.prep_modifier_used = true
  notes.unshift(...modNotes)
  const statChanges = applyStats(r, deltas)
  Object.assign(r.flags, choice.flags)

  // Executable consequences of the choice's flags.
  const raise = choice.flags['negotiation.salary_delta_cents']
  if (typeof raise === 'number') {
    const paySeries = ROLES[role].series.find((s) => s.payroll)
    const from = paySeries ? nextInSeries(day, paySeries) : null
    if (paySeries && from !== null) {
      r.payroll = [...r.payroll.filter((p) => p.fromDay < from), { fromDay: from, deltaCents: raise }]
      if (raise > 0) notes.push(`Your net pay rises by ${formatCents(raise)} from the ${dayLabel(role, from)} payday. Earlier pay is not changed.`)
    }
  }
  const feeKey = FEE_FLAGS.find((k) => k in choice.flags)
  const collegeFee = role === 'college' && 'bank_plan' in choice.flags
  if (feeKey || collegeFee) {
    const on = feeKey ? choice.flags[feeKey] === true : choice.flags.bank_plan === 'fee_account'
    const from = nextMonthStart(role, day) ?? calendars[role].lastDay + 1
    r.feePlan = { on, fromDay: from }
    if (on) notes.push(`The ${formatCents(ROLES[role].fee.cents)} monthly fee starts on ${dayLabel(role, from)}. You can switch to fee-free before any charge.`)
  }
  for (const cb of ev.callbacks) {
    if (cb.type !== 'utility_deadline' || !cb.choiceIds.includes(choice.id)) continue
    const repair = cb.afterDays <= 7
    const id = `${ev.id}:${repair ? 'pickup' : 'review'}`
    if (r.deadlines.some((d) => d.id === id)) continue
    r.deadlines.push({
      id,
      day: day + cb.afterDays,
      kind: repair ? 'repair_pickup' : 'loan_review',
      label: repair ? 'Collect the repaired item and return the temporary loaner' : 'Review the supported loan arrangement',
      resolved: false,
      eventId: ev.id,
    })
    notes.push(`${repair ? 'Repair pickup' : 'Loan review'} on ${dayLabel(role, day + cb.afterDays)}${day + cb.afterDays > calendars[role].lastDay ? ' (after this story ends)' : ''}.`)
  }
  for (const [k, v] of Object.entries(choice.flags)) {
    if (k.endsWith('.purchase_timing') && v === 'delayed' && !r.deadlines.some((d) => d.id === `${ev.id}:ready`)) {
      r.deadlines.push({ id: `${ev.id}:ready`, day: day + 7, kind: 'item_ready', label: 'Your delayed purchase is ready (already paid; no second charge)', resolved: false, eventId: ev.id })
      notes.push(`The item is ready on ${dayLabel(role, day + 7)}; it is already paid for.`)
    }
  }
  if (role === 'college') {
    for (const rule of ITEM_RULES) {
      if (rule.eventId === ev.id && r.flags[rule.flag] === rule.value && !r.items.some((i) => i.id === rule.item.id)) {
        r.items.push({ ...rule.item, status: 'out', renewals: 0 })
        notes.push(`${rule.item.label}: to be resolved at the end of Chapter ${rule.item.dueChapter}.`)
      }
    }
    if (ev.id === 'C107' && (r.flags.laptop === 'repair_savings' || r.flags.laptop === 'repair_checking')) {
      r.deadlines.push({ id: 'laptop-pickup', day: day + 3, kind: 'laptop_pickup', label: 'Collect your repaired laptop and return the three-day loaner', resolved: false, eventId: ev.id })
      notes.push(`Repair pickup on ${dayLabel(role, day + 3)}; the loaner goes back then.`)
    }
    if (ev.id === 'C225') {
      const placement = String(r.flags.summer_mode)
      r.summerRoles.push({ role: placement, cents: SUMMER_ROLES[placement] ?? Number(r.flags.summer_pay) * 100, fromDay: SUMMER_PAY.first })
    }
  }
  for (const t of choice.playstyles) r.tags[t] += 1

  r.history.push({
    index: cur.index,
    chapter: ev.chapter,
    slot: ev.slot,
    eventId: ev.id,
    title: ev.title,
    lessonKey: eventLessonKey(ev),
    day,
    mode: cur.mode,
    choiceId: choice.id,
    choiceLabel: choice.label,
    rationale: choice.reason,
    statChanges,
    statsAfter: { ...r.stats },
    ledgerIds,
    notes,
  })
  r.applied.push(`${prefix}${choice.id}`)
  r.current = { ...r.current!, stage: 'done', outcome: { choiceId: choice.id, statChanges, ledgerIds, notes } }
  return { run: r, player: ctx.player }
}

/** Move to the next story position once the outcome is read and any returns are resolved. */
export function continueRun(ctx: Ctx): Ctx {
  const cur = ctx.run.current
  if (!cur || cur.stage !== 'done' || dueItems(ctx.run).length > 0) return ctx
  const r = clone(ctx.run)
  r.index += 1
  r.current = null
  r.transitionStart = r.ledger.length
  if (r.index >= r.positions.length) r.finished = true
  return { run: r, player: ctx.player }
}

export function markSummarySeen(ctx: Ctx, chapter: number): Ctx {
  if (ctx.run.summariesSeen.includes(chapter)) return ctx
  return { ...ctx, run: { ...ctx.run, summariesSeen: [...ctx.run.summariesSeen, chapter] } }
}

// ── Pauses: shortfalls and deadlines ───────────────────────────────────────

export function shortfallNeed(r: CampaignRun) {
  return r.pause?.kind === 'shortfall' ? Math.max(0, r.pause.billCents - bal(r, r.pause.account)) : 0
}

/** What selling enough of an asset to cover the shortfall would do. */
export function previewShortfallSale(r: CampaignRun, asset: AssetId) {
  const need = shortfallNeed(r)
  const price = r.prices[asset]
  const units = Math.min(Math.ceil((need * UNIT) / price), unitsHeld(r.lots, asset))
  const proceeds = valueOf(units, price)
  if (units === 0 || proceeds === 0) return null
  const { basisSold } = sellFifo(r.lots, asset, units)
  return { units, proceeds, price, basisSold, realized: proceeds - basisSold }
}

export type ShortfallAction = { kind: 'transfer' } | { kind: 'owner' } | { kind: 'sell'; asset: AssetId } | { kind: 'decline' }

export function resolveShortfall(ctx: Ctx, action: ShortfallAction): Ctx {
  const pause = ctx.run.pause
  if (pause?.kind !== 'shortfall') return ctx
  const r = clone(ctx.run)
  const need = shortfallNeed(r)
  const src = shortfallSources(r, pause.account)
  const id = `${pause.txId}:cover:${r.ledger.length}`
  const what = pause.label.toLowerCase()
  if (action.kind === 'transfer' || action.kind === 'owner') {
    const from: AccountId = action.kind === 'owner' ? 'checking' : src.reserve
    if (action.kind === 'owner' && !src.owner) return ctx
    const amt = Math.min(need, bal(r, from))
    if (amt <= 0) return ctx
    move(r, from, -amt)
    move(r, pause.account, amt)
    addLedger(r, {
      id,
      day: pause.day,
      kind: 'transfer',
      label: action.kind === 'owner' ? `Owner contribution to the studio for ${what} (a transfer, not revenue)` : `Moved ${ACCOUNT_NAMES[from].toLowerCase()} → ${ACCOUNT_NAMES[pause.account].toLowerCase()} for ${what}`,
      accounts: { [from]: -amt, [pause.account]: amt },
    })
  } else if (action.kind === 'sell') {
    if (!src.sale) return ctx
    const q = previewShortfallSale(r, action.asset)
    if (!q) return ctx
    r.lots = sellFifo(r.lots, action.asset, q.units).lots
    r.realizedCents += q.realized
    move(r, pause.account, q.proceeds)
    addLedger(r, {
      id,
      day: pause.day,
      kind: 'sale',
      label: `Sold ${ASSET_NAMES[action.asset]} for ${what}`,
      accounts: { [pause.account]: q.proceeds },
      detail: `${formatUnits(q.units)} units at ${formatCents(q.price)}; realized ${formatCents(q.realized, true)}`,
    })
  } else {
    r.declined.push(pause.txId)
  }
  r.pause = null
  return progress({ run: r, player: ctx.player })
}

/** Resolve a deadline. A supported loan review can be extended once; everything else is collected or returned. */
export function resolveDeadline(ctx: Ctx, action: 'resolve' | 'extend' = 'resolve'): Ctx {
  const pause = ctx.run.pause
  if (pause?.kind !== 'deadline') return ctx
  const r = clone(ctx.run)
  const d = r.deadlines.find((x) => x.id === pause.deadlineId)
  if (!d) return ctx
  if (action === 'extend') {
    if (d.kind !== 'loan_review' || d.extended) return ctx
    d.extended = true
    r.utilities.push({ id: `deadline:${d.id}:extend`, day: d.day, label: 'Agreed a 30-day supported extension of the loan (no fee)', statChanges: {} })
    d.day += 30
  } else {
    d.resolved = true
    if (d.kind === 'laptop_pickup') r.flags.laptop_collected = true
    const label =
      d.kind === 'loan_review' ? 'Returned the supported loan and switched to the free support alternative' : d.label
    r.utilities.push({ id: `deadline:${d.id}`, day: d.day, label, statChanges: {} })
  }
  r.pause = null
  return progress({ run: r, player: ctx.player })
}

// ── Utilities: free, no FiCoins, no time passes ────────────────────────────

const utilityDay = (r: CampaignRun) => (r.current ? eventDay(getEvent(r.current.eventId)) : Math.max(0, r.day))

export function resolveDraft(ctx: Ctx, action: 'revise' | 'keep'): Ctx {
  if (!choiceBlockers(ctx.run).includes('draft')) return ctx
  const r = clone(ctx.run)
  const statChanges = applyStats(r, action === 'revise' ? { academics: 2, stress: 1 } : { stress: -1 })
  r.flags[action === 'revise' ? 'draft_completed' : 'draft_kept'] = true
  r.utilities.push({
    id: `draft:${action}`,
    day: utilityDay(r),
    label: action === 'revise' ? 'Revised the draft with free writing-center help' : 'Kept the submitted draft and made a plan for next time',
    statChanges,
  })
  return { run: r, player: ctx.player }
}

export function resolveItem(ctx: Ctx, itemId: string, action: 'return' | 'renew'): Ctx {
  const item = dueItems(ctx.run).find((i) => i.id === itemId)
  if (!item || !ctx.run.current || ctx.run.current.stage !== 'done') return ctx
  if (action === 'renew' && (!item.renewable || item.dueChapter >= 3)) return ctx
  const r = clone(ctx.run)
  const it = r.items.find((i) => i.id === itemId)!
  if (action === 'return') it.status = 'returned'
  else {
    it.dueChapter = (it.dueChapter + 1) as 2 | 3
    it.renewals += 1
  }
  r.utilities.push({
    id: `item:${itemId}:${action}:${it.renewals}`,
    day: utilityDay(r),
    label: action === 'return' ? `${it.kind === 'lent' ? 'Got back' : 'Returned'}: ${it.label}` : `Renewed free through campus support: ${it.label}`,
    statChanges: {},
  })
  return { run: r, player: ctx.player }
}

export const RECOVERY_COOLDOWN = 7

export function canRecover(r: CampaignRun) {
  const day = utilityDay(r)
  return !r.finished && stat(r, 'stress') >= 70 && (r.lastRecoveryDay === null || day - r.lastRecoveryDay >= RECOVERY_COOLDOWN)
}

/** College only: a free peer-support check-in when happiness is low. */
export function canCheckIn(r: CampaignRun) {
  const day = utilityDay(r)
  return r.role === 'college' && !r.finished && stat(r, 'happiness') <= 30 && (r.lastCheckinDay === null || day - r.lastCheckinDay >= RECOVERY_COOLDOWN)
}

export function takeRecovery(ctx: Ctx): Ctx {
  if (!canRecover(ctx.run)) return ctx
  const r = clone(ctx.run)
  const day = utilityDay(r)
  const statChanges = applyStats(r, { stress: -4 })
  r.lastRecoveryDay = day
  r.utilities.push({ id: `rest:${day}`, day, label: 'Took a free recovery break', statChanges })
  return { run: r, player: ctx.player }
}

export function takeCheckIn(ctx: Ctx): Ctx {
  if (!canCheckIn(ctx.run)) return ctx
  const r = clone(ctx.run)
  const day = utilityDay(r)
  const statChanges = applyStats(r, { happiness: 2 })
  r.lastCheckinDay = day
  r.utilities.push({ id: `checkin:${day}`, day, label: 'Checked in with a friend through campus peer support', statChanges })
  return { run: r, player: ctx.player }
}

/** The next monthly fee date while the convenience account is active. */
export function nextFeeDay(r: CampaignRun) {
  if (!r.feePlan.on) return null
  const next = nextMonthStart(r.role, Math.max(r.day, r.feePlan.fromDay - 1))
  return next !== null && next >= r.feePlan.fromDay ? next : null
}

export function switchToFeeFree(ctx: Ctx): Ctx {
  if (!ctx.run.feePlan.on) return ctx
  const r = clone(ctx.run)
  r.feePlan = { ...r.feePlan, on: false }
  if (r.role === 'college') r.flags.bank_plan = 'switched_fee_free'
  r.utilities.push({ id: `bank:${r.day}:${r.utilities.length}`, day: utilityDay(r), label: 'Switched to fee-free checking (no more monthly fee)', statChanges: {} })
  return { run: r, player: ctx.player }
}

/** College: first summer pay date not yet paid; a placement switch takes effect from there. */
export function nextUnpaidSummerPay(r: CampaignRun) {
  return nextInSeries(Math.max(r.day, SUMMER_PAY.first - 1), SUMMER_PAY)
}

export function switchSummerRole(ctx: Ctx, placement: string): Ctx {
  const r0 = ctx.run
  if (r0.role !== 'college' || !r0.flags.summer_mode || !(placement in SUMMER_ROLES) || r0.flags.summer_mode === placement) return ctx
  const from = nextUnpaidSummerPay(r0)
  if (from === null) return ctx
  const r = clone(r0)
  r.summerRoles = r.summerRoles.filter((s) => s.fromDay < from)
  r.summerRoles.push({ role: placement, cents: SUMMER_ROLES[placement], fromDay: from })
  r.flags.summer_mode = placement
  r.flags.summer_pay = SUMMER_ROLES[placement] / 100
  r.utilities.push({ id: `role:${placement}:${from}`, day: utilityDay(r), label: `Switched to ${summerPlace(placement)} from ${dayLabel('college', from)}`, statChanges: {} })
  return { run: r, player: ctx.player }
}

// ── Look-ahead for the notebook ────────────────────────────────────────────

export interface Upcoming {
  day: number
  cents: number
  label: string
  account: AccountId
}

export function upcomingIncome(r: CampaignRun): Upcoming[] {
  const after = Math.max(r.day, -1)
  const out: Upcoming[] = []
  for (const s of ROLES[r.role].series) {
    if (s.kind !== 'income') continue
    const d = nextInSeries(after, s)
    if (d !== null) out.push({ day: d, cents: s.payroll ? payOn(r, s.cents, d) : s.cents, label: s.label, account: s.account })
  }
  if (r.role === 'college') {
    const d = nextInSeries(after, SUMMER_PAY)
    const role = d !== null ? (summerRoleOn(r, d) ?? (r.flags.summer_mode ? { role: String(r.flags.summer_mode), cents: SUMMER_ROLES[String(r.flags.summer_mode)] } : null)) : null
    if (d !== null && role) out.push({ day: d, cents: role.cents, label: `Summer pay: ${summerPlace(role.role)}`, account: 'checking' })
  }
  for (const p of r.pending) out.push({ day: p.dueDay, cents: p.cents, label: p.label, account: p.account })
  return out.sort((a, b) => a.day - b.day)
}

export function upcomingBills(r: CampaignRun): Upcoming[] {
  const after = Math.max(r.day, -1)
  const out: Upcoming[] = []
  for (const s of ROLES[r.role].series) {
    if (s.kind !== 'bill') continue
    const d = nextInSeries(after, s)
    if (d !== null) out.push({ day: d, cents: s.cents, label: s.label, account: s.account })
  }
  const fee = nextFeeDay(r)
  if (fee !== null) out.push({ day: fee, cents: ROLES[r.role].fee.cents, label: 'Monthly account fee', account: ROLES[r.role].fee.account })
  return out.sort((a, b) => a.day - b.day)
}

export { pricesOn, type Bucket }
