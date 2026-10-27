import { describe, expect, it } from 'vitest'
import catalogRaw from '../content/learn-catalog.json'
import { RAW_PACKS, categories, eventsById, eventsByRole, getEvent, lessonForEvent, lessons, lessonsById } from '../content'
import { ROLES } from '../roles'
import { selectPositions } from '../selection'
import { validateCatalog, validatePack } from '../validate'
import { ALL_ROLES } from './helpers'

const versions = new Map(lessons.map((l) => [l.id, l.version]))

describe('campaign packs', () => {
  it.each(ALL_ROLES)('%s passes the runtime validator', (role) => {
    expect(validatePack(RAW_PACKS[role], ROLES[role], versions)).toEqual([])
  })

  it.each(ALL_ROLES)('%s has 70 events in 25/25/20 banks with 20 required (8/7/5)', (role) => {
    const evs = eventsByRole[role]
    expect(new Set(evs.map((e) => e.id)).size).toBe(70)
    expect([1, 2, 3].map((c) => evs.filter((e) => e.chapter === c).length)).toEqual([25, 25, 20])
    expect([1, 2, 3].map((c) => evs.filter((e) => e.chapter === c && e.required).length)).toEqual([8, 7, 5])
    expect(evs.flatMap((e) => e.choices)).toHaveLength(280)
  })

  it('has 280 events and 1,120 decisions in total', () => {
    expect(Object.keys(eventsById)).toHaveLength(280)
  })

  it.each(ALL_ROLES)('%s: every event has a choice that spends nothing and links a catalog lesson', (role) => {
    for (const e of eventsByRole[role]) {
      expect(e.choices.some((c) => !c.money.some((m) => m.op === 'spend'))).toBe(true)
      expect(lessonForEvent(e)).toBeDefined()
      expect(lessonForEvent(e).version).toBe(e.lessonVersion)
    }
  })

  it('uses name tokens and no earlier planning names in protagonist text', () => {
    const tokens = { college: '{collegeName}', adult: '{adultName}', business: '{businessName}', athlete: '{athleteName}' }
    for (const role of ALL_ROLES) {
      const text = eventsByRole[role].map((e) => e.scenario).join(' ')
      expect(text).toContain(tokens[role])
      expect(text).not.toMatch(/\b(Jordan|Maya|Dev Patel|Marcus)\b/)
    }
  })

  it('starts college with zero debt and treats the $5,000 loan as hypothetical', () => {
    expect(ROLES.college.initialAccounts).toEqual({ checking: 25000, savings: 15000 })
    expect(getEvent('C221').scenario).toMatch(/hypothetical|practice comparison/)
  })

  it('rejects a broken pack and a broken catalog', () => {
    const bad = structuredClone(RAW_PACKS.adult) as { events: { choices: { money: unknown[]; delayed_effects: unknown[] }[]; lesson_id: string }[] }
    bad.events[0].choices[0].money.push({ type: 'teleport', amount_cents: 1 })
    bad.events[1].lesson_id = 'not_a_lesson'
    const withIncome = bad.events.find((e) => e.choices.some((c) => c.delayed_effects.length))!
    withIncome.choices.find((c) => c.delayed_effects.length)!.delayed_effects = []
    const errors = validatePack(bad, ROLES.adult, versions)
    expect(errors.some((e) => e.includes('unknown operation'))).toBe(true)
    expect(errors.some((e) => e.includes('not in the catalog'))).toBe(true)
    expect(errors.some((e) => e.includes('does not mirror'))).toBe(true)

    const badCat = structuredClone(catalogRaw) as { lessons: { prerequisites: string[]; quiz: unknown[] }[] }
    badCat.lessons[0].prerequisites = [lessons[1].id]
    badCat.lessons[1].prerequisites = [lessons[0].id]
    badCat.lessons[2].quiz.pop()
    const lessonOf = new Map(Object.values(eventsById).map((e) => [e.id, e.lessonId]))
    const catErrors = validateCatalog(badCat, lessonOf)
    expect(catErrors.some((e) => e.includes('cycle'))).toBe(true)
    expect(catErrors.some((e) => e.includes('two questions'))).toBe(true)
  })
})

describe('Learn catalog', () => {
  it('has 80 lessons in 19 populated categories, each lesson in exactly one', () => {
    expect(lessons).toHaveLength(80)
    expect(categories).toHaveLength(19)
    expect(categories.every((c) => c.lessonIds.length > 0)).toBe(true)
    const placed = categories.flatMap((c) => c.lessonIds)
    expect(new Set(placed).size).toBe(80)
    expect(placed).toHaveLength(80)
  })

  it('has 160 unique canonical questions and an 800-coin ceiling', () => {
    const qids = lessons.flatMap((l) => l.quiz.map((q) => q.id))
    expect(new Set(qids).size).toBe(160)
    expect(qids.length * 5).toBe(800)
  })

  it('links every related event back to an event that teaches the lesson', () => {
    for (const l of lessons) for (const ref of l.eventRefs) expect(getEvent(ref.eventId).lessonId).toBe(l.id)
    for (const e of Object.values(eventsById)) expect(lessonsById[e.lessonId].eventRefs.some((r) => r.eventId === e.id)).toBe(true)
  })

  it('shares one canonical lesson across lives instead of copies', () => {
    const stocksUsers = new Set(Object.values(eventsById).filter((e) => e.lessonId === 'stocks').map((e) => e.role))
    expect(stocksUsers.size).toBeGreaterThan(1)
    expect(lessons.filter((l) => l.title === lessonsById.stocks.title)).toHaveLength(1)
  })
})

describe('selection', () => {
  it.each(ALL_ROLES)('%s: 40 positions, 15/15/10, every required event, stable per seed', (role) => {
    const required = eventsByRole[role].filter((e) => e.required).map((e) => e.id)
    expect(selectPositions(role, 7)).toEqual(selectPositions(role, 7))
    for (let seed = 1; seed < 40; seed++) {
      const pos = selectPositions(role, seed)
      expect(pos).toHaveLength(40)
      expect([1, 2, 3].map((c) => pos.filter((p) => p.chapter === c).length)).toEqual([15, 15, 10])
      for (const id of required) expect(pos.some((p) => p.eventId === id)).toBe(true)
      for (const p of pos) expect([getEvent(p.eventId).chapter, getEvent(p.eventId).slot, getEvent(p.eventId).role]).toEqual([p.chapter, p.slot, role])
    }
  })

  it.each(ALL_ROLES)('%s: every alternative is reachable across seeds', (role) => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 400; seed++) for (const p of selectPositions(role, seed)) seen.add(p.eventId)
    expect(seen.size).toBe(70)
  })
})
