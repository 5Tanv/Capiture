import { describe, expect, it } from 'vitest'
import { PREP_LINE, prepModifierApplies, sceneExtras } from '../callbacks'
import { calendars, dayLabel, inSeries, seriesCount } from '../calendar'
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
  switchSummerRole,
  switchToFeeFree,
  takeRecovery,
  type Ctx,
} from '../engine'
import { totalCoins } from '../mastery'
import { previewChoice } from '../money'
import { ROLES } from '../roles'
import { bal, chapterOf, createRun, flagOn, netWorth } from '../run'
import { finishLesson, firstFree, force, newCtx, openAt, pick, play, reconciles } from './helpers'

const cal = calendars.college
const roundTrip = (ctx: Ctx): Ctx => JSON.parse(JSON.stringify(ctx))

describe('college calendar', () => {
  it('maps dates on the Aug-to-Aug year', () => {
    expect(cal.toDay(1, '08-25')).toBe(0)
    expect(cal.toDay(1, '09-08')).toBe(14)
    expect(cal.toDay(2, '06-01')).toBe(280)
    expect(cal.toDay(2, '08-25')).toBe(365)
    expect(dayLabel('college', 14, true)).toBe('Sep 8, Year 1')
  })
  it('has 19 paydays, 39 academic and 13 summer weekly charges', () => {
    const [pay, need, summer] = ROLES.college.series
    expect([seriesCount(pay), seriesCount(need), seriesCount(summer)]).toEqual([19, 39, 13])
  })
})

describe('college v2 corrections', () => {
  it('starts with $250/$150 and zero debt', () => {
    const r = createRun('college', 1)
    expect(r.accounts).toEqual({ checking: 25000, savings: 15000 })
    expect(r.debt).toBe(0)
    expect(netWorth(r)).toBe(40000)
  })
  it('teaches the canonical catalog lesson in its events', () => {
    let ctx = progress(newCtx('college', 7))
    expect(ctx.run.current).toMatchObject({ eventId: 'C101', mode: 'new', stage: 'learn' })
    const [q1, q2] = lessonForEvent(getEvent('C101')).quiz
    expect(q1.id).toBe('budget.v1.q1')
    ctx = answerQuestion(ctx, q1.id, (q1.answer_index + 1) % 3, 1)
    ctx = answerQuestion(ctx, q1.id, q1.answer_index, 2)
    ctx = answerQuestion(ctx, q2.id, q2.answer_index, 3)
    expect(totalCoins(ctx.player)).toBe(5)
    ctx = acknowledgeQuestion(acknowledgeQuestion(ctx, q1.id), q2.id)
    expect(ctx.run.current!.stage).toBe('decide')
  })
})

describe('college calendar processing', () => {
  it('makes same-day earnings available for that day’s bills', () => {
    const ctx = progress(newCtx('college', 1, { accounts: { checking: 0, savings: 0 }, index: 2, day: 13 }))
    expect(ctx.run.current!.eventId).toBe('C103')
    expect(bal(ctx.run, 'checking')).toBe(18000 - 6000)
    expect(ctx.run.arrears).toEqual([])
  })

  it('charges the fee only after choosing the fee account, from the next month', () => {
    let ctx = openAt(newCtx('college', 3), 1)
    expect(ctx.run.current!.eventId).toBe('C102')
    ctx = chooseOption(ctx, 'C')
    expect(ctx.run.feePlan).toEqual({ on: true, fromDay: 7 })
    ctx = play(continueRun(ctx), { stopAt: 6 })
    expect(ctx.run.ledger.filter((l) => l.kind === 'fee').map((l) => l.day)).toEqual([7, 37])
    ctx = switchToFeeFree(ctx)
    ctx = play(ctx, { stopAt: 12 })
    expect(ctx.run.ledger.filter((l) => l.kind === 'fee')).toHaveLength(2)
  })

  it('asks before using savings; declining records arrears that the next pay settles first', () => {
    let ctx = progress(newCtx('college', 1, { accounts: { checking: 1000, savings: 10000 }, index: 2, day: 6 }))
    expect(ctx.run.pause).toMatchObject({ kind: 'shortfall', billCents: 6000, account: 'checking' })
    ctx = resolveShortfall(ctx, { kind: 'decline' })
    expect(bal(ctx.run, 'savings')).toBe(10000)
    expect(ctx.run.ledger.find((l) => l.kind === 'settlement')!.arrears.personal).toBe(-5000)
    expect(ctx.run.arrears).toEqual([])
    expect(reconciles(ctx.run)).toBe(true)
  })

  it('pauses for the laptop pickup and continues after it', () => {
    let ctx = openAt(newCtx('college', 8), 4)
    expect(ctx.run.current!.eventId).toBe('C107')
    ctx = chooseOption(ctx, 'A')
    ctx = progress(continueRun(ctx))
    expect(ctx.run.pause).toEqual({ kind: 'deadline', deadlineId: 'laptop-pickup' })
    ctx = resolveDeadline(ctx)
    expect(ctx.run.current!.index).toBe(5)
  })

  it('pays summer wages from the chosen placement and switches only future periods', () => {
    let ctx = play(newCtx('college', 13), { stopAt: 32, choose: (ev, av, c) => (ev.id === 'C225' ? av.find((x) => x.id === 'A')! : firstFree(ev, av, c)) })
    expect(ctx.run.ledger.find((l) => l.id === `summerpay:${cal.toDay(2, '06-15')}`)?.accounts.checking).toBe(18000)
    ctx = switchSummerRole(ctx, 'local')
    ctx = play(ctx)
    const pays = ctx.run.ledger.filter((l) => l.id.startsWith('summerpay:')).map((l) => l.accounts.checking)
    expect(pays[0]).toBe(18000)
    expect(pays[pays.length - 1]).toBe(22000)
    expect(pays).toHaveLength(6)
  })
})

