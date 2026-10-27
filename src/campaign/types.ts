// The shapes the game plays. The authored packs (content/*.json) are checked by
// validate.ts and normalized into these types by content.ts. Content is data
// only: operations and callbacks are a closed set the engine knows how to run,
// and no string in a pack is ever executed.

export type RoleId = 'college' | 'adult' | 'business' | 'athlete'
export type AccountId = 'checking' | 'savings' | 'business_cash' | 'business_reserve' | 'tax_reserve'
export type AssetId = 'broad' | 'single'
export type StatKey = 'happiness' | 'stress' | 'academics' | 'job_performance' | 'business_reputation' | 'athletic_performance'
export type Playstyle = 'Planner' | 'Social Butterfly' | 'Hustler' | 'Explorer'
export type FlagValue = string | number | boolean

export type MoneyOp =
  | { op: 'spend'; account: AccountId; cents: number }
  | { op: 'earn'; account: AccountId; cents: number }
  | { op: 'transfer_up_to'; source: AccountId; destination: AccountId; cents: number }
  /** Completed one-off work: an earned receivable that settles once, after_days later. */
  | { op: 'schedule_income'; account: AccountId; cents: number; afterDays: number; note?: string }
  | { op: 'buy_up_to'; account: AccountId; asset: AssetId; cents: number; bufferCents: number; requiresBrokerage: boolean }
  | { op: 'sell_up_to'; asset: AssetId; destination: AccountId; cents: number }

export type Callback =
  /** Already highly stressed when the event begins: accepting extra work adds this much stress. */
  | { type: 'workload_modifier'; gte: number; stress: number; choiceIds: string[] }
  /** Name the earlier choice only if one of these flags was actually set by that event. */
  | { type: 'prior_choice_text'; eventId: string; flags: string[] }
  /** Choosing one of these creates a dated practical follow-up (repair pickup, loan review). */
  | { type: 'utility_deadline'; choiceIds: string[]; afterDays: number; description: string }
  /** Portfolio text from real holdings once this event has been played; otherwise a paper example. */
  | { type: 'actual_holdings'; eventId: string }
  | { type: 'chapter_summary' }
  /** Implementation notes from the pack (history, actual finances, college rules); informational. */
  | { type: 'note'; description: string }

export interface ChoiceDef {
  id: string
  label: string
  money: MoneyOp[]
  stats: Partial<Record<StatKey, number>>
  reason: string
  flags: Record<string, FlagValue>
  playstyles: Playstyle[]
  outcomeText: string
}

export interface EventDef {
  id: string
  role: RoleId
  chapter: 1 | 2 | 3
  chapterTitle: string
  slot: number
  title: string
  required: boolean
  lessonId: string
  lessonVersion: number
  mode: string
  scenario: string
  caseTerms: string[]
  choices: ChoiceDef[]
  callbacks: Callback[]
  /** Month-day, e.g. "09-08". */
  date: string
  /** College spans two calendar years; the other lives play one. */
  year: 1 | 2
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  answer_index: number
  explanation: string
}

export interface Lesson {
  id: string
  version: number
  categoryId: string
  title: string
  objective: string
  sentences: string[]
  quiz: QuizQuestion[]
  difficulty: string
  prerequisites: string[]
  sourceIds: string[]
  eventRefs: { character: RoleId; eventId: string; chapter: number; slot: number; required: boolean }[]
}

export interface Category {
  id: string
  title: string
  lessonIds: string[]
}

export interface Source {
  id: string
  title: string
  url: string
}
