import type { RoleSpec } from './roles'

// Runtime checks of the authored packs and the Learn catalog. The game refuses
// to start on content that would break its rules instead of quietly playing a
// broken run.

export const CHAPTER_BANK = { 1: 25, 2: 25, 3: 20 } as const
export const CHAPTER_PLAYED = { 1: 15, 2: 15, 3: 10 } as const
const REQUIRED = { 1: 8, 2: 7, 3: 5 } as const
const OPS = new Set(['spend', 'earn', 'transfer_up_to', 'schedule_income', 'buy_up_to', 'sell_up_to'])
const ASSETS = new Set(['broad', 'single'])
const TAGS = new Set(['Planner', 'Social Butterfly', 'Hustler', 'Explorer'])
const CALLBACKS = new Set(['use_actual_finances', 'record_history', 'workload_modifier', 'prior_choice_text', 'utility_deadline', 'chapter_summary', 'actual_holdings', 'college_rule'])

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const opKey = (m: Obj) => `${m.amount_cents}|${m.account}|${m.after_days}`

/** `lessons` maps lesson id → version, from the catalog. */
export function validatePack(raw: unknown, spec: RoleSpec, lessons: Map<string, number>): string[] {
  const errors: string[] = []
  const err = (m: string) => errors.push(`${spec.role}: ${m}`)
  if (!isObj(raw) || !Array.isArray(raw.events)) return [`${spec.role}: pack has no events array`]
  if (raw.character !== spec.role) err(`pack character is ${String(raw.character)}`)
  const dates = raw.dates as Record<string, string[]> | undefined
  if (!dates) err('missing dates')
  const accounts = new Set<string>(spec.accounts)
  const stats = new Set<string>(['happiness', 'stress', spec.thirdStat])
  const events = raw.events as unknown[]
  const ids = new Set<string>()
  const bank = { 1: 0, 2: 0, 3: 0 } as Record<number, number>
  const required = { 1: 0, 2: 0, 3: 0 } as Record<number, number>

  for (const e of events) {
    if (!isObj(e) || !isText(e.id)) {
      err('event without id')
      continue
    }
    const id = e.id
    if (ids.has(id)) err(`${id}: duplicate id`)
    ids.add(id)
    const ch = e.chapter as 1 | 2 | 3
    if (![1, 2, 3].includes(ch)) err(`${id}: bad chapter`)
    bank[ch] = (bank[ch] ?? 0) + 1
    if (e.required === true) required[ch] = (required[ch] ?? 0) + 1
    else if (e.required !== false) err(`${id}: required must be true or false`)
    for (const k of ['title', 'lesson_id', 'scenario', 'date', 'mode'] as const) if (!isText(e[k])) err(`${id}: missing ${k}`)
    if (lessons.get(e.lesson_id as string) !== e.lesson_version) err(`${id}: lesson ${String(e.lesson_id)} v${String(e.lesson_version)} is not in the catalog`)
    const slot = e.slot as number
    const chDates = dates?.[String(ch)]
    if (!isInt(slot) || !chDates || slot < 1 || slot > chDates.length) err(`${id}: slot out of range`)
    else if (chDates[slot - 1] !== e.date) err(`${id}: date ${String(e.date)} does not match its slot`)
    if (spec.role === 'college' && e.year !== 1 && e.year !== 2) err(`${id}: college events need a year`)
    if (!Array.isArray(e.case_terms)) err(`${id}: case_terms must be a list`)
    if (Array.isArray(e.callbacks))
      for (const cb of e.callbacks as unknown[]) {
        if (!isObj(cb) || !CALLBACKS.has(cb.type as string)) err(`${id}: unknown callback`)
        else if (cb.type === 'utility_deadline' && (!isInt(cb.after_days) || !Array.isArray(cb.choice_ids))) err(`${id}: bad utility_deadline`)
        else if (cb.type === 'workload_modifier' && (!isObj(cb.condition) || !isObj(cb.effect) || !Array.isArray(cb.choice_ids))) err(`${id}: bad workload_modifier`)
      }

    const choices = e.choices
    if (!Array.isArray(choices) || choices.length !== 4) {
      err(`${id}: needs 4 choices`)
      continue
    }
    let free = 0
    for (const c of choices as unknown[]) {
      if (!isObj(c) || !isText(c.id) || !isText(c.label) || !isText(c.reason)) {
        err(`${id}: incomplete choice`)
        continue
      }
      const where = `${id}.${c.id}`
      const money = c.money as unknown[]
      if (!Array.isArray(money)) {
        err(`${where}: money must be a list`)
        continue
      }
      if (!money.some((m) => isObj(m) && m.type === 'spend')) free++
      for (const m of money) {
        if (!isObj(m) || !OPS.has(m.type as string)) {
          err(`${where}: unknown operation`)
          continue
        }
        if (!isInt(m.amount_cents) || (m.amount_cents as number) <= 0) err(`${where}: amount must be a positive integer`)
        const acct = (a: unknown) => accounts.has(a as string)
        if (['spend', 'earn', 'schedule_income', 'buy_up_to', 'sell_up_to'].includes(m.type as string) && !acct(m.account)) err(`${where}: account ${String(m.account)} not used by this life`)
        if (m.type === 'transfer_up_to' && (!acct(m.source) || !acct(m.destination) || m.source === m.destination)) err(`${where}: bad transfer`)
        if ((m.type === 'buy_up_to' || m.type === 'sell_up_to') && !ASSETS.has(m.asset as string)) err(`${where}: bad asset`)
        if (m.type === 'buy_up_to' && (!isInt(m.buffer_cents) || typeof m.requires_brokerage !== 'boolean')) err(`${where}: buy needs a buffer and brokerage rule`)
        if (m.type === 'schedule_income' && (!isInt(m.after_days) || (m.after_days as number) < 1)) err(`${where}: income needs after_days`)
      }
      // Each receivable is listed again in delayed_effects. Both lists must describe the same
      // payments so the engine can schedule them once from `money`.
      const scheduled = money.filter((m) => isObj(m) && m.type === 'schedule_income').map((m) => opKey(m as Obj))
      const mirrored = Array.isArray(c.delayed_effects) ? (c.delayed_effects as Obj[]).map(opKey) : []
      if (scheduled.join() !== mirrored.join()) err(`${where}: delayed_effects does not mirror schedule_income`)
      if (!isObj(c.stats)) err(`${where}: stats must be an object`)
      else
        for (const [k, v] of Object.entries(c.stats)) {
          if (!stats.has(k)) err(`${where}: stat ${k} does not belong to this life`)
          if (!isInt(v) || Math.abs(v) > 12) err(`${where}: stat ${k} out of range`)
        }
      if (!isObj(c.flags)) err(`${where}: flags must be an object`)
      if (!Array.isArray(c.playstyles) || !c.playstyles.every((t) => TAGS.has(t as string))) err(`${where}: bad playstyle`)
    }
    if (free < 1) err(`${id}: needs a choice that spends nothing`)
  }

  for (const ch of [1, 2, 3] as const) {
    if (bank[ch] !== CHAPTER_BANK[ch]) err(`chapter ${ch} has ${bank[ch]} events, expected ${CHAPTER_BANK[ch]}`)
    if (required[ch] !== REQUIRED[ch]) err(`chapter ${ch} has ${required[ch]} required events, expected ${REQUIRED[ch]}`)
    if (dates && dates[String(ch)]?.length !== CHAPTER_PLAYED[ch]) err(`chapter ${ch} needs ${CHAPTER_PLAYED[ch]} dated positions`)
    for (let s = 1; s <= (dates?.[String(ch)]?.length ?? 0); s++) {
      const here = events.filter((e) => isObj(e) && e.chapter === ch && e.slot === s) as Obj[]
      const req = here.filter((e) => e.required === true).length
      if (req > 1 || (req === 1 && here.length !== 1)) err(`chapter ${ch} position ${s}: a required position holds only its event`)
      if (req === 0 && (here.length < 2 || here.length > 3)) err(`chapter ${ch} position ${s}: needs two or three alternatives`)
    }
  }
  if (ids.size !== 70) err(`expected 70 events, found ${ids.size}`)
  return errors
}

