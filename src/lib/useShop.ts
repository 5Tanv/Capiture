import { useMemo } from 'react'
import { shopItems } from '../data/shop'
import type { Appearance } from '../sprites/catalog'
import { useGame } from '../state/GameProvider'
import { ownedIds, resolveLoadout, type Loadout } from './shopStore'

/** The account's avatar wearing whatever is equipped. Equipment overlays the avatar; it never rewrites it. */
export function wornLook(base: Appearance, loadout: Loadout): Appearance {
  const patch = (slot: 'headwear' | 'eyewear' | 'top' | 'bottom') => {
    const item = loadout[slot]
    return item && item.slot === slot ? item.patch : null
  }
  return { ...base, ...patch('top'), ...patch('bottom'), ...patch('headwear'), ...patch('eyewear') }
}

/** What the player owns and what each slot shows right now (no preview). */
export function useShopView() {
  const { account, shop } = useGame()
  const legacyNames = useMemo(() => account.accessories, [account.accessories])
  const owned = useMemo(() => ownedIds(shop, legacyNames, shopItems), [shop, legacyNames])
  const loadout = useMemo(() => resolveLoadout(shop, owned), [shop, owned])
  const look = useMemo(() => wornLook(account.appearance, loadout), [account.appearance, loadout])
  return { account, shop, legacyNames, owned, loadout, look }
}
