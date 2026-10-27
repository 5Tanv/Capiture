import { getItem, hasRenderer, PURCHASE_REASON, SLOTS, type ShopItem, type Slot } from '../data/shop'

// The shop's durable state: what the player owns, what each slot wears, and the receipts of
// every cosmetic purchase. It is separate from learning rewards (mastery receipts) and from a
// life's money. The FiCoin balance is `earned - spent`, where `spent` is the sum of these
// receipts, so a purchase can never be double counted: the receipt is the debit.
//
// A preview (the unowned item being tried on) is deliberately not in here. It lives in the Shop
// screen and is discarded when the player cancels or leaves.

export interface ShopReceipt {
  /** One receipt per item: `shop-receipt:<item id>`. Merging tabs by id makes a retry harmless. */
  id: string
  itemId: string
  /** The name when bought, for the receipt list if the item is ever retired. */
  name: string
  price: number
  reason: typeof PURCHASE_REASON
  at: number
  balanceAfter: number
  equipped: boolean
}

export interface ShopState {
  /** Stable item ids bought in the shop. Unknown ids are kept so a retired item is never lost. */
  owned: string[]
  /** Per slot: an item id, or null for "none" (an explicit choice). Missing means the slot's default. */
  equipped: Partial<Record<Slot, string | null>>
  receipts: ShopReceipt[]
  /** Item the player is saving toward. Free to set: it reserves no coins and buys nothing. */
  goalId: string | null
  /** Bumped by every change, so another tab's newer loadout wins when saves merge. */
  rev: number
}

export const emptyShop: ShopState = { owned: [], equipped: {}, receipts: [], goalId: null, rev: 0 }

export const spentCoins = (s: ShopState) => s.receipts.reduce((sum, r) => sum + r.price, 0)

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 120

/** Read whatever was stored. Anything malformed is dropped, but unknown (retired) ids survive. */
export function cleanShop(raw: unknown): ShopState {
  if (!raw || typeof raw !== 'object') return emptyShop
  const r = raw as Record<string, any>
  const owned = Array.isArray(r.owned) ? [...new Set(r.owned.filter(isStr))] : []
  const equipped: ShopState['equipped'] = {}
  if (r.equipped && typeof r.equipped === 'object') {
    for (const slot of SLOTS) {
      const v = r.equipped[slot]
      if (v === null || isStr(v)) equipped[slot] = v
    }
  }
  const seen = new Set<string>()
  const receipts: ShopReceipt[] = []
  if (Array.isArray(r.receipts)) {
    for (const x of r.receipts) {
      if (!x || !isStr(x.id) || !isStr(x.itemId) || seen.has(x.id)) continue
      if (!Number.isInteger(x.price) || x.price < 0) continue
      seen.add(x.id)
      receipts.push({
        id: x.id,
        itemId: x.itemId,
        name: typeof x.name === 'string' ? x.name.slice(0, 60) : x.itemId,
        price: x.price,
        reason: PURCHASE_REASON,
        at: Number.isFinite(x.at) ? x.at : 0,
        balanceAfter: Number.isFinite(x.balanceAfter) ? x.balanceAfter : 0,
        equipped: Boolean(x.equipped),
      })
    }
  }
  // Every receipt's item is owned, even if the owned list was damaged.
  for (const rc of receipts) if (!owned.includes(rc.itemId)) owned.push(rc.itemId)
  return { owned, equipped, receipts, goalId: isStr(r.goalId) ? r.goalId : null, rev: Number.isInteger(r.rev) && r.rev >= 0 ? r.rev : 0 }
}

/** Union of two copies of the shop (this tab and another). Nothing owned or paid is ever lost. */
export function mergeShop(a: ShopState, b: ShopState): ShopState {
  const receipts = [...a.receipts]
  for (const r of b.receipts) if (!receipts.some((x) => x.id === r.id)) receipts.push(r)
  receipts.sort((x, y) => x.at - y.at)
  const owned = [...new Set([...a.owned, ...b.owned])]
  // The loadout and goal from the newer copy win; on a tie, `a` (this tab) does.
  const newer = b.rev > a.rev ? b : a
  return { owned, equipped: { ...newer.equipped }, receipts, goalId: newer.goalId, rev: Math.max(a.rev, b.rev) }
}

export const sameShop = (a: ShopState, b: ShopState) => JSON.stringify(a) === JSON.stringify(b)

/** Everything the player owns: bought ids plus the starter items the account lists by name. */
export function ownedIds(shop: ShopState, legacyNames: readonly string[], all: readonly ShopItem[]): Set<string> {
  const out = new Set(shop.owned)
  for (const i of all) if ('ownedAs' in i && legacyNames.includes(i.ownedAs)) out.add(i.id)
  return out
}

export type Loadout = Partial<Record<Slot, ShopItem>>

/**
 * What each slot is actually showing. Unowned or unknown ids render nothing (the safe
 * fallback).
 */
export function resolveLoadout(shop: ShopState, owned: ReadonlySet<string>): Loadout {
  const out: Loadout = {}
  for (const slot of SLOTS) {
    const id = shop.equipped[slot]
    if (id === null || id === undefined) continue
    const item = getItem(id)
    if (item && item.slot === slot && owned.has(id)) out[slot] = item
  }
  return out
}

