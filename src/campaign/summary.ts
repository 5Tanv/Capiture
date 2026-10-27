import { calendars, dayLabel } from './calendar'
import { getEvent } from './content'
import { formatCents } from './money'
import { basisOf } from './portfolio'
import { ACCOUNT_NAMES, ROLES, STAT_LABELS } from './roles'
import { arrearsTotal, bal, chapterStart, flagOn, investmentValue, netWorth, receivablesTotal, stat, type CampaignRun, type LedgerEntry, type Stats } from './run'
import type { Playstyle } from './types'

// Chapter and ending summaries, written from the run's real ledger, stats and
// choices. The bands are narrative labels for a fictional story, not diagnoses.

export const thirdBand = (n: number) => (n < 40 ? 'needs support' : n < 70 ? 'developing' : 'strong')
export const stressBand = (n: number) => (n >= 70 ? 'overloaded' : n >= 40 ? 'pressured' : 'manageable')
export const happinessBand = (n: number) => (n < 35 ? 'disconnected' : n < 70 ? 'mixed' : 'fulfilled')

const sumAll = (l: LedgerEntry) => Object.values(l.accounts).reduce((s: number, v) => s + (v ?? 0), 0)

export interface ChapterSummary {
  chapter: number
  title: string
  earned: number
  costs: number
  purchases: number
  /** Moved into savings, reserves or the tax reserve: transfers, not spending. */
  setAside: number
  statsStart: Stats
  statsEnd: Stats
  lines: string[]
}

export function chapterSummary(r: CampaignRun, chapter: number): ChapterSummary {
  const entries = r.history.filter((h) => h.chapter === chapter)
  // A chapter owns the calendar from the day after the previous chapter's finale to its own finale.
  const prevDays = r.history.filter((h) => h.chapter === chapter - 1).map((h) => h.day)
  const lo = prevDays.length ? Math.max(...prevDays) : -1
  const hi = entries.length ? Math.max(...entries.map((h) => h.day)) : lo
  const prevEntry = r.history.find((h) => h.index === chapterStart(chapter) - 1)
  const statsStart: Stats = prevEntry ? prevEntry.statsAfter : { ...ROLES[r.role].initialStats }
  const statsEnd = entries.length ? entries[entries.length - 1].statsAfter : statsStart
  const inRange = r.ledger.filter((l) => l.day > lo && l.day <= hi)
  const total = (kinds: string[]) => inRange.filter((l) => kinds.includes(l.kind)).reduce((s, l) => s + sumAll(l), 0)
  const setAside = inRange
    .filter((l) => l.kind === 'transfer')
    .reduce((s, l) => s + Math.max(0, l.accounts.savings ?? 0) + Math.max(0, l.accounts.business_reserve ?? 0) + Math.max(0, l.accounts.tax_reserve ?? 0), 0)
  return {
    chapter,
    title: ROLES[r.role].chapters[chapter - 1],
    earned: total(['earning']),
    costs: -total(['bill', 'fee']),
    purchases: -total(['purchase']),
    setAside,
    statsStart,
    statsEnd,
    lines: entries.map((h) => `${h.title}: ${h.choiceLabel}`),
  }
}

export interface PlaystyleResult {
  /** null when no choices were tagged. */
  shares: { tag: Playstyle; count: number; share: number }[] | null
  primary: Playstyle[]
  secondary: Playstyle[]
  examples: Partial<Record<Playstyle, string[]>>
}

/** Share of tagged choices, rounded so the shares sum to exactly 100. Ties are reported as ties. */
export function playstyles(r: CampaignRun): PlaystyleResult {
  const tags = Object.entries(r.tags) as [Playstyle, number][]
  const total = tags.reduce((s, [, n]) => s + n, 0)
  const examples: Partial<Record<Playstyle, string[]>> = {}
  for (const h of r.history) {
    const choice = getEvent(h.eventId).choices.find((c) => c.id === h.choiceId)
    for (const t of choice?.playstyles ?? []) {
      const list = (examples[t] ??= [])
      if (list.length < 2) list.push(h.choiceLabel)
    }
  }
  if (total === 0) return { shares: null, primary: [], secondary: [], examples }
  const raw = tags.map(([tag, count]) => ({ tag, count, exact: (count * 100) / total }))
  const floors = raw.map((x) => ({ ...x, share: Math.floor(x.exact) }))
  let left = 100 - floors.reduce((s, x) => s + x.share, 0)
  for (const x of [...floors].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))) {
    if (left <= 0) break
    x.share += 1
    left -= 1
  }
  const shares = floors.map(({ tag, count, share }) => ({ tag, count, share })).sort((a, b) => b.count - a.count)
  const counts = [...new Set(shares.map((s) => s.count))].filter((c) => c > 0)
  const primary = shares.filter((s) => s.count === counts[0]).map((s) => s.tag)
  const secondary = counts[1] !== undefined ? shares.filter((s) => s.count === counts[1]).map((s) => s.tag) : []
  return { shares, primary, secondary, examples }
}