describe('college story callbacks', () => {
  it('applies the preparation modifier once, only with earlier practice', () => {
    let ctx = play(force(newCtx('college', 3), 'C123'), { stopAt: 13 })
    ctx = { ...ctx, run: { ...ctx.run, flags: { ...ctx.run.flags, peer_study: true } } }
    ctx = finishLesson(progress(ctx))
    expect(prepModifierApplies(ctx.run, 'C123')).toBe(true)
    expect(sceneExtras(ctx.run, getEvent('C123')).lines).toContain(PREP_LINE)
    const stress = ctx.run.stats.stress!
    ctx = chooseOption(ctx, 'A')
    expect(ctx.run.stats.stress).toBe(Math.max(0, stress - 3))
    expect(flagOn(ctx.run, 'prep_modifier_used')).toBe(true)
  })

  it('uses the neutral scene when optional flags are absent', () => {
    const r = createRun('college', 1)
    expect(sceneExtras(r, getEvent('C123')).lines).not.toContain(PREP_LINE)
    expect(sceneExtras(r, getEvent('C109')).lines.join(' ')).not.toContain('welcome dinner')
    expect(sceneExtras({ ...r, flags: { met_sam: true } }, getEvent('C109')).lines.join(' ')).toContain('welcome dinner')
    expect(sceneExtras(r, getEvent('C201')).lines.join(' ')).not.toContain('scholarship')
    expect(sceneExtras(r, getEvent('C313')).lines.join(' ')).toContain('hypothetical')
  })

  it('offers the C125 draft revision before the reflection, once', () => {
    let ctx = play(force(newCtx('college', 6), 'C124'), { stopAt: 14, choose: pick('B') })
    expect(ctx.run.flags.tight_deadline).toBe(true)
    ctx = finishLesson(progress(ctx))
    expect(choiceBlockers(ctx.run)).toEqual(['draft'])
    expect(chooseOption(ctx, 'A')).toBe(ctx)
    const acad = ctx.run.stats.academics!
    ctx = resolveDraft(ctx, 'revise')
    expect(ctx.run.stats.academics).toBe(Math.min(100, acad + 2))
    expect(resolveDraft(ctx, 'revise')).toBe(ctx)
  })

  it('requires loaners to be resolved at the chapter finale; numbering restarts in chapter 2', () => {
    let ctx = openAt(newCtx('college', 10), 4)
    ctx = chooseOption(ctx, 'D')
    ctx = openAt(continueRun(ctx), 14)
    ctx = chooseOption(ctx, 'A')
    expect(dueItems(ctx.run).map((i) => i.id)).toContain('laptop-loaner')
    expect(continueRun(ctx)).toBe(ctx)
    ctx = resolveItem(ctx, 'laptop-loaner', 'renew')
    for (const it of dueItems(ctx.run)) ctx = resolveItem(ctx, it.id, 'return')
    ctx = continueRun(ctx)
    expect([ctx.run.index, chapterOf(ctx.run.index), ctx.run.positions[ctx.run.index].slot]).toEqual([15, 2, 1])
  })

  it('gates sales on actual holdings and purchases on the brokerage lesson', () => {
    const r = createRun('college', 1)
    expect(previewChoice(previewState(r), getEvent('C313').choices[1]).ok).toBe(false)
    const buy = previewChoice(previewState({ ...r, accounts: { checking: 20000, savings: 0 } }), getEvent('C219').choices[0])
    expect(buy.ok).toBe(false)
    expect(buy.ops[0].reason).toMatch(/brokerage/)
  })
})

describe('college persistence', () => {
  it('never applies a choice twice, including after a reload', () => {
    let ctx = finishLesson(progress(newCtx('college', 1)))
    ctx = chooseOption(ctx, 'A')
    const once = bal(ctx.run, 'checking')
    expect(chooseOption(ctx, 'A')).toBe(ctx)
    const reloaded = roundTrip(ctx)
    reloaded.run.current!.stage = 'decide'
    expect(bal(chooseOption(reloaded, 'B').run, 'checking')).toBe(once)
  })

  it('replaying a processed date changes nothing', () => {
    const ctx = progress(play(newCtx('college', 14), { stopAt: 6 }))
    const rewound = roundTrip(ctx)
    rewound.run.current = null
    rewound.run.day = 0
    expect(progress(rewound).run.ledger).toHaveLength(ctx.run.ledger.length)
  })

  it('caps recovery to once per seven in-game days', () => {
    let ctx = progress(newCtx('college', 1, { stats: { happiness: 50, stress: 80, academics: 70 } }))
    ctx = takeRecovery(ctx)
    expect(ctx.run.stats.stress).toBe(76)
    expect(takeRecovery(ctx)).toBe(ctx)
  })

  it('every college series date is processed exactly once in a full run', () => {
    const ctx = play(newCtx('college', 5))
    const ids = ctx.run.ledger.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.filter((i) => /^pay:\d+$/.test(i))).toHaveLength(19)
    expect(ids.filter((i) => /^summerpay:\d+$/.test(i))).toHaveLength(6)
    expect(ids.filter((i) => /^need:\d+$/.test(i))).toHaveLength(52)
    expect(inSeries(14, ROLES.college.series[0])).toBe(true)
    expect(reconciles(ctx.run)).toBe(true)
  })
})
