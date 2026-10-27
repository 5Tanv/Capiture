import adultRaw from './content/adult-events.json'
import athleteRaw from './content/athlete-events.json'
import businessRaw from './content/business-events.json'
import catalogRaw from './content/learn-catalog.json'
import collegeRaw from './content/college-v2-events.json'
import { ROLES, ROLE_ORDER } from './roles'
import type { AccountId, Callback, Category, ChoiceDef, EventDef, Lesson, MoneyOp, RoleId, Source } from './types'
import { validateCatalog, validatePack } from './validate'

// The four campaign packs and the shared Learn catalog, checked once at load and
// normalized into the engine's types. Events reference catalog lessons by
// id/version; no event owns its own copy of a lesson.

type Raw = Record<string, any>

export const RAW_PACKS: Record<RoleId, unknown> = { college: collegeRaw, adult: adultRaw, business: businessRaw, athlete: athleteRaw }

const lessonVersions = new Map((catalogRaw as Raw).lessons.map((l: Raw) => [l.id as string, l.version as number]))
const problems: string[] = []
for (const role of ROLE_ORDER) problems.push(...validatePack(RAW_PACKS[role], ROLES[role], lessonVersions as Map<string, number>))
const eventLessons = new Map<string, string>()
for (const role of ROLE_ORDER) for (const e of (RAW_PACKS[role] as Raw).events) eventLessons.set(e.id, e.lesson_id)
problems.push(...validateCatalog(catalogRaw, eventLessons))
if (problems.length > 0) throw new Error(`Capiture content failed validation:\n${problems.join('\n')}`)

function normalizeOp(m: Raw): MoneyOp {
  const cents = m.amount_cents as number
  switch (m.type) {
    case 'spend':
      return { op: 'spend', account: m.account, cents }
    case 'earn':
      return { op: 'earn', account: m.account, cents }
    case 'transfer_up_to':
      return { op: 'transfer_up_to', source: m.source, destination: m.destination, cents }
    case 'schedule_income':
      return { op: 'schedule_income', account: m.account, cents, afterDays: m.after_days, note: m.note }
    case 'buy_up_to':
      return { op: 'buy_up_to', account: m.account, asset: m.asset, cents, bufferCents: m.buffer_cents, requiresBrokerage: m.requires_brokerage }
    default:
      return { op: 'sell_up_to', asset: m.asset, destination: m.account as AccountId, cents }
  }
}

function normalizeCallback(cb: Raw): Callback {
  switch (cb.type) {
    case 'workload_modifier':
      return { type: 'workload_modifier', gte: cb.condition.gte, stress: cb.effect.stress, choiceIds: cb.choice_ids }
    case 'prior_choice_text':
      return { type: 'prior_choice_text', eventId: cb.event_id, flags: cb.flags }
    case 'utility_deadline':
      return { type: 'utility_deadline', choiceIds: cb.choice_ids, afterDays: cb.after_days, description: cb.description }
    case 'actual_holdings':
      return { type: 'actual_holdings', eventId: cb.event_id }
    case 'chapter_summary':
      return { type: 'chapter_summary' }
    default:
      return { type: 'note', description: String(cb.description ?? '') }
  }
}

function normalizeEvent(e: Raw, role: RoleId): EventDef {
  const choices: ChoiceDef[] = e.choices.map((c: Raw) => ({
    id: c.id,
    label: c.label,
    money: c.money.map(normalizeOp),
    stats: c.stats,
    reason: c.reason,
    flags: c.flags,
    playstyles: c.playstyles,
    outcomeText: c.outcome_text ?? c.reason,
  }))
  return {
    id: e.id,
    role,
    chapter: e.chapter,
    chapterTitle: e.chapter_title ?? ROLES[role].chapters[e.chapter - 1],
    slot: e.slot,
    title: e.title,
    required: e.required,
    lessonId: e.lesson_id,
    lessonVersion: e.lesson_version,
    mode: e.mode,
    scenario: e.scenario,
    caseTerms: e.case_terms ?? [],
    choices,
    callbacks: (e.callbacks ?? []).map(normalizeCallback),
    date: e.date,
    year: role === 'college' ? e.year : 1,
  }
}

export const eventsByRole: Record<RoleId, EventDef[]> = Object.fromEntries(
  ROLE_ORDER.map((role) => [role, (RAW_PACKS[role] as Raw).events.map((e: Raw) => normalizeEvent(e, role))]),
) as Record<RoleId, EventDef[]>

export const eventsById: Record<string, EventDef> = Object.fromEntries(ROLE_ORDER.flatMap((r) => eventsByRole[r].map((e) => [e.id, e])))

export const getEvent = (id: string): EventDef => {
  const e = eventsById[id]
  if (!e) throw new Error(`Unknown event ${id}`)
  return e
}

/** Events that can fill a chapter position, in authored order. */
export const eventsAt = (role: RoleId, chapter: number, slot: number) => eventsByRole[role].filter((e) => e.chapter === chapter && e.slot === slot)

export const CHAPTER_POSITIONS = [15, 15, 10] as const

// ── Learn catalog ───────────────────────────────────────────────────────────

const cat = catalogRaw as Raw

export const lessons: Lesson[] = cat.lessons.map((l: Raw) => ({
  id: l.id,
  version: l.version,
  categoryId: l.category_id,
  title: l.title,
  objective: l.objective,
  sentences: l.sentences,
  quiz: l.quiz,
  difficulty: l.difficulty,
  prerequisites: l.prerequisites ?? [],
  sourceIds: l.source_ids ?? [],
  eventRefs: (l.event_refs ?? []).map((r: Raw) => ({ character: r.character, eventId: r.event_id, chapter: r.chapter, slot: r.slot, required: r.required })),
}))
export const categories: Category[] = cat.categories.map((c: Raw) => ({ id: c.id, title: c.title, lessonIds: c.lesson_ids }))
export const sources: Record<string, Source> = Object.fromEntries(cat.sources.map((s: Raw) => [s.id, { id: s.id, title: s.title, url: s.url }]))
export const lessonsById: Record<string, Lesson> = Object.fromEntries(lessons.map((l) => [l.id, l]))

export const lessonKey = (l: Pick<Lesson, 'id' | 'version'>) => `${l.id}@${l.version}`
export const lessonForEvent = (e: Pick<EventDef, 'lessonId'>): Lesson => lessonsById[e.lessonId]
export const eventLessonKey = (e: Pick<EventDef, 'lessonId' | 'lessonVersion'>) => `${e.lessonId}@${e.lessonVersion}`
export const lessonByKey = (key: string): Lesson | undefined => lessonsById[key.split('@')[0]]