const OPENINGS: Record<CampaignRun['role'], string> = {
  college: 'A year after arriving at Riverbend State',
  adult: 'At the end of a full year of keeping the household together',
  business: 'At the end of a full year running the studio',
  athlete: 'At the end of your rookie year',
}

export function endingParagraphs(r: CampaignRun): string[] {
  const spec = ROLES[r.role]
  const p: string[] = []
  const inv = investmentValue(r)
  const earned = r.ledger.filter((l) => l.kind === 'earning').reduce((s, l) => s + sumAll(l), 0)
  const costs = -r.ledger.filter((l) => l.kind === 'bill' || l.kind === 'fee').reduce((s, l) => s + sumAll(l), 0)
  const accounts = spec.accounts.filter((a) => bal(r, a) !== 0 || a === spec.primaryAccount).map((a) => `${formatCents(bal(r, a))} in ${ACCOUNT_NAMES[a].toLowerCase()}`)
  p.push(
    `${OPENINGS[r.role]}, you have ${accounts.join(', ')}${inv > 0 ? `, plus ${formatCents(inv)} in the classroom portfolio` : ''}. Over the year ${formatCents(earned)} arrived as income and you covered ${formatCents(costs)} of routine costs and fees.`,
  )
  if (r.role === 'business')
    p.push('Owner draws and the tax reserve moved money between your own accounts. They are counted once, as transfers, not as extra income or as taxes paid.')
  if (r.role === 'athlete') p.push('Team pay stopped after August while living commitments continued, so the offseason ran on what you had kept.')
  const liabilities = [r.debt > 0 ? `${formatCents(r.debt)} of debt` : null, arrearsTotal(r) > 0 ? `${formatCents(arrearsTotal(r))} of unpaid costs` : null].filter(Boolean)
  p.push(
    `Your tracked net assets are ${formatCents(netWorth(r))}${liabilities.length ? `, after ${liabilities.join(' and ')}` : ''}${
      spec.receivablesInNetWorth && receivablesTotal(r) > 0 ? `, including ${formatCents(receivablesTotal(r))} earned and still on its way` : ''
    }. Personal possessions${r.role === 'business' ? ' and studio equipment' : ''}${r.role === 'college' ? ' and prepaid education' : ''} are not counted. This is a simplified game ledger, not a score.`,
  )
  if (inv > 0 || r.realizedCents !== 0) {
    p.push(
      `In the classroom simulation, your holdings show ${formatCents(inv - basisOf(r.lots), true)} unrealized and ${formatCents(r.realizedCents, true)} realized. Every run sees the same fictional price path, so these numbers reflect timing and amounts, not luck or quiz scores.`,
    )
  }
  const third = spec.thirdStat
  p.push(
    `${STAT_LABELS[third]} is ${stat(r, third)} (${thirdBand(stat(r, third))}), stress is ${stat(r, 'stress')} (${stressBand(stat(r, 'stress'))}), and happiness is ${stat(r, 'happiness')} (${happinessBand(
      stat(r, 'happiness'),
    )}). These describe the story you lived, not a grade or a diagnosis.`,
  )
  const future = r.deadlines.filter((d) => !d.resolved && d.day > calendars[r.role].lastDay)
  for (const d of future) p.push(`Still ahead after this story: ${d.label.toLowerCase()} on ${dayLabel(r.role, d.day)}.`)
  if (r.role === 'college') {
    const prep: string[] = []
    if (flagOn(r, 'final_prepared')) prep.push('prepared for your first finals')
    if (flagOn(r, 'draft_completed')) prep.push('revised a rushed draft')
    if (flagOn(r, 'tutoring_attended') || flagOn(r, 'peer_study') || flagOn(r, 'prepared_reading')) prep.push('kept up with study along the way')
    if (flagOn(r, 'spreadsheet_skill')) prep.push('built a spreadsheet skill')
    if (prep.length) p.push(`Along the way you ${prep.join(', ')}.`)
    const people: string[] = []
    if (flagOn(r, 'met_sam') || flagOn(r, 'sam_evening')) people.push('Sam')
    people.push('Alex')
    if (flagOn(r, 'mentor_contact') || r.history.some((h) => h.eventId === 'C123')) people.push('Professor Rivera')
    const summer = r.flags.summer_mode ? ` Your summer at the ${String(r.flags.summer_mode)} placement showed how a different pay schedule changes a budget.` : ''
    p.push(`You start sophomore year knowing ${people.join(', ')} better.${summer}`)
    if (r.flags.next_housing) p.push("Next year's housing remains a plan you have worked through, not a signed or funded commitment.")
  } else {
    const raise = r.payroll[r.payroll.length - 1]?.deltaCents ?? 0
    if (raise > 0) p.push(`The role change you negotiated added ${formatCents(raise)} to each paycheck from then on.`)
  }
  return p
}
