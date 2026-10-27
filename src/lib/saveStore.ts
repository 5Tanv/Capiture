import { eventsById, getEvent, lessonForEvent, lessonKey } from '../campaign/content'
import { mergeMastery, receiptCoins, type Mastery, type MasteryRecord } from '../campaign/mastery'
import { ROLES, roleOfLife } from '../campaign/roles'
import type { CampaignRun, LedgerEntry } from '../campaign/run'
import { shopItems } from '../data/shop'
import { guardClothing, lifePresets, normalizeAppearance, type Appearance } from '../sprites/catalog'
import type { LifeId, LifeSim, PlayerAccount } from '../types/game'
import { applyPurchase, cleanShop, emptyShop, mergeShop, ownedIds, spentCoins, type PurchaseResult, type ShopState } from './shopStore'

// What the browser remembers between visits: each life's display name and look,
// the account avatar, FiCoins, the player's lesson mastery, and every life's
// campaign run. This is local to one browser; there is no account sync.
//
// Version 3 holds all four campaigns and the shared Learn mastery. Older saves
// are migrated in place: chosen names and looks are kept, nothing earned is
// dropped, and nothing is granted twice.

const KEY = 'filife.save.v3'
const OLDER_KEYS = ['filife.save.v2', 'filife.save.v1']
/** A run that fails the shape check is kept here instead of being thrown away. */
const KEY_UNREADABLE = 'filife.save.unreadable'
export const NAME_MAX = 32

interface SavedLife {
  name: string
  appearance: Appearance
  customized: boolean
}

export interface SaveFile {
  version: 3
  lives: Partial<Record<LifeId, SavedLife>>
  account: { appearance: Appearance; coinBase: number; username?: string }
  player: { mastery: Mastery }
  runs: Partial<Record<LifeId, CampaignRun>>
  /** Cosmetic ownership, equipment and purchase receipts. Absent in saves from before the shop sold things. */
  shop?: ShopState
  /** Which default-look changes this save has been through. Absent in saves from before the skin-tone swap. */
  looks?: number
}

const LOOKS_VERSION = 1
/**
 * Looks 1 swapped two default skin tones: the freshman now starts Deep and the athlete Beige.
 * A saved life still wearing its old default tone takes the new one; everything else it chose stays.
 */
const OLD_DEFAULT_SKIN: Partial<Record<LifeId, string>> = { freshman: 'beige', athlete: 'deep' }
/** The account's default name before the Capiture rebrand. A save still holding it takes the new default; a name the player chose stays. */
const OLD_DEFAULT_USERNAME = 'CoinQuest'

type Obj = Record<string, any>