export type PurchaseFailure = 'unknown' | 'unavailable' | 'insufficient' | 'asset' | 'storage'
export type PurchaseResult =
  | { ok: true; shop: ShopState; charged: number; receipt: ShopReceipt | null; alreadyOwned: boolean }
  | { ok: false; reason: PurchaseFailure; need?: number; balance: number }

interface BuyOptions {
  equip: boolean
  /** The starter items this account already owns by name. */
  legacyOwned: boolean
  /** The item's art has loaded (always true for items drawn in code). */
  assetOk: boolean
  now: number
}

/**
 * The one place a debit is decided. Pure: given the authoritative balance and shop, it either
 * returns the new shop (with exactly one receipt) or a failure that changes nothing.
 * An item already owned is a no-charge request, optionally equipping it.
 */
export function applyPurchase(shop: ShopState, balance: number, itemId: string, o: BuyOptions): PurchaseResult {
  const item = getItem(itemId)
  if (!item) return { ok: false, reason: 'unknown', balance }
  if (!hasRenderer(item) || !Number.isInteger(item.price) || item.price <= 0) return { ok: false, reason: 'unavailable', balance }
  const owns = o.legacyOwned || shop.owned.includes(itemId)
  if (owns) {
    if (!o.equip || shop.equipped[item.slot] === itemId) return { ok: true, shop, charged: 0, receipt: null, alreadyOwned: true }
    return { ok: true, shop: { ...shop, equipped: { ...shop.equipped, [item.slot]: itemId }, rev: shop.rev + 1 }, charged: 0, receipt: null, alreadyOwned: true }
  }
  if (!o.assetOk) return { ok: false, reason: 'asset', balance }
  if (balance < item.price) return { ok: false, reason: 'insufficient', need: item.price - balance, balance }
  const receipt: ShopReceipt = {
    id: `shop-receipt:${itemId}`,
    itemId,
    name: item.name,
    price: item.price,
    reason: PURCHASE_REASON,
    at: o.now,
    balanceAfter: balance - item.price,
    equipped: o.equip,
  }
  return {
    ok: true,
    shop: {
      ...shop,
      owned: [...shop.owned, itemId],
      // Buy & equip changes only the bought item's slot; every other slot stays as it was.
      equipped: o.equip ? { ...shop.equipped, [item.slot]: itemId } : shop.equipped,
      receipts: [...shop.receipts, receipt],
      rev: shop.rev + 1,
    },
    charged: item.price,
    receipt,
    alreadyOwned: false,
  }
}

/** Equip (or, with null, unequip) a slot. Free, and only for items the player owns. */
export function applyEquip(shop: ShopState, owned: ReadonlySet<string>, slot: Slot, itemId: string | null): ShopState {
  if (shop.equipped[slot] === itemId) return shop
  if (itemId !== null) {
    const item = getItem(itemId)
    if (!item || item.slot !== slot || !owned.has(itemId)) return shop
  }
  return { ...shop, equipped: { ...shop.equipped, [slot]: itemId }, rev: shop.rev + 1 }
}

export function applyUnequipAll(shop: ShopState): ShopState {
  const equipped = Object.fromEntries(SLOTS.map((s) => [s, null])) as ShopState['equipped']
  return sameShop({ ...shop, equipped }, shop) ? shop : { ...shop, equipped, rev: shop.rev + 1 }
}

/** Can this item be bought with FiCoins at all (in the catalog, drawable, priced)? */
export const isForSale = (item: ShopItem | undefined): item is ShopItem => Boolean(item && hasRenderer(item) && Number.isInteger(item.price) && item.price > 0)

export type GoalStatus =
  | { kind: 'none' }
  | { kind: 'unavailable'; item: ShopItem | undefined }
  | { kind: 'collected'; item: ShopItem }
  | { kind: 'reached'; item: ShopItem }
  | { kind: 'saving'; item: ShopItem; remaining: number }

/** The savings goal, derived from the live catalog price and the real balance. Nothing is cached. */
export function goalStatus(goalId: string | null, owned: ReadonlySet<string>, balance: number): GoalStatus {
  if (!goalId) return { kind: 'none' }
  const item = getItem(goalId)
  // Bought anywhere in the shop counts, even if the item has since been retired.
  if (owned.has(goalId)) return item ? { kind: 'collected', item } : { kind: 'unavailable', item }
  if (!isForSale(item)) return { kind: 'unavailable', item }
  return balance >= item.price ? { kind: 'reached', item } : { kind: 'saving', item, remaining: item.price - balance }
}

/** Pick (or with null, clear) the goal. Owned or unsellable items can't become goals. */
export function applyGoal(shop: ShopState, owned: ReadonlySet<string>, itemId: string | null): ShopState {
  if (shop.goalId === itemId) return shop
  if (itemId !== null && (owned.has(itemId) || !isForSale(getItem(itemId)))) return shop
  return { ...shop, goalId: itemId, rev: shop.rev + 1 }
}
