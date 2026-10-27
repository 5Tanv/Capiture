import { describe, expect, it } from 'vitest'
import { cleanName, isPlayableRun, migrate, migrateCollegeRun, rekeyMastery, NAME_MAX } from '../../lib/saveStore'
import { getEvent, lessonForEvent } from '../content'
import { progress } from '../engine'
import { receiptCoins, totalCoins } from '../mastery'
import type { CampaignRun } from '../run'
import { newCtx, play, reconciles } from './helpers'

/** Turn a current college run back into the version 2 save shape (with the seeded loan). */
function asOldSave(run: CampaignRun) {
  return {
    ...run,
    version: 1,
    checking: run.accounts.checking,
    savings: run.accounts.savings,
    loan: 500000,
    opening: { checking: run.opening.checking, savings: run.opening.savings },
    arrears: run.arrears.map(({ bucket: _b, ...a }) => a),
    ledger: run.ledger.map((l) => ({ id: l.id, day: l.day, kind: l.kind, label: l.label, checking: l.accounts.checking ?? 0, savings: l.accounts.savings ?? 0, arrears: l.arrears.personal ?? 0, eventId: l.eventId, detail: l.detail })),
    history: run.history.map(({ lessonKey: _k, ...h }) => ({ ...h, conceptKey: 'old@1' })),
    current: run.current && {
      ...run.current,
      quiz: Object.fromEntries(Object.entries(run.current.quiz).map(([qid, v]) => [`${run.current!.eventId}-Q${qid.endsWith('q1') ? 1 : 2}`, v])),
    },
  }
}

const oldMastery = {
  'budget@1': { completed: true, firstEventId: 'C101', receipts: { 'C101-Q1': { correct: true, coins: 5 }, 'C101-Q2': { correct: false, coins: 0 } } },
  'comparison@1': { completed: false, firstEventId: 'C104', receipts: { 'C104-Q1': { correct: true, coins: 5 } } },
  'emergency@1': { completed: true, firstEventId: 'C107', receipts: {} },
}

describe('save migration', () => {
  it('rekeys old college mastery onto canonical lessons without adding or removing coins', () => {
    const m = rekeyMastery(oldMastery)
    expect(m['budget@1']).toMatchObject({ completed: true, source: 'migrated' })
    expect(m['budget@1'].receipts['budget.v1.q1']).toMatchObject({ correct: true, coins: 5 })
    expect(m['total_cost@1'].completed).toBe(false)
    expect(m['total_cost@1'].receipts['total_cost.v1.q1'].coins).toBe(5)
    // Completed without evidence: kept completed, reward marked used, no coins invented.
    expect(m['emergency@1'].completed).toBe(true)
    expect(Object.values(m['emergency@1'].receipts).every((r) => r.coins === 0)).toBe(true)
    expect(receiptCoins(m)).toBe(10)
  })

  it('keeps the displayed FiCoin balance exactly the same through migration', () => {
    const v2 = { version: 2, lives: { freshman: { name: 'Riley', appearance: {}, customized: true } }, account: { appearance: {}, fiCoins: 1260 }, player: { mastery: oldMastery }, runs: {} }
    const v3 = migrate(v2, 1250)!
    expect(v3.version).toBe(3)
    expect(totalCoins({ coinBase: v3.account.coinBase, mastery: v3.player.mastery })).toBe(1260)
    expect(v3.lives.freshman?.name).toBe('Riley')
  })

  it('upgrades a version 1 save with the shown balance and no runs', () => {
    const v3 = migrate({ version: 1, lives: { athlete: { name: 'Ana', appearance: {}, customized: true } } }, 1250)!
    expect(v3.account.coinBase).toBe(1250)
    expect(v3.runs).toEqual({})
    expect(v3.player.mastery).toEqual({})
  })

  it('removes only the identifiable seeded college loan, without paying cash, and keeps playing', () => {
    let ctx = play(newCtx('college', 21), { stopAt: 9 })
    ctx = progress(ctx)
    const old = asOldSave(ctx.run)
    const migrated = migrateCollegeRun(JSON.parse(JSON.stringify(old)))
    expect(migrated.debt).toBe(0)
    expect(migrated.accounts).toEqual(ctx.run.accounts)
    expect(migrated.notices[0].text).toMatch(/not income/)
    expect(isPlayableRun(migrated, 'freshman')).toBe(true)
    expect(Object.keys(migrated.current!.quiz).every((q) => lessonForEvent(getEvent(migrated.current!.eventId)).quiz.some((x) => x.id === q))).toBe(true)
    expect(reconciles(migrated)).toBe(true)
    const finished = play({ run: migrated, player: ctx.player })
    expect(finished.run.finished).toBe(true)
    expect(reconciles(finished.run)).toBe(true)
    const odd = migrateCollegeRun({ ...JSON.parse(JSON.stringify(old)), loan: 123400 })
    expect(odd.debt).toBe(123400)
  })

  it('rejects damaged runs and runs that belong to another life', () => {
    const run = play(newCtx('business', 4), { stopAt: 5 }).run
    expect(isPlayableRun(JSON.parse(JSON.stringify(run)), 'entrepreneur')).toBe(true)
    expect(isPlayableRun(run, 'athlete')).toBe(false)
    expect(isPlayableRun({ ...run, positions: run.positions.slice(1) }, 'entrepreneur')).toBe(false)
    expect(isPlayableRun({ ...run, accounts: { ...run.accounts, checking: -1 } }, 'entrepreneur')).toBe(false)
    expect(isPlayableRun(null, 'entrepreneur')).toBe(false)
  })
})

