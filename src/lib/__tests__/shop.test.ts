import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hasRenderer, shopItems, itemsById, SLOTS, type Slot } from '../../data/shop'
import { newCatalogRaw } from '../../data/shopCatalog'
import { accountPreset, guardClothing, premiumClothing, randomAppearance } from '../../sprites/catalog'
import { drawCharacter } from '../../sprites/draw'
import { purchase, writeSaved } from '../saveStore'
import { sampleLives } from '../../data/lives'
import { sampleAccount } from '../../data/account'
import { createRun } from '../../campaign/run'
import { roleOfLife } from '../../campaign/roles'
import { lifeOrder } from '../../data/lives'
import {
  applyEquip,
  applyPurchase,
  cleanShop,
  emptyShop,
  mergeShop,
  ownedIds,
  resolveLoadout,
  spentCoins,
  type ShopState,
} from '../shopStore'

const ok = { equip: true, legacyOwned: false, assetOk: true, now: 1 }

describe('catalog', () => {
  it('merges the 35 new items with the originals, ids unique, prices intact', () => {
    expect(newCatalogRaw).toHaveLength(35)
    expect(new Set(shopItems.map((i) => i.id)).size).toBe(shopItems.length)
    expect(itemsById['teal-cap'].price).toBe(160)
    expect(itemsById['maple']).toBeUndefined()
    expect(itemsById['shades'].price).toBe(180)
    expect(itemsById['shop.pet.auric-star-dragon'].price).toBe(600)
  })

  it('counts per new category', () => {
    const n = (s: Slot) => shopItems.filter((i) => i.slot === s && i.id.startsWith('shop.')).length
    expect([n('title'), n('background'), n('pet'), n('frame'), n('effect')]).toEqual([16, 4, 4, 6, 5])
  })

  it('every item has a renderer or art, and its slot is known', () => {
    for (const i of shopItems) {
      expect(SLOTS).toContain(i.slot)
      expect(hasRenderer(i)).toBe(true)
      expect(i.price).toBeGreaterThan(0)
    }
  })

  it('effects use at most eight particles', () => {
    for (const i of shopItems) if (i.slot === 'effect') expect(i.maxParticles).toBeLessThanOrEqual(8)
  })

  it('premium clothing is wired to real shop items and draws something different from the base', () => {
    for (const [look, id] of Object.entries(premiumClothing)) {
      const item = itemsById[id]
      expect(item, id).toBeTruthy()
      const patch = item.slot === 'top' || item.slot === 'bottom' ? item.patch : {}
      expect(Object.values(patch)).toContain(look)
    }
    const base = { ...accountPreset, top: 'jacket', bottom: 'slacks' } as typeof accountPreset
    const cells = (a: typeof base) => JSON.stringify(drawCharacter(a).cells)
    for (const t of ['starlight', 'royalcoat', 'dragonmail', 'galacoat'] as const) expect(cells({ ...base, top: t })).not.toBe(cells(base))
    for (const b of ['gilded', 'starfall', 'royalpants', 'sequin'] as const) expect(cells({ ...base, bottom: b })).not.toBe(cells(base))
  })

  it('random looks never roll shop-only clothes', () => {
    for (let s = 1; s < 200; s++) {
      const a = randomAppearance(s * 7919)
      expect(a.top in premiumClothing).toBe(false)
      expect(a.bottom in premiumClothing).toBe(false)
    }
  })

  it('shop-only clothes fall back unless owned', () => {
    const wearing = { ...accountPreset, top: 'galacoat', bottom: 'sequin' } as typeof accountPreset
    const bare = guardClothing(wearing, new Set(), accountPreset)
    expect(bare.top).toBe(accountPreset.top)
    expect(bare.bottom).toBe(accountPreset.bottom)
    const owned = new Set([premiumClothing.galacoat, premiumClothing.sequin])
    expect(guardClothing(wearing, owned, accountPreset)).toBe(wearing)
  })
})

describe('applyPurchase', () => {
  const dragon = 'shop.pet.auric-star-dragon'

  it('Buy & equip debits once, records one receipt, equips only that slot', () => {
    const shop: ShopState = { ...emptyShop, equipped: { title: 'shop.title.penny-planner' } }
    const r = applyPurchase(shop, 700, dragon, ok)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.charged).toBe(600)
    expect(r.shop.receipts).toHaveLength(1)
    expect(r.shop.receipts[0]).toMatchObject({ itemId: dragon, price: 600, balanceAfter: 100 })
    expect(r.shop.equipped).toEqual({ title: 'shop.title.penny-planner', pet: dragon })
    expect(spentCoins(r.shop)).toBe(600)
  })

  it('Buy only owns without equipping', () => {
    const r = applyPurchase(emptyShop, 700, dragon, { ...ok, equip: false })
    expect(r.ok && r.shop.owned).toEqual([dragon])
    expect(r.ok && r.shop.equipped).toEqual({})
  })

  it('refuses with the exact shortfall and changes nothing', () => {
    const r = applyPurchase(emptyShop, 560, dragon, ok)
    expect(r).toEqual({ ok: false, reason: 'insufficient', need: 40, balance: 560 })
  })

  it('does not sell when the art did not load', () => {
    expect(applyPurchase(emptyShop, 9999, dragon, { ...ok, assetOk: false })).toMatchObject({ ok: false, reason: 'asset' })
  })

  it('an owned item is a no-charge request, repeated requests are idempotent', () => {
    const first = applyPurchase(emptyShop, 700, dragon, ok)
    if (!first.ok) throw new Error('setup')
    const again = applyPurchase(first.shop, 100, dragon, ok)
    expect(again).toMatchObject({ ok: true, charged: 0, alreadyOwned: true })
    expect(again.ok && again.shop.receipts).toHaveLength(1)
    const burst = [1, 2, 3].reduce((s) => {
      const r = applyPurchase(s, 100, dragon, ok)
      return r.ok ? r.shop : s
    }, first.shop)
    expect(spentCoins(burst)).toBe(600)
  })

  it('unknown ids are rejected', () => {
    expect(applyPurchase(emptyShop, 9999, 'shop.nope', ok)).toMatchObject({ ok: false, reason: 'unknown' })
  })
})

