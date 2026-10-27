import { describe, expect, it } from 'vitest'
import { sceneExtras } from '../callbacks'
import { calendars, dayOfYear } from '../calendar'
import { eventsByRole, getEvent } from '../content'
import {
  chooseOption,
  choiceDeltas,
  continueRun,
  previewState,
  progress,
  resolveDeadline,
  resolveShortfall,
  switchToFeeFree,
  upcomingBills,
  type Ctx,
} from '../engine'
import { previewChoice } from '../money'
import { arrearsTotal, bal, cashTotal, chapterStart, createRun, receivablesTotal } from '../run'
import type { RoleId } from '../types'
import { force, newCtx, openAt, play, reconciles } from './helpers'

const md = (m: number, d: number) => dayOfYear(m, d)
const indexOf = (id: string) => chapterStart(getEvent(id).chapter) + getEvent(id).slot - 1
const at = (role: RoleId, id: string, seed = 3, ctx: Ctx = newCtx(role, seed)) => openAt(force(ctx, id), indexOf(id), { shortfall: 'transfer' })
const find = (role: RoleId, pred: (e: ReturnType<typeof getEvent>) => boolean) => eventsByRole[role].find(pred)!

describe('working adult', () => {
  it('starts with $900/$600, no debt, and a first-bill gap it asks about', () => {
    const r = createRun('adult', 1)
    expect(r.accounts).toEqual({ checking: 90000, savings: 60000, tax_reserve: 0 })
    expect(r.debt).toBe(0)
    let ctx = progress(newCtx('adult', 1, { index: 1, day: md(1, 5) }))
    expect(ctx.run.pause).toMatchObject({ kind: 'shortfall', billCents: 130000, day: md(1, 8) })
    ctx = resolveShortfall(ctx, { kind: 'transfer' })
    expect(bal(ctx.run, 'savings')).toBe(60000 - 40000)
    expect(arrearsTotal(ctx.run)).toBe(0)
    expect(reconciles(ctx.run)).toBe(true)
  })

  it('applies a confirmed raise only to future paydays, once', () => {
    const work = find('adult', (e) => e.choices.some((c) => 'negotiation.salary_delta_cents' in c.flags))
    let ctx = at('adult', work.id)
    const eventDay = calendars.adult.toDay(1, work.date)
    ctx = chooseOption(ctx, 'A')
    expect(ctx.run.payroll).toHaveLength(1)
    ctx = play(continueRun(ctx), { shortfall: 'transfer' })
    const pays = ctx.run.ledger.filter((l) => /^pay:\d+$/.test(l.id))
    expect(pays.filter((l) => l.day <= eventDay).every((l) => l.accounts.checking === 150000)).toBe(true)
    expect(pays.filter((l) => l.day > eventDay).every((l) => l.accounts.checking === 160000)).toBe(true)
    expect(new Set(pays.map((l) => l.id)).size).toBe(pays.length)
  })
})

describe('business owner', () => {
  it('records each client receipt once as revenue; reserve and draw are transfers that conserve cash', () => {
    const ctx = play(newCtx('business', 2), { stopAt: 3, shortfall: 'transfer' })
    const day = md(1, 15)
    const onDay = ctx.run.ledger.filter((l) => l.day === day)
    const receipt = onDay.filter((l) => l.id === `receipt:${day}`)
    expect(receipt).toHaveLength(1)
    expect(receipt[0]).toMatchObject({ kind: 'earning', accounts: { business_cash: 500000 } })
    const tax = onDay.find((l) => l.id === `tax:${day}`)!
    const draw = onDay.find((l) => l.id === `draw:${day}`)!
    expect(tax.kind).toBe('transfer')
    expect(draw.kind).toBe('transfer')
    expect(Object.values(tax.accounts).reduce((s, v) => s! + v!, 0)).toBe(0)
    expect(Object.values(draw.accounts).reduce((s, v) => s! + v!, 0)).toBe(0)
    expect(tax.accounts.tax_reserve).toBe(50000)
    expect(draw.accounts.checking).toBe(150000)
    expect(onDay.filter((l) => l.kind === 'earning')).toHaveLength(1)
    expect(reconciles(ctx.run)).toBe(true)
  })

  it('settles personal arrears from the owner draw and business arrears from the receipt', () => {
    let ctx = progress(newCtx('business', 2, { index: 1, day: md(1, 5), accounts: { checking: 100000, savings: 0, business_cash: 100000, business_reserve: 0, tax_reserve: 0 } }))
    // Jan 8: studio costs $2,500 with $1,000 in operating cash; the owner could contribute personal money.
    expect(ctx.run.pause).toMatchObject({ kind: 'shortfall', account: 'business_cash' })
    ctx = resolveShortfall(ctx, { kind: 'decline' })
    expect(arrearsTotal(ctx.run, 'business')).toBe(150000)
    // Personal necessities $1,300 with $1,000: no savings, so the rest is recorded.
    expect(arrearsTotal(ctx.run, 'personal')).toBe(30000)
    ctx = play(ctx, { stopAt: 3 })
    const settles = ctx.run.ledger.filter((l) => l.kind === 'settlement')
    expect(settles.find((l) => l.id === `receipt:${md(1, 15)}:settle`)!.arrears.business).toBe(-150000)
    expect(settles.find((l) => l.id === `draw:${md(1, 15)}:settle`)!.arrears.personal).toBe(-30000)
    expect(arrearsTotal(ctx.run)).toBe(0)
    expect(reconciles(ctx.run)).toBe(true)
  })

  it('offers a confirmed owner contribution for a studio shortfall, never automatically', () => {
    let ctx = progress(newCtx('business', 2, { index: 1, day: md(1, 5), accounts: { checking: 400000, savings: 0, business_cash: 100000, business_reserve: 0, tax_reserve: 0 } }))
    expect(ctx.run.pause).toMatchObject({ account: 'business_cash' })
    expect(bal(ctx.run, 'checking')).toBe(400000)
    const before = cashTotal(ctx.run)
    ctx = resolveShortfall(ctx, { kind: 'owner' })
    const contribution = ctx.run.ledger.find((l) => l.label.startsWith('Owner contribution'))!
    expect(contribution).toMatchObject({ kind: 'transfer', accounts: { checking: -150000, business_cash: 150000 } })
    expect(cashTotal(ctx.run)).toBe(before - 250000 - 130000)
  })
})