function readKey(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Trim, allow ordinary Unicode, cap at 32 characters; empty falls back. Never parsed as HTML. */
export function cleanName(name: unknown, fallback: string): string {
  if (typeof name !== 'string') return fallback
  const trimmed = [...name.trim().replace(/\s+/g, ' ')].slice(0, NAME_MAX).join('')
  return trimmed.length > 0 ? trimmed : fallback
}

const remapQuestion = (eventId: string, oldQid: string) => {
  const quiz = lessonForEvent(getEvent(eventId)).quiz
  const n = Number(oldQid.match(/Q(\d+)$/)?.[1] ?? 0)
  return quiz[n - 1]?.id
}

/**
 * Version 2 kept college mastery under old concept keys with event-specific question ids.
 * Each record moves to the canonical lesson of the event it was first met in, with its
 * answers matched by question order. Coins already earned stay earned; none are added.
 */
export function rekeyMastery(old: Obj): Mastery {
  let out: Mastery = {}
  for (const rec of Object.values(old ?? {}) as Obj[]) {
    const firstEventId = rec?.firstEventId as string
    if (!firstEventId || !eventsById[firstEventId]) continue
    const lesson = lessonForEvent(getEvent(firstEventId))
    const receipts: MasteryRecord['receipts'] = {}
    for (const [qid, r] of Object.entries((rec.receipts ?? {}) as Obj)) {
      const id = remapQuestion(firstEventId, qid)
      if (id) receipts[id] = { correct: Boolean(r.correct), coins: Number(r.coins) || 0, at: 0 }
    }
    const completed = Boolean(rec.completed)
    // Completed without answer evidence: keep it completed and treat the reward as used.
    if (completed) for (const q of lesson.quiz) receipts[q.id] ??= { correct: false, coins: 0, at: 0 }
    const next: MasteryRecord = { completed, acknowledged: completed ? lesson.quiz.map((q) => q.id) : [], receipts, source: 'migrated', firstEventId }
    out = mergeMastery(out, { [lessonKey(lesson)]: next })
  }
  return out
}

const OLD_SEED_LOAN = 500000
const nz = (n: unknown) => (typeof n === 'number' && n !== 0 ? n : undefined)

/** Convert a version 2 college run to the shared campaign shape, keeping all of its progress. */
export function migrateCollegeRun(old: Obj): CampaignRun {
  const loan = Number(old.loan ?? 0)
  // The first college version seeded an unconfirmed $5,000 loan. No operation in that
  // version could borrow, so exactly that amount is identifiably the seed and is removed.
  // Anything else is kept as a liability rather than guessed at.
  const seedOnly = loan === OLD_SEED_LOAN && !(old.ledger ?? []).some((l: Obj) => /loan|borrow/i.test(String(l.kind)))
  const notices = seedOnly
    ? [{ id: 'college-debt-correction', day: Math.max(0, Number(old.day) || 0), text: 'Content correction: the $5,000 student loan in the first version was never confirmed in this story, so it has been removed. This is a correction, not income: no cash was added.' }]
    : loan > 0
      ? [{ id: 'college-debt-kept', day: 0, text: `An existing liability of $${(loan / 100).toFixed(2)} was kept because it doesn't match the old seeded loan.` }]
      : []
  const current = old.current
    ? {
        ...old.current,
        quiz: Object.fromEntries(
          Object.entries((old.current.quiz ?? {}) as Obj)
            .map(([qid, v]) => [remapQuestion(old.current.eventId, qid), v])
            .filter(([qid]) => qid),
        ),
      }
    : null
  return {
    version: 2,
    role: 'college',
    runId: old.runId,
    seed: old.seed,
    positions: old.positions,
    index: old.index,
    day: old.day,
    processed: old.processed ?? [],
    applied: old.applied ?? [],
    opening: { checking: old.opening?.checking ?? 25000, savings: old.opening?.savings ?? 15000 },
    accounts: { checking: old.checking ?? 0, savings: old.savings ?? 0 },
    debt: seedOnly ? 0 : loan,
    arrears: (old.arrears ?? []).map((a: Obj) => ({ ...a, bucket: 'personal' })),
    lots: old.lots ?? [],
    realizedCents: old.realizedCents ?? 0,
    prices: old.prices,
    stats: old.stats,
    flags: old.flags ?? {},
    pending: (old.pending ?? []).map((p: Obj) => ({ ...p, account: 'checking' })),
    deadlines: old.deadlines ?? [],
    items: old.items ?? [],
    summerRoles: old.summerRoles ?? [],
    payroll: [],
    feePlan: { on: old.flags?.bank_plan === 'fee_account', fromDay: 7 },
    ledger: (old.ledger ?? []).map(
      (l: Obj): LedgerEntry => ({
        id: l.id,
        day: l.day,
        kind: l.kind,
        label: l.label,
        accounts: Object.fromEntries(Object.entries({ checking: nz(l.checking), savings: nz(l.savings) }).filter(([, v]) => v !== undefined)),
        arrears: nz(l.arrears) !== undefined ? { personal: l.arrears } : {},
        eventId: l.eventId,
        detail: l.detail,
      }),
    ),
    history: (old.history ?? []).map(({ conceptKey: _old, ...h }: Obj) => ({ ...h, lessonKey: lessonKey(lessonForEvent(getEvent(h.eventId))) })),
    utilities: old.utilities ?? [],
    notices,
    tags: old.tags,
    current,
    pause: old.pause?.kind === 'shortfall' ? { ...old.pause, account: 'checking' } : (old.pause ?? null),
    declined: old.declined ?? [],
    transitionStart: old.transitionStart ?? 0,
    lastRecoveryDay: old.lastRecoveryDay ?? null,
    lastCheckinDay: old.lastCheckinDay ?? null,
    summariesSeen: old.summariesSeen ?? [],
    finished: Boolean(old.finished),
    rev: 0,
  }
}

/** Upgrade any older save to the current shape. `fallbackCoins` is the balance shown before saves kept FiCoins. */
export function migrate(data: unknown, fallbackCoins: number): SaveFile | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Obj
  if (d.version === 3) return d as SaveFile
  if (d.version === 2) {
    const mastery = rekeyMastery(d.player?.mastery)
    const oldCoins = Number.isInteger(d.account?.fiCoins) ? (d.account.fiCoins as number) : fallbackCoins
    const run = d.runs?.freshman
    return {
      version: 3,
      lives: d.lives ?? {},
      // The displayed balance stays exactly the same: receipts carry their own coins.
      account: { appearance: d.account?.appearance, coinBase: Math.max(0, oldCoins - receiptCoins(mastery)) },
      player: { mastery },
      runs: run && run.version === 1 ? { freshman: migrateCollegeRun(run) } : {},
    }
  }
  if (d.version === 1) {
    return { version: 3, lives: d.lives ?? {}, account: { appearance: d.account?.appearance, coinBase: fallbackCoins }, player: { mastery: {} }, runs: {} }
  }
  return null
}

