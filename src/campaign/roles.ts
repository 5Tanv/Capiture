import { calendars, dayOfYear, type SeriesDates } from './calendar'
import type { AccountId, RoleId, StatKey } from './types'
import type { LifeId } from '../types/game'

// Each playable life's financial setting (INTEGRATION-SPEC §3, COLLEGE-SYSTEM-V2 §3).
// All figures are fictional game settings, in integer cents.

export type Bucket = 'personal' | 'business'

export interface Series extends SeriesDates {
  id: string
  kind: 'income' | 'bill'
  account: AccountId
  cents: number
  label: string
  /** Adult pay: confirmed raises add to future periods. */
  payroll?: boolean
  /** Business client receipts trigger the reserve and owner-draw transfers. */
  clientReceipt?: boolean
}

export interface PricePoint {
  day: number
  broad: number
  single: number
}

export interface RoleSpec {
  role: RoleId
  lifeId: LifeId
  title: string
  /** Neutral default display name; never a planning name from earlier drafts. */
  defaultName: string
  nameToken: string
  thirdStat: StatKey
  thirdLabel: string
  chapters: [string, string, string]
  accounts: AccountId[]
  initialAccounts: Partial<Record<AccountId, number>>
  initialStats: Partial<Record<StatKey, number>>
  /** Where personal spending, purchases and investing happen. */
  spendAccount: AccountId
  /** The account shown first in the HUD. */
  primaryAccount: AccountId
  series: Series[]
  fee: { cents: number; account: AccountId }
  prices: PricePoint[]
  /** Business only: what happens after each client receipt. */
  allocation?: { taxReserveCents: number; ownerDrawCents: number }
  /** College counts only cash, investments and liabilities in net worth (COLLEGE-SYSTEM-V2 §4). */
  receivablesInNetWorth: boolean
}

const md = (m: number, d: number) => dayOfYear(m, d)
const END = calendars.adult.lastDay
const college = calendars.college

const NEW_LIFE_PRICES: PricePoint[] = [
  { day: md(1, 1), broad: 10000, single: 2000 },
  { day: md(5, 1), broad: 9800, single: 1850 },
  { day: md(7, 1), broad: 10300, single: 2100 },
  { day: md(9, 1), broad: 9600, single: 1600 },
  { day: md(11, 1), broad: 9900, single: 1750 },
  { day: md(12, 20), broad: 10100, single: 1800 },
]

export const ACCOUNT_NAMES: Record<AccountId, string> = {
  checking: 'Checking',
  savings: 'Savings',
  business_cash: 'Studio operating cash',
  business_reserve: 'Studio reserve',
  tax_reserve: 'Tax reserve',
}

export const bucketOf = (a: AccountId): Bucket => (a === 'business_cash' || a === 'business_reserve' ? 'business' : 'personal')

