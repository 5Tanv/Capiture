import { useState, type ReactNode } from 'react'
import { summerPlace } from '../../campaign/callbacks'
import { calendars, dayLabel } from '../../campaign/calendar'
import { getEvent, lessonByKey } from '../../campaign/content'
import { SUMMER_ROLES, nextFeeDay, nextUnpaidSummerPay, upcomingBills, upcomingIncome } from '../../campaign/engine'
import type { Mastery } from '../../campaign/mastery'
import { formatCents } from '../../campaign/money'
import { ACCOUNT_NAMES, ROLES } from '../../campaign/roles'
import { flagOn, type CampaignRun } from '../../campaign/run'
import { useGameDispatch } from '../../state/GameProvider'
import type { CampaignOp } from '../../state/gameReducer'
import { SupportActions } from '../event/CampaignEventModal'
import { Icon } from '../ui/Icon'
import { MoneyPanel, PortfolioPanel } from './MoneyPanel'
import { LedgerLine, StatChips } from './parts'

// The character's notebook: what they've learned, what's coming up, their
// commitments and what they decided. It reads the run; it is not a second ledger.

const COLLEGE_GOALS: Record<string, (v: unknown) => string> = {
  budget_plan: () => 'Keep the first-term budget plan',
  spring_priority: (v) => `Spring priority: ${v}`,
  housing_goal: () => 'Save toward a $400 housing deposit (a planning target, nothing is due)',
  next_housing: (v) => `Next year's housing: ${String(v).replace(/_/g, ' ')}`,
  long_term_plan: (v) => `Long-term plan: ${v}`,
  return_plan: (v) => `Return-to-campus list: ${v}`,
  ending_priority: (v) => `Sophomore-year focus: ${v}`,
}

/** Written priorities from the other lives' choices, e.g. "reflection.review_priority" → "Review priority: reserves". */
function plans(run: CampaignRun): string[] {
  if (run.role === 'college')
    return Object.entries(run.flags)
      .filter(([k, v]) => COLLEGE_GOALS[k] && v !== false)
      .map(([k, v]) => COLLEGE_GOALS[k](v))
  return Object.entries(run.flags)
    .filter(([k, v]) => typeof v === 'string' && /(priority|plan|preference)$/.test(k))
    .map(([k, v]) => {
      const name = k.split('.')[1].replace(/_/g, ' ')
      return `${name[0].toUpperCase()}${name.slice(1)}: ${String(v).replace(/_/g, ' ')}`
    })
}

