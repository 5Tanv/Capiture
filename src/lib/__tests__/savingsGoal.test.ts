import { describe, expect, it } from 'vitest'
import { gameReducer, initialState } from '../../state/gameReducer'
import { applyGoal, applyPurchase, cleanShop, emptyShop, goalStatus, mergeShop } from '../shopStore'

const dragon = 'shop.pet.auric-star-dragon'
const tabby = 'shop.pet.pocket-tabby'
const none = new Set<string>()

describe('savings goal', () => {
  it('is free to set, change and clear, and never touches coins or equipment', () => {
    let s = gameReducer(initialState, { type: 'shopGoal', itemId: dragon })
    expect(s.shop.goalId).toBe(dragon)
    expect(s.account.fiCoins).toBe(initialState.account.fiCoins)
    expect(s.shop.owned).toEqual([])
    expect(s.shop.equipped).toEqual({})
    expect(s.shop.receipts).toEqual([])
    s = gameReducer(s, { type: 'shopGoal', itemId: tabby })
    expect(s.shop.goalId).toBe(tabby)
    s = gameReducer(s, { type: 'shopGoal', itemId: null })
    expect(s.shop.goalId).toBeNull()
  })

  it('refuses owned, unknown, or unpriced items as goals', () => {
    expect(applyGoal(emptyShop, new Set([tabby]), tabby).goalId).toBeNull()
    expect(applyGoal(emptyShop, none, 'shop.nope').goalId).toBeNull()
  })

  it('tracks the live price and real balance through each state', () => {
    expect(goalStatus(null, none, 50)).toEqual({ kind: 'none' })
    expect(goalStatus(dragon, none, 100)).toMatchObject({ kind: 'saving', remaining: 500 })
    // Over the price: reached, and nothing is bought.
    expect(goalStatus(dragon, none, 900)).toMatchObject({ kind: 'reached' })
    expect(goalStatus(dragon, new Set([dragon]), 0)).toMatchObject({ kind: 'collected' })
    expect(goalStatus('shop.retired.thing', none, 900)).toEqual({ kind: 'unavailable', item: undefined })
  })

  it('recognizes the goal as collected after it is bought in the shop, and keeps the goal', () => {
    const shop = applyGoal(emptyShop, none, dragon)
    const r = applyPurchase(shop, 700, dragon, { equip: false, legacyOwned: false, assetOk: true, now: 1 })
    if (!r.ok) throw new Error('purchase failed')
    expect(r.shop.goalId).toBe(dragon)
    expect(goalStatus(r.shop.goalId, new Set(r.shop.owned), 100).kind).toBe('collected')
  })

  it('survives a save round trip and merges with the newer copy winning', () => {
    const saved = cleanShop(JSON.parse(JSON.stringify(applyGoal(emptyShop, none, dragon))))
    expect(saved.goalId).toBe(dragon)
    const older = { ...emptyShop, goalId: tabby, rev: 0 }
    expect(mergeShop(older, saved).goalId).toBe(dragon)
    expect(cleanShop({ owned: [], goalId: 42 }).goalId).toBeNull()
  })
})