export const ROLES: Record<RoleId, RoleSpec> = {
  college: {
    role: 'college',
    lifeId: 'freshman',
    title: 'College Freshman',
    defaultName: 'Jordan',
    nameToken: '{collegeName}',
    thirdStat: 'academics',
    thirdLabel: 'Academic Standing',
    chapters: ['A Fresh Start', 'Finding Your Footing', 'Your Next Step'],
    accounts: ['checking', 'savings'],
    initialAccounts: { checking: 25000, savings: 15000 },
    initialStats: { happiness: 65, stress: 30, academics: 70 },
    spendAccount: 'checking',
    primaryAccount: 'checking',
    // Summer pay depends on the C225 placement and is handled by the engine.
    series: [
      { id: 'pay', kind: 'income', account: 'checking', cents: 18000, label: 'Campus job paycheck (net)', first: college.toDay(1, '09-08'), every: 14, last: college.toDay(2, '05-20') },
      { id: 'need', kind: 'bill', account: 'checking', cents: 6000, label: 'Weekly necessities', first: college.toDay(1, '09-01'), every: 7, last: college.toDay(2, '05-31') },
      { id: 'need', kind: 'bill', account: 'checking', cents: 7000, label: 'Weekly summer living costs', first: college.toDay(2, '06-01'), every: 7, last: college.toDay(2, '08-24') },
    ],
    fee: { cents: 500, account: 'checking' },
    prices: [
      { day: college.toDay(2, '04-18'), broad: 10000, single: 2000 },
      { day: college.toDay(2, '05-20'), broad: 10400, single: 1800 },
      { day: college.toDay(2, '06-01'), broad: 10200, single: 1900 },
      { day: college.toDay(2, '07-25'), broad: 9600, single: 1500 },
      { day: college.toDay(2, '08-04'), broad: 9800, single: 1700 },
      { day: college.toDay(2, '08-25'), broad: 10100, single: 1600 },
    ],
    receivablesInNetWorth: false,
  },
  adult: {
    role: 'adult',
    lifeId: 'professional',
    title: 'Working Adult',
    defaultName: 'Amelia',
    nameToken: '{adultName}',
    thirdStat: 'job_performance',
    thirdLabel: 'Job Performance',
    chapters: ['Keeping Everything Together', 'The Turning Point', 'A Future Worth Building'],
    accounts: ['checking', 'savings', 'tax_reserve'],
    initialAccounts: { checking: 90000, savings: 60000, tax_reserve: 0 },
    initialStats: { happiness: 60, stress: 45, job_performance: 65 },
    spendAccount: 'checking',
    primaryAccount: 'checking',
    series: [
      { id: 'pay', kind: 'income', account: 'checking', cents: 150000, label: 'Paycheck (net)', first: md(1, 15), every: 14, last: END, payroll: true },
      { id: 'bills', kind: 'bill', account: 'checking', cents: 130000, label: 'Household necessities', first: md(1, 8), every: 14, last: END },
    ],
    fee: { cents: 500, account: 'checking' },
    prices: NEW_LIFE_PRICES,
    receivablesInNetWorth: true,
  },
  business: {
    role: 'business',
    lifeId: 'entrepreneur',
    title: 'Business Owner',
    defaultName: 'Dev',
    nameToken: '{businessName}',
    thirdStat: 'business_reputation',
    thirdLabel: 'Business Reputation',
    chapters: ['Keeping the Doors Open', 'The Growth Gamble', 'Defining Success'],
    accounts: ['checking', 'savings', 'business_cash', 'business_reserve', 'tax_reserve'],
    initialAccounts: { checking: 100000, savings: 50000, business_cash: 500000, business_reserve: 100000, tax_reserve: 0 },
    initialStats: { happiness: 60, stress: 45, business_reputation: 60 },
    spendAccount: 'checking',
    primaryAccount: 'business_cash',
    series: [
      { id: 'receipt', kind: 'income', account: 'business_cash', cents: 500000, label: 'Client service contract receipt', first: md(1, 15), every: 14, last: END, clientReceipt: true },
      { id: 'opbills', kind: 'bill', account: 'business_cash', cents: 250000, label: 'Studio operating costs', first: md(1, 8), every: 14, last: END },
      { id: 'bills', kind: 'bill', account: 'checking', cents: 130000, label: 'Personal necessities', first: md(1, 8), every: 14, last: END },
    ],
    fee: { cents: 1500, account: 'business_cash' },
    prices: NEW_LIFE_PRICES,
    allocation: { taxReserveCents: 50000, ownerDrawCents: 150000 },
    receivablesInNetWorth: true,
  },
  athlete: {
    role: 'athlete',
    lifeId: 'athlete',
    title: 'Basketball Player',
    defaultName: 'Jalen',
    nameToken: '{athleteName}',
    thirdStat: 'athletic_performance',
    thirdLabel: 'Athletic Performance',
    chapters: ['The Rookie Contract', 'The Price of Success', 'Beyond the Game'],
    accounts: ['checking', 'savings', 'tax_reserve'],
    initialAccounts: { checking: 1500000, savings: 1000000, tax_reserve: 0 },
    initialStats: { happiness: 65, stress: 35, athletic_performance: 70 },
    spendAccount: 'checking',
    primaryAccount: 'checking',
    series: [
      // Regular team pay stops after August; living commitments continue through the offseason.
      { id: 'pay', kind: 'income', account: 'checking', cents: 1200000, label: 'Team payment (net)', first: md(1, 15), every: 14, last: md(8, 31) },
      { id: 'bills', kind: 'bill', account: 'checking', cents: 500000, label: 'Living commitments', first: md(1, 8), every: 14, last: END },
    ],
    fee: { cents: 3000, account: 'checking' },
    prices: NEW_LIFE_PRICES,
    receivablesInNetWorth: true,
  },
}

export const ROLE_ORDER: RoleId[] = ['college', 'adult', 'business', 'athlete']
export const roleOfLife: Record<LifeId, RoleId> = { freshman: 'college', professional: 'adult', entrepreneur: 'business', athlete: 'athlete' }
export const lifeOfRole: Record<RoleId, LifeId> = { college: 'freshman', adult: 'professional', business: 'entrepreneur', athlete: 'athlete' }

export const STAT_LABELS: Record<StatKey, string> = {
  happiness: 'Happiness',
  stress: 'Stress',
  academics: 'Academic Standing',
  job_performance: 'Job Performance',
  business_reputation: 'Business Reputation',
  athletic_performance: 'Athletic Performance',
}

export const statKeys = (role: RoleId): StatKey[] => ['happiness', 'stress', ROLES[role].thirdStat]

/** The classroom price path as of a day; the most recent quote carries forward. */
export function pricesOn(role: RoleId, day: number) {
  const path = ROLES[role].prices
  let p = { broad: path[0].broad, single: path[0].single }
  for (const q of path) if (q.day <= day) p = { broad: q.broad, single: q.single }
  return p
}
