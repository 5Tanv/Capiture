import { ASSET_NAMES, formatUnits, quoteBuy, quoteSell, sellFifo, type Lot, type Prices } from './portfolio'
import { ACCOUNT_NAMES } from './roles'
import type { AccountId, ChoiceDef, MoneyOp } from './types'

export function formatCents(cents: number, signed = false) {
  const abs = Math.abs(cents)
  const body = `$${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`
  if (cents < 0) return `−${body}`
  return signed && cents > 0 ? `+${body}` : body
}

const name = (a: AccountId) => ACCOUNT_NAMES[a].toLowerCase()

export interface PreviewState {
  accounts: Partial<Record<AccountId, number>>
  lots: Lot[]
  prices: Prices
  /** Cash investing is open (after the brokerage lesson). */
  brokerage: boolean
}

export interface OpPreview {
  op: MoneyOp
  ok: boolean
  /** Actual cents moved: may be less than requested for up-to operations. */
  amount: number
  units?: number
  text: string
  reason?: string
}

/** What each operation of a choice would actually do right now, evaluated in order. */
export function previewChoice(b: PreviewState, choice: Pick<ChoiceDef, 'money'>): { ok: boolean; ops: OpPreview[] } {
  const bal: Partial<Record<AccountId, number>> = { ...b.accounts }
  const get = (a: AccountId) => bal[a] ?? 0
  const add = (a: AccountId, n: number) => (bal[a] = get(a) + n)
  let lots = b.lots
  const ops: OpPreview[] = []
  for (const op of choice.money) {
    switch (op.op) {
      case 'spend': {
        const have = get(op.account)
        if (have < op.cents) {
          ops.push({
            op,
            ok: false,
            amount: 0,
            text: `${formatCents(op.cents)} from ${name(op.account)}`,
            reason: `You have ${formatCents(have)} in ${name(op.account)}: ${formatCents(op.cents - have)} short.`,
          })
        } else {
          add(op.account, -op.cents)
          ops.push({ op, ok: true, amount: op.cents, text: `${formatCents(op.cents)} from ${name(op.account)}` })
        }
        break
      }
      case 'earn':
        add(op.account, op.cents)
        ops.push({ op, ok: true, amount: op.cents, text: `+${formatCents(op.cents)} to ${name(op.account)}` })
        break
      case 'schedule_income':
        ops.push({ op, ok: true, amount: op.cents, text: `+${formatCents(op.cents)} to ${name(op.account)} in ${op.afterDays} days (earned now, paid then)` })
        break
      case 'transfer_up_to': {
        const amount = Math.min(op.cents, get(op.source))
        if (amount <= 0) {
          ops.push({ op, ok: false, amount: 0, text: `Move to ${name(op.destination)}`, reason: `There is nothing in ${name(op.source)} to move.` })
        } else {
          add(op.source, -amount)
          add(op.destination, amount)
          ops.push({
            op,
            ok: true,
            amount,
            text: `Moves ${formatCents(amount)} from ${name(op.source)} to ${name(op.destination)}${amount < op.cents ? ` (all there is, of ${formatCents(op.cents)} asked)` : ''}`,
          })
        }
        break
      }
      case 'buy_up_to': {
        if (op.requiresBrokerage && !b.brokerage) {
          ops.push({
            op,
            ok: false,
            amount: 0,
            text: `Buy ${ASSET_NAMES[op.asset]}`,
            reason: 'Cash investing opens after the brokerage lesson. The practice options teach the same idea.',
          })
          break
        }
        const budget = Math.min(op.cents, get(op.account) - op.bufferCents)
        const q = quoteBuy(budget, b.prices[op.asset])
        if (q.units <= 0) {
          ops.push({
            op,
            ok: false,
            amount: 0,
            text: `Buy ${ASSET_NAMES[op.asset]}`,
            reason: `Purchases keep ${formatCents(op.bufferCents)} in ${name(op.account)}. You have ${formatCents(get(op.account))}, so there is nothing to invest. The practice options still teach the same idea.`,
          })
        } else {
          add(op.account, -q.cost)
          ops.push({
            op,
            ok: true,
            amount: q.cost,
            units: q.units,
            text: `Buys ${formatUnits(q.units)} units at ${formatCents(b.prices[op.asset])} each for ${formatCents(q.cost)} (classroom simulation)`,
          })
        }
        break
      }
      case 'sell_up_to': {
        const q = quoteSell(lots, op.asset, op.cents, b.prices[op.asset])
        if (q.owned === 0) {
          ops.push({ op, ok: false, amount: 0, text: `Sell ${ASSET_NAMES[op.asset]}`, reason: `You don't own any of the ${ASSET_NAMES[op.asset]}, so there is nothing to sell.` })
        } else if (q.proceeds <= 0) {
          ops.push({ op, ok: false, amount: 0, text: `Sell ${ASSET_NAMES[op.asset]}`, reason: 'Your holding is too small to sell for at least one cent.' })
        } else {
          lots = sellFifo(lots, op.asset, q.units).lots
          add(op.destination, q.proceeds)
          ops.push({
            op,
            ok: true,
            amount: q.proceeds,
            units: q.units,
            text: `Sells ${formatUnits(q.units)} units at ${formatCents(b.prices[op.asset])} for ${formatCents(q.proceeds)} (classroom simulation)`,
          })
        }
        break
      }
    }
  }
  return { ok: ops.every((o) => o.ok), ops }
}