function Card({ title, icon, children }: { title: string; icon: Parameters<typeof Icon>[0]['name']; children: ReactNode }) {
  return (
    <section className="surface-reading px-4 py-3" aria-label={title}>
      <h3 className="font-display flex items-center gap-2 text-[18px] leading-tight">
        <Icon name={icon} className="h-6 w-6" />
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export function Notebook({ run, mastery }: { run: CampaignRun; mastery: Mastery }) {
  const dispatch = useGameDispatch()
  const step = (s: CampaignOp) => dispatch({ type: 'campaign', step: s })
  const income = upcomingIncome(run).slice(0, 4)
  const bills = upcomingBills(run)
  const fee = nextFeeDay(run)
  const out = run.items.filter((i) => i.status === 'out')
  const deadlines = run.deadlines.filter((d) => !d.resolved && d.kind !== 'item_ready')
  const goals = plans(run)
  const learned = [...new Map(run.history.map((h) => [h.lessonKey, h])).values()]
  const switchFrom = run.role === 'college' && run.flags.summer_mode ? nextUnpaidSummerPay(run) : null
  const [placement, setPlacement] = useState('')
  const [confirmRole, setConfirmRole] = useState(false)
  const raise = run.payroll[run.payroll.length - 1]
  const people =
    run.role === 'college'
      ? ([
          { name: 'Alex', role: 'Roommate', note: flagOn(run, 'roommate_agreement') ? 'You have a written roommate agreement.' : 'Shares your room in Maple Hall.' },
          flagOn(run, 'met_sam') || run.history.some((h) => /Sam/.test(getEvent(h.eventId).scenario))
            ? { name: 'Sam', role: 'Friend', note: flagOn(run, 'met_sam') ? 'You met at the welcome dinner.' : 'A friend from your hall.' }
            : null,
          run.index > 2 ? { name: 'Morgan', role: 'Supervisor', note: 'Runs your campus job schedule.' } : null,
          run.history.some((h) => /Rivera/.test(getEvent(h.eventId).scenario))
            ? { name: 'Professor Rivera', role: flagOn(run, 'mentor_contact') ? 'Mentor' : 'Professor', note: flagOn(run, 'mentor_contact') ? 'Gave feedback on your scholarship draft.' : 'Teaches one of your courses.' }
            : null,
        ].filter(Boolean) as { name: string; role: string; note: string }[])
      : []

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Money" icon="bank">
        <MoneyPanel run={run} />
      </Card>

      <Card title="Coming up" icon="hourglass">
        <ul className="flex flex-col gap-1.5 text-[14px] font-bold">
          {income.map((p) => (
            <li key={`${p.label}-${p.day}`}>
              {formatCents(p.cents)} in, {dayLabel(run.role, p.day)} <span className="font-semibold text-ink-soft">({p.label} → {ACCOUNT_NAMES[p.account].toLowerCase()})</span>
            </li>
          ))}
          {bills.map((b) => (
            <li key={`${b.label}-${b.day}`}>
              {formatCents(b.cents)} out, {dayLabel(run.role, b.day)} <span className="font-semibold text-ink-soft">({b.label} from {ACCOUNT_NAMES[b.account].toLowerCase()})</span>
            </li>
          ))}
          {fee !== null && (
            <li>
              <button type="button" onClick={() => step({ op: 'feeFree' })} className="btn-3d btn-parch min-h-9 w-full rounded-[8px] px-2 text-[13px] font-extrabold">
                Switch to fee-free checking (free, before the next fee)
              </button>
            </li>
          )}
          {raise && raise.deltaCents > 0 && (
            <li className="font-semibold">
              Confirmed raise: +{formatCents(raise.deltaCents)} per paycheck from {dayLabel(run.role, raise.fromDay)}.
            </li>
          )}
          {deadlines.map((d) => (
            <li key={d.id}>
              {d.label}: {dayLabel(run.role, d.day)}
              {d.day > calendars[run.role].lastDay ? ' (after this story ends)' : ''}
            </li>
          ))}
          {out.map((i) => (
            <li key={i.id}>
              To resolve at the end of Chapter {i.dueChapter}: {i.label}
            </li>
          ))}
          {income.length === 0 && bills.length === 0 && deadlines.length === 0 && out.length === 0 && <li className="font-semibold">Nothing scheduled.</li>}
        </ul>
        {switchFrom !== null && (
          <div className="mt-3 rounded-[10px] border-2 border-parch-300 px-3 py-2">
            <p className="text-[13px] font-bold">
              Summer work: {summerPlace(run.flags.summer_mode)}, {formatCents(SUMMER_ROLES[String(run.flags.summer_mode)] ?? 0)} every two weeks.
            </p>
            <label className="mt-1.5 block text-[12px] font-extrabold text-ink-soft" htmlFor="role-switch">
              Switch placement (applies from {dayLabel('college', switchFrom)}; pay already earned is kept)
            </label>
            <div className="mt-1 flex gap-2">
              <select
                id="role-switch"
                value={placement}
                onChange={(e) => {
                  setPlacement(e.target.value)
                  setConfirmRole(false)
                }}
                className="min-h-10 min-w-0 flex-1 rounded-[8px] border-2 border-ink bg-parch-100 px-2 text-[13px] font-bold"
              >
                <option value="">Choose…</option>
                {Object.entries(SUMMER_ROLES)
                  .filter(([r]) => r !== run.flags.summer_mode)
                  .map(([r, c]) => (
                    <option key={r} value={r}>
                      {summerPlace(r)} · {formatCents(c)}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!placement}
                onClick={() => {
                  if (!confirmRole) setConfirmRole(true)
                  else {
                    step({ op: 'summerRole', role: placement })
                    setPlacement('')
                    setConfirmRole(false)
                  }
                }}
                className="btn-3d btn-parch min-h-10 rounded-[8px] px-3 text-[13px] font-extrabold disabled:opacity-50"
              >
                {confirmRole ? 'Confirm switch' : 'Switch'}
              </button>
            </div>
          </div>
        )}
        <SupportActions run={run} step={step} />
      </Card>

      <Card title="Investments" icon="sprout">
        <PortfolioPanel run={run} />
      </Card>

      <Card title="What you've learned here" icon="book">
        {learned.length === 0 ? (
          <p className="text-[14px] font-semibold">Lessons you meet on this road are collected here. Every lesson is also open in Learn.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {learned.map((h) => (
              <li key={h.lessonKey}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'openLesson', lessonKey: h.lessonKey })}
                  className="rounded-full border-2 border-ink bg-xp-300 px-2.5 py-0.5 text-[12px] font-extrabold hover:-translate-y-0.5"
                >
                  {lessonByKey(h.lessonKey)?.title ?? h.lessonKey}
                  {mastery[h.lessonKey]?.completed ? ' ✓' : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={run.role === 'college' ? 'Goals and people' : 'Plans on record'} icon="person">
        {goals.length > 0 ? (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[14px] font-bold">
            {goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] font-semibold">No plans written down yet.</p>
        )}
        {people.length > 0 && (
          <ul className="mt-2.5 flex flex-col gap-1 border-t-2 border-dashed border-parch-300 pt-2 text-[14px]">
            {people.map((p) => (
              <li key={p.name} className="font-bold">
                {p.name} <span className="text-[12px] font-extrabold text-ink-soft uppercase">{p.role}</span>
                <span className="block text-[13px] font-semibold text-ink-soft">{p.note}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[12px] font-semibold text-ink-soft">{ROLES[run.role].title}: practice choices record a preference only. No policy, loan, match or ownership share exists unless a choice actually moved money.</p>
      </Card>

      <Card title="Decision history" icon="road">
        <History run={run} />
      </Card>
    </div>
  )
}

function History({ run }: { run: CampaignRun }) {
  const [open, setOpen] = useState<number | null>(null)
  if (run.history.length === 0) return <p className="text-[14px] font-semibold">Your decisions will be written here.</p>
  return (
    <ol className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto pr-1">
      {[...run.history].reverse().map((h) => (
        <li key={h.index} className="rounded-[8px] border-2 border-parch-300">
          <button type="button" onClick={() => setOpen(open === h.index ? null : h.index)} aria-expanded={open === h.index} className="w-full px-2.5 py-1.5 text-left">
            <span className="block text-[12px] font-extrabold text-ink-soft">
              Ch. {h.chapter} · {dayLabel(run.role, h.day)}
            </span>
            <span className="block text-[14px] font-extrabold">{h.title}</span>
            <span className="block text-[13px] font-semibold">{h.choiceLabel}</span>
          </button>
          {open === h.index && (
            <div className="border-t-2 border-parch-300 px-2.5 py-2">
              <p className="text-[13px] font-semibold">{h.rationale}</p>
              <StatChips changes={h.statChanges} className="mt-1.5" />
              <ul className="mt-1">
                {run.ledger
                  .filter((l) => h.ledgerIds.includes(l.id))
                  .map((l) => (
                    <LedgerLine key={l.id} e={l} role={run.role} />
                  ))}
              </ul>
              {h.notes.map((n) => (
                <p key={n} className="text-[12px] font-bold text-ink-soft">
                  {n}
                </p>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
