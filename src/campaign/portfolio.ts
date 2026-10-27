import type { AssetId } from './types'

// The fictional classroom portfolio. Units are integer millionths of a unit;
// prices and money are integer cents. FIFO lots keep cost basis exact.

export const UNIT = 1_000_000

export interface Lot {
  id: string
  asset: AssetId
  units: number
  basisCents: number
  day: number
}

export type Prices = Record<AssetId, number>

export const ASSET_NAMES: Record<AssetId, string> = {
  broad: 'Broad Stock Fund (fictional)',
  single: 'Single Company Stock (fictional)',
}

/** How many units a budget buys and what it actually costs. Cost never exceeds the budget. */
export function quoteBuy(budgetCents: number, price: number) {
  if (budgetCents <= 0) return { units: 0, cost: 0 }
  const units = Math.floor((budgetCents * UNIT) / price)
  const cost = Math.ceil((units * price) / UNIT)
  return { units, cost }
}

export const unitsHeld = (lots: Lot[], asset: AssetId) => lots.filter((l) => l.asset === asset).reduce((s, l) => s + l.units, 0)

export const valueOf = (units: number, price: number) => Math.floor((units * price) / UNIT)

/** Each position is valued on its own (floor), then summed. */
export function portfolioValue(lots: Lot[], prices: Prices) {
  return valueOf(unitsHeld(lots, 'broad'), prices.broad) + valueOf(unitsHeld(lots, 'single'), prices.single)
}

export const basisOf = (lots: Lot[], asset?: AssetId) =>
  lots.filter((l) => !asset || l.asset === asset).reduce((s, l) => s + l.basisCents, 0)

/** Units sold and proceeds for a requested amount, capped by what is owned. */
export function quoteSell(lots: Lot[], asset: AssetId, requestCents: number, price: number) {
  const owned = unitsHeld(lots, asset)
  const units = Math.min(Math.floor((requestCents * UNIT) / price), owned)
  return { units, proceeds: valueOf(units, price), owned }
}

/** Remove units first-in-first-out. Basis on a partly sold lot is split with floor; the remainder stays on the lot. */
export function sellFifo(lots: Lot[], asset: AssetId, units: number): { lots: Lot[]; basisSold: number } {
  let left = units
  let basisSold = 0
  const out: Lot[] = []
  for (const lot of lots) {
    if (lot.asset !== asset || left === 0) {
      out.push(lot)
      continue
    }
    if (lot.units <= left) {
      left -= lot.units
      basisSold += lot.basisCents
      continue
    }
    const part = Math.floor((lot.basisCents * left) / lot.units)
    basisSold += part
    out.push({ ...lot, units: lot.units - left, basisCents: lot.basisCents - part })
    left = 0
  }
  if (left !== 0) throw new Error('Tried to sell more units than are owned')
  return { lots: out, basisSold }
}

export function formatUnits(units: number) {
  return (units / UNIT).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}
