import { portfolioValue, type Lot, type Prices } from './portfolio'
import { ROLES, bucketOf, pricesOn, statKeys, type Bucket } from './roles'
import { selectPositions, type Position } from './selection'
import type { AccountId, FlagValue, Playstyle, RoleId, StatKey } from './types'

// One character's run. Everything money-related is integer cents and stays
// inside this life; lesson mastery and FiCoins live on the player (mastery.ts).

export type Stats = Partial<Record<StatKey, number>>
export type Balances = Partial<Record<AccountId, number>>

export type LedgerKind = 'earning' | 'purchase' | 'transfer' | 'bill' | 'fee' | 'investment' | 'sale' | 'settlement'

export interface LedgerEntry {
  id: string
  day: number
  kind: LedgerKind
  label: string
  /** Signed changes per account. A transfer's changes sum to zero. */
  accounts: Balances
  /** Positive when a shortfall is recorded, negative when it is settled. */
  arrears: Partial<Record<Bucket, number>>
  eventId?: string
  detail?: string
}

export interface ArrearsItem {
  id: string
  label: string
  day: number
  cents: number
  bucket: Bucket
}

/** Earned but not yet received: completed one-off work that settles once on its due day. */
export interface PendingIncome {
  id: string
  dueDay: number
  cents: number
  account: AccountId
  label: string
  eventId: string
}

export type DeadlineKind = 'laptop_pickup' | 'repair_pickup' | 'loan_review' | 'item_ready'

export interface Deadline {
  id: string
  day: number
  kind: DeadlineKind
  label: string
  resolved: boolean
  eventId?: string
  /** A supported loan can be extended once. */
  extended?: boolean
}

export type ItemKind = 'rental' | 'loaner' | 'lent' | 'borrowed'

/** College: something borrowed, rented or lent that has to be resolved at a chapter's end. */
export interface HeldItem {
  id: string
  label: string
  kind: ItemKind
  dueChapter: 1 | 2 | 3
  renewable: boolean
  status: 'out' | 'returned'
  renewals: number
}

export type Pause =
  | { kind: 'shortfall'; txId: string; label: string; billCents: number; day: number; account: AccountId }
  | { kind: 'deadline'; deadlineId: string }

export interface QuizProgress {
  attempts: number[]
  acknowledged: boolean
}

export interface Outcome {
  choiceId: string
  statChanges: Stats
  ledgerIds: string[]
  notes: string[]
}

export interface CurrentEvent {
  index: number
  eventId: string
  /** Decided when the event opens and kept, so finishing the lesson can't flip it. */
  mode: 'new' | 'review'
  stage: 'learn' | 'decide' | 'done'
  quiz: Record<string, QuizProgress>
  /** Ledger index where this event's transition began. */
  ledgerStart: number
  /** Stress was already high when a work event began (workload modifier). */
  workload?: boolean
  outcome?: Outcome
}

export interface HistoryEntry {
  index: number
  chapter: number
  slot: number
  eventId: string
  title: string
  lessonKey: string
  day: number
  mode: 'new' | 'review'
  choiceId: string
  choiceLabel: string
  rationale: string
  statChanges: Stats
  statsAfter: Stats
  ledgerIds: string[]
  notes: string[]
}

export interface UtilityLog {
  id: string
  day: number
  label: string
  statChanges: Stats
}

export interface SummerRole {
  role: string
  cents: number
  fromDay: number
}

export interface Notice {
  id: string
  day: number
  text: string
}