export function validateCatalog(raw: unknown, eventIds: Map<string, string>): string[] {
  const errors: string[] = []
  const err = (m: string) => errors.push(`catalog: ${m}`)
  if (!isObj(raw) || !Array.isArray(raw.lessons) || !Array.isArray(raw.categories)) return ['catalog: missing lessons or categories']
  const lessons = raw.lessons as Obj[]
  const categories = raw.categories as Obj[]
  const sources = new Set(((raw.sources as Obj[]) ?? []).map((s) => s.id as string))
  const ids = new Set(lessons.map((l) => l.id as string))
  const qids = new Set<string>()
  if (ids.size !== lessons.length) err('duplicate lesson ids')
  const placed = new Map<string, number>()
  for (const c of categories) {
    if (!isText(c.id) || !isText(c.title) || !Array.isArray(c.lesson_ids) || c.lesson_ids.length === 0) err(`category ${String(c.id)} is empty or incomplete`)
    for (const id of (c.lesson_ids as string[]) ?? []) placed.set(id, (placed.get(id) ?? 0) + 1)
  }
  for (const l of lessons) {
    const id = l.id as string
    if (placed.get(id) !== 1) err(`${id}: needs exactly one category`)
    if (!categories.some((c) => c.id === l.category_id && (c.lesson_ids as string[]).includes(id))) err(`${id}: category_id does not list it`)
    if (!isInt(l.version) || (l.version as number) < 1) err(`${id}: bad version`)
    for (const k of ['title', 'objective'] as const) if (!isText(l[k])) err(`${id}: missing ${k}`)
    const s = l.sentences
    if (!Array.isArray(s) || s.length < 3 || s.length > 5 || !s.every(isText)) err(`${id}: lesson needs 3–5 sentences`)
    const quiz = l.quiz as Obj[]
    if (!Array.isArray(quiz) || quiz.length !== 2) err(`${id}: needs exactly two questions`)
    else
      for (const q of quiz) {
        if (!isText(q.id) || qids.has(q.id)) err(`${id}: question ids must be unique`)
        qids.add(q.id as string)
        if (!isText(q.prompt) || !isText(q.explanation)) err(`${id}: incomplete question`)
        if (!Array.isArray(q.options) || q.options.length !== 3 || new Set(q.options).size !== 3) err(`${id}: needs three distinct options`)
        if (!isInt(q.answer_index) || (q.answer_index as number) < 0 || (q.answer_index as number) > 2) err(`${id}: bad answer_index`)
      }
    for (const p of (l.prerequisites as string[]) ?? []) if (!ids.has(p)) err(`${id}: unknown prerequisite ${p}`)
    for (const sid of (l.source_ids as string[]) ?? []) if (!sources.has(sid)) err(`${id}: unknown source ${sid}`)
    for (const ref of (l.event_refs as Obj[]) ?? []) {
      const lessonOfEvent = eventIds.get(ref.event_id as string)
      if (lessonOfEvent === undefined) err(`${id}: related event ${String(ref.event_id)} does not exist`)
      else if (lessonOfEvent !== id) err(`${id}: related event ${String(ref.event_id)} teaches ${lessonOfEvent}`)
    }
  }
  // Suggested prerequisites must not loop.
  const prereq = new Map(lessons.map((l) => [l.id as string, (l.prerequisites as string[]) ?? []]))
  const state = new Map<string, 1 | 2>()
  const visit = (id: string): boolean => {
    if (state.get(id) === 2) return true
    if (state.get(id) === 1) return false
    state.set(id, 1)
    const ok = (prereq.get(id) ?? []).every(visit)
    state.set(id, 2)
    return ok
  }
  for (const id of ids) if (!visit(id)) err(`prerequisite cycle through ${id}`)
  return errors
}