describe('equip and loadout', () => {
  it('equipping needs ownership and a matching slot; None needs neither', () => {
    const owned = new Set(['shop.title.penny-planner'])
    expect(applyEquip(emptyShop, owned, 'title', 'shop.title.smart-saver')).toBe(emptyShop)
    expect(applyEquip(emptyShop, owned, 'pet', 'shop.title.penny-planner')).toBe(emptyShop)
    const on = applyEquip(emptyShop, owned, 'title', 'shop.title.penny-planner')
    expect(on.equipped.title).toBe('shop.title.penny-planner')
    expect(applyEquip(on, owned, 'title', null).equipped.title).toBeNull()
  })

  it('an unknown historical owned id survives and renders nothing', () => {
    const shop = cleanShop({ owned: ['retired.hat', 'shop.title.penny-planner'], equipped: { headwear: 'retired.hat' }, receipts: [], rev: 2 })
    expect(shop.owned).toContain('retired.hat')
    const owned = ownedIds(shop, [], shopItems)
    expect(resolveLoadout(shop, owned).headwear).toBeUndefined()
  })

  it('owned lists never lose items on merge, and the newer loadout wins', () => {
    const a: ShopState = { owned: ['x'], equipped: { title: 'x' }, receipts: [], goalId: 'x', rev: 1 }
    const b: ShopState = { owned: ['y'], equipped: { title: null }, receipts: [], goalId: null, rev: 3 }
    const m = mergeShop(a, b)
    expect(m.owned.sort()).toEqual(['x', 'y'])
    expect(m.equipped.title).toBeNull()
  })
})

// ---- the authoritative, lock-protected purchase against a fake browser store -------------------
class FakeStorage {
  data = new Map<string, string>()
  failWrites = false
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new Error('quota')
    this.data.set(k, v)
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
}

describe('purchase (authoritative store)', () => {
  let store: FakeStorage
  const runs = Object.fromEntries(lifeOrder.map((id) => [id, createRun(roleOfLife[id], 1)])) as Parameters<typeof writeSaved>[4]
  const save = (coinBase: number) => writeSaved(sampleLives, { ...sampleAccount, fiCoins: coinBase }, coinBase, {}, runs)
  beforeEach(() => {
    store = new FakeStorage()
    ;(globalThis as any).window = { localStorage: store }
    save(700)
  })
  afterEach(() => {
    delete (globalThis as any).window
  })
  const req = (itemId: string, equip = true) => ({ itemId, equip, legacyNames: [] as string[], assetOk: true })

  it('charges once even when several requests race', async () => {
    const results = await Promise.all([purchase(req('shop.pet.auric-star-dragon')), purchase(req('shop.pet.auric-star-dragon')), purchase(req('shop.pet.auric-star-dragon'))])
    expect(results.filter((r) => r.ok && r.charged === 600)).toHaveLength(1)
    expect(results.every((r) => r.ok)).toBe(true)
    const saved = JSON.parse(store.getItem('filife.save.v3')!)
    expect(saved.shop.receipts).toHaveLength(1)
    expect(spentCoins(cleanShop(saved.shop))).toBe(600)
  })

  it('a stale second window cannot overspend', async () => {
    expect((await purchase(req('shop.pet.auric-star-dragon'))).ok).toBe(true)
    const r = await purchase(req('shop.background.gilded-dragon-vault'))
    expect(r).toMatchObject({ ok: false, reason: 'insufficient', need: 200, balance: 100 })
  })

  it('a failed write keeps the old wallet, ownership and loadout', async () => {
    const before = store.getItem('filife.save.v3')
    store.failWrites = true
    const r = await purchase(req('shop.title.penny-planner'))
    expect(r).toMatchObject({ ok: false, reason: 'storage' })
    expect(store.getItem('filife.save.v3')).toBe(before)
  })

  it('does not touch lives, mastery or life money', async () => {
    const before = JSON.parse(store.getItem('filife.save.v3')!)
    await purchase(req('shop.title.penny-planner'))
    const after = JSON.parse(store.getItem('filife.save.v3')!)
    expect(after.lives).toEqual(before.lives)
    expect(after.runs).toEqual(before.runs)
    expect(after.player).toEqual(before.player)
    expect(after.account.coinBase).toBe(before.account.coinBase)
  })
})