const isInt = (n: unknown) => typeof n === 'number' && Number.isInteger(n)

/** Enough checking that a stored run can be played safely; anything else is set aside, not deleted. */
export function isPlayableRun(r: unknown, lifeId: LifeId): r is CampaignRun {
  if (!r || typeof r !== 'object') return false
  const run = r as CampaignRun
  const role = roleOfLife[lifeId]
  return (
    run.version === 2 &&
    run.role === role &&
    Array.isArray(run.positions) &&
    run.positions.length === 40 &&
    run.positions.every((p) => eventsById[p.eventId]?.role === role && eventsById[p.eventId].slot === p.slot && eventsById[p.eventId].chapter === p.chapter) &&
    isInt(run.index) &&
    run.index >= 0 &&
    run.index <= 40 &&
    isInt(run.day) &&
    typeof run.accounts === 'object' &&
    Object.values(run.accounts).every((v) => isInt(v) && (v as number) >= 0) &&
    ROLES[role].accounts.every((a) => isInt(run.accounts[a] ?? 0)) &&
    Array.isArray(run.ledger) &&
    Array.isArray(run.processed) &&
    Array.isArray(run.applied) &&
    Array.isArray(run.history) &&
    typeof run.stats === 'object' &&
    typeof run.flags === 'object'
  )
}

function cleanMastery(m: unknown): Mastery {
  if (!m || typeof m !== 'object') return {}
  const out: Mastery = {}
  for (const [k, v] of Object.entries(m as Obj)) {
    if (v && typeof v === 'object' && v.receipts && typeof v.receipts === 'object')
      out[k] = { completed: Boolean(v.completed), acknowledged: Array.isArray(v.acknowledged) ? v.acknowledged : [], receipts: v.receipts, source: v.source ?? 'migrated', firstEventId: v.firstEventId }
  }
  return out
}

export interface Loaded {
  lives: Record<LifeId, LifeSim>
  account: PlayerAccount
  coinBase: number
  mastery: Mastery
  /** Missing lives start a new run. */
  runs: Partial<Record<LifeId, CampaignRun>>
  shop: ShopState
}

function newDefaultSkin(id: LifeId, look: Appearance, looks = 0): Appearance {
  return looks < LOOKS_VERSION && look.skin === OLD_DEFAULT_SKIN[id] ? { ...look, skin: lifePresets[id].skin } : look
}

/** Lay saved data over the defaults. Unknown or broken fields fall back to defaults. */
export function loadSaved(lives: Record<LifeId, LifeSim>, account: PlayerAccount): Loaded {
  const save = migrate(readKey(KEY) ?? OLDER_KEYS.map(readKey).find(Boolean), account.fiCoins)
  if (!save) return { lives, account, coinBase: account.fiCoins, mastery: {}, runs: {}, shop: emptyShop }
  const merged = { ...lives }
  const runs: Partial<Record<LifeId, CampaignRun>> = {}
  for (const id of Object.keys(lives) as LifeId[]) {
    const s = save.lives?.[id]
    if (s) {
      const customized = Boolean(s.customized)
      // Earlier builds saved plain role labels as names; those give way to the character names.
      const oldLabels = ['Freshman', 'Professional', 'Owner', 'Rookie']
      const savedName = oldLabels.includes(s.name) ? lives[id].name : s.name
      // The athlete's earlier default look, copied onto another life, is not a choice: restore that life's own start.
      const copiedCourt = id !== 'athlete' && JSON.stringify(s.appearance) === JSON.stringify({ ...lifePresets.athlete, skin: 'deep' })
      merged[id] = {
        ...lives[id],
        // Only a name the player chose is kept; earlier sample names give way to the neutral default.
        name: customized ? cleanName(savedName, lives[id].name) : lives[id].name,
        // A life the player never edited follows the current default look.
        appearance: customized && !copiedCourt ? newDefaultSkin(id, normalizeAppearance(s.appearance, lives[id].appearance), save.looks) : lives[id].appearance,
        customized,
      }
    }
    const run = save.runs?.[id]
    if (isPlayableRun(run, id)) runs[id] = run
    else if (run) {
      try {
        window.localStorage.setItem(`${KEY_UNREADABLE}.${id}`, JSON.stringify(run))
      } catch {
        // Nowhere to keep it; a new run starts either way.
      }
    }
  }
  const coinBase = isInt(save.account?.coinBase) && save.account.coinBase >= 0 ? save.account.coinBase : account.fiCoins
  const mastery = cleanMastery(save.player?.mastery)
  const shop = cleanShop(save.shop)
  // Shop-only clothing that is not owned (a damaged or foreign save) falls back to ordinary clothes.
  const bought = new Set(shop.owned)
  for (const id of Object.keys(merged) as LifeId[]) merged[id] = { ...merged[id], appearance: guardClothing(merged[id].appearance, bought, lives[id].appearance) }
  return {
    lives: merged,
    account: { ...account, username: save.account?.username === OLD_DEFAULT_USERNAME ? account.username : cleanName(save.account?.username, account.username), appearance: guardClothing(normalizeAppearance(save.account?.appearance, account.appearance), bought, account.appearance), fiCoins: coinBase + receiptCoins(mastery) - spentCoins(shop) },
    coinBase,
    mastery,
    runs,
    shop,
  }
}