export interface CampaignRun {
  version: 2
  role: RoleId
  runId: string
  seed: number
  positions: Position[]
  /** Next position to play, 0–40. */
  index: number
  /** Last calendar day fully processed; -1 before the first event. */
  day: number
  processed: string[]
  /** Idempotency keys runId/eventId/choiceId of applied choices. */
  applied: string[]
  /** Balances the run started with; the ledger reconciles against these. */
  opening: Balances
  accounts: Balances
  /** Liabilities created by the player. No operation creates any in this release. */
  debt: number
  arrears: ArrearsItem[]
  lots: Lot[]
  realizedCents: number
  prices: Prices
  stats: Stats
  flags: Record<string, FlagValue>
  pending: PendingIncome[]
  deadlines: Deadline[]
  items: HeldItem[]
  summerRoles: SummerRole[]
  /** Adult: confirmed changes to net pay, applied from a future payday. */
  payroll: { fromDay: number; deltaCents: number }[]
  /** Optional convenience account: monthly fee while on, from `fromDay`. */
  feePlan: { on: boolean; fromDay: number }
  ledger: LedgerEntry[]
  history: HistoryEntry[]
  utilities: UtilityLog[]
  /** Visible corrections and notes (for example a migration correction). */
  notices: Notice[]
  tags: Record<Playstyle, number>
  current: CurrentEvent | null
  pause: Pause | null
  /** Bills the player chose to leave partly unpaid instead of moving money. */
  declined: string[]
  transitionStart: number
  lastRecoveryDay: number | null
  lastCheckinDay: number | null
  /** Chapters whose summary the player has closed. */
  summariesSeen: number[]
  finished: boolean
  /** Increases with every change; lets two open tabs keep the newest copy. */
  rev: number
}

export function createRun(role: RoleId, seed: number): CampaignRun {
  const spec = ROLES[role]
  const accounts: Balances = { ...spec.initialAccounts }
  const stats: Stats = { ...spec.initialStats }
  return {
    version: 2,
    role,
    runId: `${role}-${seed.toString(36)}`,
    seed,
    positions: selectPositions(role, seed),
    index: 0,
    day: -1,
    processed: [],
    applied: [],
    opening: { ...accounts },
    accounts,
    debt: 0,
    arrears: [],
    lots: [],
    realizedCents: 0,
    prices: pricesOn(role, -1),
    stats,
    flags: {},
    pending: [],
    deadlines: [],
    items: [],
    summerRoles: [],
    payroll: [],
    feePlan: { on: false, fromDay: 0 },
    ledger: [],
    history: [],
    utilities: [],
    notices: [],
    tags: { Planner: 0, 'Social Butterfly': 0, Hustler: 0, Explorer: 0 },
    current: null,
    pause: null,
    declined: [],
    transitionStart: 0,
    lastRecoveryDay: null,
    lastCheckinDay: null,
    summariesSeen: [],
    finished: false,
    rev: 0,
  }
}

export const bal = (r: CampaignRun, a: AccountId) => r.accounts[a] ?? 0
export const stat = (r: CampaignRun, k: StatKey) => r.stats[k] ?? 0
export const arrearsTotal = (r: CampaignRun, bucket?: Bucket) => r.arrears.filter((a) => !bucket || a.bucket === bucket).reduce((s, a) => s + a.cents, 0)
export const investmentValue = (r: CampaignRun) => portfolioValue(r.lots, r.prices)
export const receivablesTotal = (r: CampaignRun) => r.pending.reduce((s, p) => s + p.cents, 0)
export const cashTotal = (r: CampaignRun) => ROLES[r.role].accounts.reduce((s, a) => s + bal(r, a), 0)

/** Accounts + investments (+ earned receivables) − debt − arrears. Possessions and equipment are excluded. */
export const netWorth = (r: CampaignRun) =>
  cashTotal(r) + investmentValue(r) + (ROLES[r.role].receivablesInNetWorth ? receivablesTotal(r) : 0) - r.debt - arrearsTotal(r)

export const flagOn = (r: CampaignRun, name: string) => {
  const v = r.flags[name]
  return v !== undefined && v !== false && v !== 0
}

export const chapterOf = (index: number) => (index < 15 ? 1 : index < 30 ? 2 : 3)
export const chapterStart = (chapter: number) => (chapter === 1 ? 0 : chapter === 2 ? 15 : 30)
export { bucketOf, statKeys }
