import { brokerageUnlocked } from '../../campaign/engine'
import { formatCents } from '../../campaign/money'
import { ASSET_NAMES, basisOf, formatUnits, unitsHeld, valueOf } from '../../campaign/portfolio'
import { ACCOUNT_NAMES, ROLES } from '../../campaign/roles'
import { arrearsTotal, bal, investmentValue, netWorth, receivablesTotal, type CampaignRun } from '../../campaign/run'
import type { AccountId, AssetId } from '../../campaign/types'

const ACCOUNT_NOTES: Partial<Record<AccountId, string>> = {
  checking: 'Spendable personal money',
  business_cash: 'The studio pays operating costs from here',
  business_reserve: 'Studio cushion; moving it is a transfer',
  tax_reserve: 'Set aside for taxes; not a tax payment',
}

/** Every account the character has, named, so no choice hides which one it uses. */
export function MoneyPanel({ run }: { run: CampaignRun }) {
  const spec = ROLES[run.role]
  const rows: [string, number, string?][] = spec.accounts.map((a) => [ACCOUNT_NAMES[a], bal(run, a), ACCOUNT_NOTES[a]])
  rows.push(['Classroom investments', investmentValue(run), 'Current value, fictional simulation; not cash until sold'])
  if (receivablesTotal(run) > 0)
    rows.push(['Earned, not yet received', receivablesTotal(run), spec.receivablesInNetWorth ? 'Completed work paid on its due date' : 'Completed work paid on its due date (not counted below)'])
  rows.push(['Debt', -run.debt, run.debt === 0 ? 'None: no choice in this story borrows money' : undefined])
  if (arrearsTotal(run, 'personal') > 0) rows.push(['Unpaid living costs', -arrearsTotal(run, 'personal'), 'Settled first from the next personal income; no fee or interest'])
  if (arrearsTotal(run, 'business') > 0) rows.push(['Unpaid studio costs', -arrearsTotal(run, 'business'), 'Settled first from the next client receipt; no fee or interest'])
  return (
    <div>
      <dl className="text-[14px] font-bold">
        {rows.map(([k, v, note]) => (
          <div key={k} className="flex items-start justify-between gap-3 border-t border-parch-300 py-1.5 first:border-t-0">
            <dt>
              {k}
              {note && <span className="block text-[12px] font-semibold text-ink-soft">{note}</span>}
            </dt>
            <dd className="shrink-0 tabular-nums">{formatCents(v)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t-2 border-ink py-1.5">
          <dt className="font-extrabold">Tracked net assets</dt>
          <dd className="font-extrabold tabular-nums">{formatCents(netWorth(run))}</dd>
        </div>
      </dl>
      <p className="text-[12px] font-semibold text-ink-soft">
        Counts accounts, investments{spec.receivablesInNetWorth ? ', earned receivables' : ''}, debt and unpaid costs. Transfers between your own accounts are counted once. Personal possessions
        {run.role === 'business' ? ' and studio equipment' : ''}
        {run.role === 'college' ? ' and prepaid tuition, dorm and meals' : ''} are not counted. A simplified game ledger, not a full financial statement.
      </p>
      {run.notices.map((n) => (
        <p key={n.id} className="mt-2 rounded-[8px] border-2 border-dashed border-xp-700 px-2 py-1 text-[12px] font-bold">
          {n.text}
        </p>
      ))}
    </div>
  )
}

/** The fictional portfolio: units, cost basis and value at today's classroom price. */
export function PortfolioPanel({ run }: { run: CampaignRun }) {
  const unlocked = brokerageUnlocked(run)
  const held = (['broad', 'single'] as AssetId[]).filter((a) => unitsHeld(run.lots, a) > 0)
  return (
    <div className="text-[14px] font-bold">
      {!unlocked ? (
        <p className="font-semibold">Cash investing opens after the brokerage lesson. Practice options are always free.</p>
      ) : held.length === 0 ? (
        <p className="font-semibold">No holdings. That is a valid choice; practice examples never count as money.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {held.map((a) => {
            const units = unitsHeld(run.lots, a)
            const value = valueOf(units, run.prices[a])
            const basis = basisOf(run.lots, a)
            return (
              <li key={a} className="rounded-[8px] border-2 border-parch-300 px-2.5 py-1.5">
                {ASSET_NAMES[a]}
                <span className="block text-[12px] font-semibold text-ink-soft tabular-nums">
                  {formatUnits(units)} units × {formatCents(run.prices[a])} = {formatCents(value)} · paid {formatCents(basis)} · {formatCents(value - basis, true)} unrealized
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {run.realizedCents !== 0 && <p className="mt-1.5">Realized from sales: {formatCents(run.realizedCents, true)}</p>}
      <p className="mt-1.5 text-[12px] font-semibold text-ink-soft">
        Classroom simulation: every run uses the same disclosed fictional price path, already a simplified total return (no separate dividends or fund fees). Your choices, name and quiz answers never change prices.
      </p>
    </div>
  )
}