/** Another tab's copy: its mastery (merged as a union) and any run it has advanced further. */
export function readStoredProgress(): { mastery: Mastery; runs: Partial<Record<LifeId, CampaignRun>>; shop: ShopState } | null {
  const save = readKey(KEY) as SaveFile | null
  if (!save || save.version !== 3) return null
  return { mastery: cleanMastery(save.player?.mastery), runs: save.runs ?? {}, shop: cleanShop(save.shop) }
}

/**
 * One write of the whole file, so an answer and its receipt are saved together.
 * Receipts already stored by another tab are merged in, never overwritten, and a
 * run another tab has advanced further is kept.
 */
export function writeSaved(lives: Record<LifeId, LifeSim>, account: PlayerAccount, coinBase: number, mastery: Mastery, runs: Record<LifeId, CampaignRun>, shop: ShopState = emptyShop) {
  const stored = readStoredProgress()
  const keptRuns = { ...runs }
  if (stored)
    for (const id of Object.keys(runs) as LifeId[]) {
      const other = stored.runs[id]
      if (other && other.runId === runs[id].runId && other.rev > runs[id].rev) keptRuns[id] = other
    }
  const file: SaveFile = {
    version: 3,
    lives: Object.fromEntries(
      (Object.keys(lives) as LifeId[]).map((id) => [id, { name: lives[id].name, appearance: lives[id].appearance, customized: lives[id].customized }]),
    ),
    account: { appearance: account.appearance, coinBase, username: account.username },
    player: { mastery: stored ? mergeMastery(stored.mastery, mastery) : mastery },
    runs: keptRuns,
    shop: stored ? mergeShop(shop, stored.shop) : shop,
    looks: LOOKS_VERSION,
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(file))
  } catch {
    // Storage blocked: the game still works, it just won't remember this visit.
  }
}

/** Run `fn` with the save file held exclusively across tabs (Web Locks), or directly where they don't exist. */
function exclusive<T>(fn: () => T): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  return locks ? locks.request('filife.save', fn) : Promise.resolve(fn())
}

export interface PurchaseRequest {
  itemId: string
  equip: boolean
  /** The starter items this account lists by name. */
  legacyNames: readonly string[]
  /** The item's art has loaded. */
  assetOk: boolean
}

export type PurchaseOutcome = PurchaseResult & { stored?: { mastery: Mastery; shop: ShopState } }

/**
 * The authoritative purchase. It re-reads the stored save inside the cross-tab lock, so a tab
 * showing a stale balance can neither overspend nor buy twice: it charges against what is
 * really saved, writes the receipt, ownership and loadout in one write, and reads the write
 * back. If the browser cannot store it, nothing is charged and the old save stands.
 */
export function purchase(req: PurchaseRequest): Promise<PurchaseOutcome> {
  return exclusive((): PurchaseOutcome => {
    const save = readKey(KEY) as SaveFile | null
    if (!save || save.version !== 3 || !isInt(save.account?.coinBase)) return { ok: false, reason: 'storage', balance: 0 }
    const mastery = cleanMastery(save.player?.mastery)
    const shop = cleanShop(save.shop)
    const balance = save.account.coinBase + receiptCoins(mastery) - spentCoins(shop)
    const item = shopItems.find((i) => i.id === req.itemId)
    const legacyOwned = Boolean(item && ownedIds(emptyShop, req.legacyNames, shopItems).has(req.itemId))
    const result = applyPurchase(shop, balance, req.itemId, { equip: req.equip, legacyOwned, assetOk: req.assetOk, now: Date.now() })
    if (!result.ok) return result
    if (result.shop === shop) return { ...result, stored: { mastery, shop } }
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...save, shop: result.shop }))
      const back = cleanShop((readKey(KEY) as SaveFile | null)?.shop)
      if (back.rev !== result.shop.rev || !back.owned.includes(req.itemId)) throw new Error('write did not stick')
    } catch {
      return { ok: false, reason: 'storage', balance }
    }
    return { ...result, stored: { mastery, shop: result.shop } }
  })
}