describe('two open tabs', () => {
  it('merges receipts on write instead of overwriting, and keeps the further-advanced run', async () => {
    const store = new Map<string, string>()
    const g = globalThis as unknown as { window?: unknown }
    g.window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } }
    const { writeSaved, readStoredProgress } = await import('../../lib/saveStore')
    const { sampleLives } = await import('../../data/lives')
    const { sampleAccount } = await import('../../data/account')
    const { answerLesson } = await import('../mastery')
    const { lessonsById } = await import('../content')
    const budget = lessonsById.budget
    const [q1] = budget.quiz
    const base = { freshman: newCtx('college', 1).run, professional: newCtx('adult', 1).run, entrepreneur: newCtx('business', 1).run, athlete: newCtx('athlete', 1).run }
    // Tab A answers correctly and advances the adult run; tab B, still stale, answers the same question wrong.
    const tabA = answerLesson({ coinBase: 0, mastery: {} }, budget, q1.id, q1.answer_index, 10, 'learn')
    const tabB = answerLesson({ coinBase: 0, mastery: {} }, budget, q1.id, (q1.answer_index + 1) % 3, 20, 'learn')
    writeSaved(sampleLives, sampleAccount, 0, tabA.mastery, { ...base, professional: { ...base.professional, rev: 5 } })
    writeSaved(sampleLives, sampleAccount, 0, tabB.mastery, { ...base, professional: { ...base.professional, rev: 2 } })
    const stored = readStoredProgress()!
    expect(Object.keys(stored.mastery['budget@1'].receipts)).toEqual([q1.id])
    expect(stored.mastery['budget@1'].receipts[q1.id]).toMatchObject({ correct: true, coins: 5, at: 10 })
    expect(totalCoins({ coinBase: 0, mastery: stored.mastery })).toBe(5)
    expect(stored.runs.professional!.rev).toBe(5)
    delete g.window
  })
})

describe('default skin-tone swap', () => {
  it('moves saved lives off their old default tone once, keeping every other choice', async () => {
    const store = new Map<string, string>()
    const g = globalThis as unknown as { window?: unknown }
    g.window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } }
    const { loadSaved, writeSaved } = await import('../../lib/saveStore')
    const { sampleLives } = await import('../../data/lives')
    const { sampleAccount } = await import('../../data/account')
    const { lifePresets } = await import('../../sprites/catalog')
    const look = (id: 'freshman' | 'athlete' | 'professional', skin: string) => ({ ...lifePresets[id], skin, glasses: 'round', hair: 'bob' })
    const lives = {
      freshman: { name: 'rfr', appearance: look('freshman', 'beige'), customized: true },
      athlete: { name: 'Marcus Hill', appearance: look('athlete', 'deep'), customized: true },
      professional: { name: 'Maya Torres', appearance: look('professional', 'beige'), customized: true },
    }
    store.set('filife.save.v3', JSON.stringify({ version: 3, lives, account: { appearance: sampleAccount.appearance, coinBase: 0 }, player: { mastery: {} }, runs: {} }))
    const loaded = loadSaved(sampleLives, sampleAccount)
    expect(loaded.lives.freshman.appearance).toMatchObject({ skin: 'deep', glasses: 'round', hair: 'bob' })
    expect(loaded.lives.athlete.appearance).toMatchObject({ skin: 'beige', glasses: 'round', hair: 'bob' })
    expect(loaded.lives.professional.appearance.skin).toBe('beige')
    expect(loaded.lives.freshman.name).toBe('rfr')

    // Once written back, a tone picked later is the player's choice and stays.
    writeSaved({ ...loaded.lives, freshman: { ...loaded.lives.freshman, appearance: { ...loaded.lives.freshman.appearance, skin: 'beige' } } }, loaded.account, 0, {}, {} as never)
    expect(loadSaved(sampleLives, sampleAccount).lives.freshman.appearance.skin).toBe('beige')
    delete g.window
  })
})

describe('names', () => {
  it('trims, keeps Unicode, caps at 32 characters and falls back when empty', () => {
    expect(cleanName('  Zoë   Ōkafor  ', 'Owner')).toBe('Zoë Ōkafor')
    expect(cleanName('   ', 'Owner')).toBe('Owner')
    expect(cleanName(42, 'Rookie')).toBe('Rookie')
    expect([...cleanName('名'.repeat(40), 'x')]).toHaveLength(NAME_MAX)
    expect(cleanName('<b>Sam</b>', 'x')).toBe('<b>Sam</b>') // kept as text; React renders it escaped
  })
})
