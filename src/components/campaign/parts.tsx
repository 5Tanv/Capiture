import { dayLabel } from '../../campaign/calendar'
import { formatCents } from '../../campaign/money'
import { ACCOUNT_NAMES, STAT_LABELS } from '../../campaign/roles'
import type { LedgerEntry, Stats } from '../../campaign/run'
import type { AccountId, RoleId, StatKey } from '../../campaign/types'

// Small pieces shared by the event dialog, notebook, Learn and summaries.

export const statNames = STAT_LABELS

/** Up is good for happiness and the role stat; down is good for stress. The word carries the meaning, not only the color. */
export function StatChip({ stat, delta, note }: { stat: StatKey; delta: number; note?: string }) {
  const good = stat === 'stress' ? delta < 0 : delta > 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-[12px] font-extrabold tabular-nums ${
        delta === 0 ? 'bg-parch-300 text-ink' : good ? 'bg-cash-300 text-ink' : 'bg-[#ffd2c2] text-ink'
      }`}
    >
      {STAT_LABELS[stat]} {delta > 0 ? '+' : delta < 0 ? '−' : '±'}
      {Math.abs(delta)}
      {note && <span className="font-bold text-ink-soft">({note})</span>}
    </span>
  )
}

export function StatChips({ changes, className = '' }: { changes: Stats; className?: string }) {
  const keys = (Object.keys(changes) as StatKey[]).filter((k) => changes[k] !== undefined)
  if (keys.length === 0) return <p className={`text-[13px] font-bold text-ink-soft ${className}`}>No change to life stats.</p>
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {keys.map((k) => (
        <StatChip key={k} stat={k} delta={changes[k] ?? 0} />
      ))}
    </div>
  )
}

const KIND_NAMES: Record<LedgerEntry['kind'], string> = {
  earning: 'Income',
  purchase: 'Purchase',
  transfer: 'Transfer',
  bill: 'Bill',
  fee: 'Fee',
  investment: 'Investment',
  sale: 'Sale',
  settlement: 'Unpaid costs settled',
}

const lower = (a: string) => ACCOUNT_NAMES[a as AccountId].toLowerCase()

/** Which account a line moved, in words. */
export function ledgerAmount(e: LedgerEntry) {
  const moves = Object.entries(e.accounts).filter(([, v]) => v)
  if (e.kind === 'transfer' && moves.length === 2) {
    const from = moves.find(([, v]) => (v ?? 0) < 0)!
    const to = moves.find(([, v]) => (v ?? 0) > 0)!
    return `${formatCents(to[1]!)} ${lower(from[0])} → ${lower(to[0])}`
  }
  if (e.kind === 'settlement') {
    const settled = -Object.values(e.arrears).reduce((s: number, v) => s + (v ?? 0), 0)
    return `${formatCents(settled)} to unpaid costs`
  }
  const parts = moves.map(([a, v]) => `${formatCents(v!, true)} ${lower(a)}`)
  const recorded = Object.values(e.arrears).reduce((s: number, v) => s + Math.max(0, v ?? 0), 0)
  if (recorded > 0) parts.push(`${formatCents(recorded)} unpaid`)
  return parts.join(' · ') || '$0.00'
}

export function LedgerLine({ e, role, tone = 'light' }: { e: LedgerEntry; role: RoleId; tone?: 'light' | 'dark' }) {
  const net = Object.values(e.accounts).reduce((s: number, v) => s + (v ?? 0), 0)
  const neutral = e.kind === 'transfer' || e.kind === 'settlement'
  return (
    <li className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t py-1.5 first:border-t-0 ${tone === 'light' ? 'border-parch-300' : 'border-white/10'}`}>
      <span className="min-w-0 text-[13px] leading-snug font-bold">
        <span className={tone === 'light' ? 'text-ink-soft' : 'text-sage-300'}>
          {dayLabel(role, e.day)} · {KIND_NAMES[e.kind]}
        </span>
        <span className="block">{e.label}</span>
        {e.detail && <span className={`block text-[12px] font-semibold ${tone === 'light' ? 'text-ink-soft' : 'text-sage-300'}`}>{e.detail}</span>}
      </span>
      <span
        className={`shrink-0 text-[13px] font-extrabold tabular-nums ${
          neutral ? '' : net < 0 ? (tone === 'light' ? 'text-ember-700' : 'text-[#ffb59f]') : tone === 'light' ? 'text-cash-700' : 'text-cash-300'
        }`}
      >
        {ledgerAmount(e)}
      </span>
    </li>
  )
}