describe('basketball player', () => {
  it('stops team pay after August while living commitments continue', () => {
    const ctx = play(newCtx('athlete', 4))
    const pays = ctx.run.ledger.filter((l) => /^pay:\d+$/.test(l.id))
    expect(pays.every((l) => l.day <= md(8, 31))).toBe(true)
    expect(pays).toHaveLength(17)
    const bills = ctx.run.ledger.filter((l) => /^bills:\d+$/.test(l.id))
    expect(bills.some((l) => l.day > md(9, 1))).toBe(true)
    expect(bills).toHaveLength(25)
    expect(reconciles(ctx.run)).toBe(true)
  })
})

describe('shared mechanics on the new lives', () => {
  it('a completed task is a receivable until its due date, then settles once', () => {
    const work = find('athlete', (e) => e.choices.some((c) => c.money.some((m) => m.op === 'schedule_income')))
    let ctx = at('athlete', work.id)
    const choice = work.choices.find((c) => c.money.some((m) => m.op === 'schedule_income'))!
    const cash = cashTotal(ctx.run)
    ctx = chooseOption(ctx, choice.id)
    const spend = choice.money.filter((m) => m.op === 'spend').reduce((s, m) => s + m.cents, 0)
    expect(cashTotal(ctx.run)).toBe(cash - spend)
    expect(receivablesTotal(ctx.run)).toBeGreaterThan(0)
    const due = ctx.run.pending[0].dueDay
    expect(due).toBe(calendars.athlete.toDay(1, work.date) + 7)
    ctx = play(continueRun(ctx), { stopAt: indexOf(work.id) + 3 })
    expect(ctx.run.ledger.filter((l) => l.id === ctx.run.ledger.find((x) => x.id.startsWith('inc:'))?.id)).toHaveLength(1)
    expect(ctx.run.pending).toHaveLength(0)
  })

  it('the fee plan follows the latest account choice and can be switched off', () => {
    const bank = find('adult', (e) => e.choices.some((c) => c.flags['banking.fee_account'] === true))
    let ctx = at('adult', bank.id)
    const fee = bank.choices.find((c) => c.flags['banking.fee_account'] === true)!
    ctx = chooseOption(ctx, fee.id)
    expect(ctx.run.feePlan.on).toBe(true)
    expect(upcomingBills(ctx.run).some((b) => b.label === 'Monthly account fee' && b.cents === 500)).toBe(true)
    ctx = play(continueRun(ctx), { stopAt: indexOf(bank.id) + 5, shortfall: 'transfer' })
    const charged = ctx.run.ledger.filter((l) => l.kind === 'fee').length
    expect(charged).toBeGreaterThan(0)
    ctx = switchToFeeFree(ctx)
    ctx = play(ctx, { stopAt: 25, shortfall: 'transfer' })
    expect(ctx.run.ledger.filter((l) => l.kind === 'fee')).toHaveLength(charged)
  })

  it('a work event that begins with high stress adds the named +1 once, to accepting choices only', () => {
    const work = find('business', (e) => e.callbacks.some((c) => c.type === 'workload_modifier'))
    let ctx = force(newCtx('business', 5), work.id)
    ctx = openAt(ctx, indexOf(work.id), { shortfall: 'transfer' })
    ctx = { ...ctx, run: { ...ctx.run, current: { ...ctx.run.current!, workload: true } } }
    const a = work.choices.find((c) => c.id === 'A')!
    const c = work.choices.find((x) => x.id === 'C')!
    expect(choiceDeltas(ctx.run, work, a).deltas.stress).toBe((a.stats.stress ?? 0) + 1)
    expect(choiceDeltas(ctx.run, work, c).deltas.stress).toBe(c.stats.stress)
    expect(sceneExtras(ctx.run, work).workload).not.toBeNull()
  })

  it('repairs pause for pickup after three days; supported loans can be extended once', () => {
    const repair = find('adult', (e) => e.callbacks.some((c) => c.type === 'utility_deadline'))
    let ctx = at('adult', repair.id)
    ctx = chooseOption(ctx, 'D')
    expect(ctx.run.deadlines[0]).toMatchObject({ kind: 'loan_review', day: calendars.adult.toDay(1, repair.date) + 30 })
    ctx = play(continueRun(ctx), { shortfall: 'transfer', stopAt: 39, extend: true })
    const d = ctx.run.deadlines[0]
    expect(d.extended).toBe(true)
    let ctx2 = at('adult', repair.id, 9)
    ctx2 = chooseOption(ctx2, 'A')
    ctx2 = continueRun(ctx2)
    let guard = 0
    while (!ctx2.run.pause && guard++ < 5) ctx2 = progress(ctx2)
    expect(ctx2.run.pause).toMatchObject({ kind: 'deadline' })
    expect(ctx2.run.day).toBe(calendars.adult.toDay(1, repair.date) + 2)
    ctx2 = resolveDeadline(ctx2)
    expect(ctx2.run.deadlines[0].resolved).toBe(true)
  })

  it('needs the brokerage lesson to buy and real units to sell', () => {
    const r = createRun('adult', 1)
    const buyLater = find('adult', (e) => e.choices.some((c) => c.money.some((m) => m.op === 'buy_up_to' && m.requiresBrokerage)))
    const choice = buyLater.choices.find((c) => c.money.some((m) => m.op === 'buy_up_to'))!
    expect(previewChoice(previewState({ ...r, accounts: { checking: 500000, savings: 0 } }), choice).ok).toBe(false)
    const sell = find('adult', (e) => e.choices.some((c) => c.money.some((m) => m.op === 'sell_up_to')))
    const sellChoice = sell.choices.find((c) => c.money.some((m) => m.op === 'sell_up_to'))!
    expect(previewChoice(previewState(r), sellChoice).ops.find((o) => o.op.op === 'sell_up_to')!.reason).toMatch(/don't own/)
    const intro = find('adult', (e) => e.mode === 'brokerage')
    const buyNow = intro.choices.find((c) => c.money.some((m) => m.op === 'buy_up_to'))!
    expect(previewChoice(previewState({ ...r, accounts: { checking: 500000, savings: 0 } }), buyNow).ok).toBe(true)
  })

  it('names the prior choice only when its flags were actually set', () => {
    const later = find('adult', (e) => e.callbacks.some((c) => c.type === 'prior_choice_text'))
    const cb = later.callbacks.find((c) => c.type === 'prior_choice_text')!
    if (cb.type !== 'prior_choice_text') throw new Error('unexpected')
    const r = createRun('adult', 1)
    expect(sceneExtras(r, later).lines.join(' ')).not.toContain('Earlier, in')
    const prior = getEvent(cb.eventId)
    const withFlag = prior.choices.find((c) => cb.flags.some((f) => f in c.flags))!
    const history = [{ index: 0, chapter: 1, slot: 1, eventId: prior.id, title: prior.title, lessonKey: 'x', day: 4, mode: 'new' as const, choiceId: withFlag.id, choiceLabel: withFlag.label, rationale: '', statChanges: {}, statsAfter: {}, ledgerIds: [], notes: [] }]
    expect(sceneExtras({ ...r, history }, later).lines.join(' ')).toContain('Earlier, in')
  })

  it('records a seven-day delivery as an item-ready notice with no second charge', () => {
    const compare = find('adult', (e) => e.choices.some((c) => Object.entries(c.flags).some(([k, v]) => k.endsWith('purchase_timing') && v === 'delayed')))
    let ctx = at('adult', compare.id, 4, newCtx('adult', 4, { accounts: { checking: 900000, savings: 60000, tax_reserve: 0 } }))
    const delayed = compare.choices.find((c) => Object.values(c.flags).includes('delayed'))!
    ctx = chooseOption(ctx, delayed.id)
    const purchases = ctx.run.ledger.filter((l) => l.eventId === compare.id && l.kind === 'purchase').length
    ctx = play(continueRun(ctx), { stopAt: indexOf(compare.id) + 3, shortfall: 'transfer' })
    expect(ctx.run.utilities.some((u) => u.id === `ready:${compare.id}:ready`)).toBe(true)
    expect(ctx.run.ledger.filter((l) => l.eventId === compare.id && l.kind === 'purchase')).toHaveLength(purchases)
  })
})
