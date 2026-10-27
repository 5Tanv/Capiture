import { dayLabel } from './calendar'
import { formatCents } from './money'
import { basisOf, portfolioValue, quoteBuy, unitsHeld, valueOf, formatUnits, type Prices } from './portfolio'
import { ACCOUNT_NAMES, ROLES } from './roles'
import { arrearsTotal, bal, flagOn, investmentValue, receivablesTotal, stat, type CampaignRun, type HistoryEntry } from './run'
import { getEvent } from './content'
import type { EventDef } from './types'

// Story memory. Each entry reads the run's actual flags, history and balances and
// returns extra lines for the scene. Nothing is assumed: if an optional event did
// not happen, its callback is simply left out and the authored scene stands alone.
// The college lines are authored per event; the other lives use the structured
// callbacks in their packs.

export interface SceneExtras {
  /** Lines shown after the authored scenario. */
  lines: string[]
  /** C123/C124: earlier practice lowers the chosen option's stress by one more point. */
  prepModifier: boolean
  /** Work events that began with high stress: accepting these choices adds stress. */
  workload: { choiceIds: string[]; stress: number } | null
}

export const PREP_LINE = 'Earlier practice helps you start this review with a clearer plan.'
export const DEPOSIT_TARGET_CENTS = 40000

const SUMMER_PLACES: Record<string, string> = {
  campus: 'the familiar campus placement with Morgan',
  local: 'the busier local placement in town',
  skills: 'the skills placement with protected study time',
  community: 'the community placement',
}

export const summerPlace = (role: unknown) => SUMMER_PLACES[String(role)] ?? 'your summer placement'

const recall = (r: CampaignRun, eventId: string): HistoryEntry | undefined => r.history.find((h) => h.eventId === eventId)
const quote = (label: string) => `“${label.replace(/\.$/, '')}”`
const ledgerAmount = (l: { accounts: Partial<Record<string, number>> }) => Object.values(l.accounts).reduce((s: number, v) => s + (v ?? 0), 0)

/** Preparation that makes the C123/C124 review easier, from any earlier event. */
export function hasPreparation(r: CampaignRun) {
  return flagOn(r, 'prepared_reading') || flagOn(r, 'tutoring_attended') || flagOn(r, 'peer_study')
}

export function prepModifierApplies(r: CampaignRun, eventId: string) {
  return (eventId === 'C123' || eventId === 'C124') && hasPreparation(r) && !flagOn(r, 'prep_modifier_used')
}

/** The workload modifier for the open event, decided when it began. */
export function workloadFor(r: CampaignRun, ev: EventDef) {
  const cb = ev.callbacks.find((c) => c.type === 'workload_modifier')
  return cb && cb.type === 'workload_modifier' && r.current?.eventId === ev.id && r.current.workload ? { choiceIds: cb.choiceIds, stress: cb.stress } : null
}

function holdingsLines(r: CampaignRun, prices: Prices, focus?: 'broad' | 'single'): string[] {
  const broad = unitsHeld(r.lots, 'broad')
  const single = unitsHeld(r.lots, 'single')
  if (broad === 0 && single === 0) {
    const h = quoteBuy(2000, 10000)
    return [
      `You hold no actual investments, so this uses a hypothetical example (practice only): $20.00 of the broad fund bought at $100.00 would be worth ${formatCents(valueOf(h.units, prices.broad))} at today's $${(prices.broad / 100).toFixed(2)} price.`,
    ]
  }
  const out: string[] = []
  const describe = (asset: 'broad' | 'single', units: number, name: string) => {
    if (units === 0) return
    out.push(`Your actual ${name}: ${formatUnits(units)} units worth ${formatCents(valueOf(units, prices[asset]))} today; you paid ${formatCents(basisOf(r.lots, asset))}.`)
  }
  describe('broad', broad, 'broad-fund holding')
  describe('single', single, 'single-stock holding')
  if (focus && unitsHeld(r.lots, focus) === 0) out.push(`You own none of the ${focus === 'broad' ? 'broad fund' : 'single stock'}, so selling it isn't possible here.`)
  return out
}

// ── College ────────────────────────────────────────────────────────────────

function semesterRecap(r: CampaignRun): string[] {
  const lines: string[] = []
  const room = flagOn(r, 'decorated_room') ? 'the room you decorated on day one' : flagOn(r, 'dorm_exchange') ? 'the room you set up from the dorm exchange' : 'the room you set up in August'
  const friends = [flagOn(r, 'met_sam') || flagOn(r, 'sam_evening') ? 'Sam' : null, 'Alex'].filter(Boolean).join(' and ')
  lines.push(`Packing up ${room}, you think about the first weeks with ${friends}.`)
  if (flagOn(r, 'saved_paycheck')) lines.push('Setting money aside from your first paycheck gave you a cushion to lean on.')
  else if (flagOn(r, 'celebrated_payday')) lines.push('You still remember celebrating that first paycheck with a meal.')
  for (const [id, lead] of [
    ['C106', 'For your meal plan'],
    ['C108', 'At the club fair'],
    ['C111', 'For the weekend trip'],
    ['C113', "For your family's gift"],
    ['C114', 'Faced with the small-payment offer'],
    ['C118', 'With the old controller'],
    ['C121', 'For the winter coat'],
  ] as const) {
    const h = recall(r, id)
    if (h) lines.push(`${lead}, you chose ${quote(h.choiceLabel)}.`)
  }
  const prepared = flagOn(r, 'final_prepared') || hasPreparation(r)
  if (flagOn(r, 'draft_completed')) lines.push('You revised the rushed draft with the writing center, and it is finished now.')
  else if (flagOn(r, 'draft_kept')) lines.push('You kept the submitted draft and wrote down a plan for the next deadline.')
  if (prepared) lines.push('The study preparation you put in this term made finals week more manageable.')
  else if (flagOn(r, 'final_rest')) lines.push('Choosing sleep before finals kept you steadier, even with a shorter review.')
  if (stat(r, 'stress') >= 70) lines.push('The semester has left you feeling stretched; rest over break matters.')
  const earned = r.ledger.filter((l) => l.kind === 'earning').reduce((s, l) => s + ledgerAmount(l), 0)
  const bills = r.ledger.filter((l) => l.kind === 'bill' || l.kind === 'fee').reduce((s, l) => s - ledgerAmount(l), 0)
  lines.push(
    `This semester: ${formatCents(earned)} earned, ${formatCents(bills)} in routine costs and fees. Checking ${formatCents(bal(r, 'checking'))}, savings ${formatCents(bal(r, 'savings'))}.`,
  )
  if (arrearsTotal(r) > 0) lines.push(`${formatCents(arrearsTotal(r))} of living costs is still unpaid; your next paycheck settles it first.`)
  return lines
}

function housingOpening(r: CampaignRun): string[] {
  const lines: string[] = []
  const interest = r.flags.housing_interest
  if (interest === 'apartment') lines.push('You visited the apartment with Alex in January and kept your list of questions.')
  else if (interest === 'compare') lines.push("Your January comparison of the apartment's yearly cost against the dorm is still in your notes.")
  else if (interest === 'dorm') lines.push('In January you asked the housing office about a dorm place, and you still lean that way.')
  else if (interest === 'support') lines.push('In January you looked into affordable campus housing support.')
  if (flagOn(r, 'shared_kit')) lines.push('You and Alex already share the used kitchen kit you bought together.')
  else if (flagOn(r, 'roommate_agreement')) lines.push('You and Alex already have a written roommate agreement.')
  if (flagOn(r, 'housing_goal') || flagOn(r, 'deposit_target_pending') || r.history.some((h) => h.eventId === 'C207')) {
    const savings = bal(r, 'savings')
    const gap = Math.max(0, DEPOSIT_TARGET_CENTS - savings)
    lines.push(
      gap === 0
        ? `Your savings of ${formatCents(savings)} already cover the $400.00 deposit planning target. It is still a plan, and nothing is due.`
        : `Toward the $400.00 deposit planning target, your savings of ${formatCents(savings)} leave a gap of ${formatCents(gap)}.`,
    )
  }
  return lines
}

function collegeLines(r: CampaignRun, ev: EventDef, prepModifier: boolean): string[] {
  const lines: string[] = []
  switch (ev.id) {
    case 'C107':
      if (flagOn(r, 'saved_paycheck')) lines.push('The money you moved to savings after your first paycheck is there for exactly this kind of surprise.')
      lines.push(`Right now you have ${formatCents(bal(r, 'checking'))} in checking and ${formatCents(bal(r, 'savings'))} in savings.`)
      break
    case 'C109':
      lines.push(flagOn(r, 'met_sam') ? 'You first met Sam at the welcome dinner on move-in day.' : 'Sam lives down the hall; you have only chatted a few times.')
      break
    case 'C115':
    case 'C116': {
      const t = recall(r, 'C105')
      if (t) lines.push(`Your transport choice from September (${quote(t.choiceLabel)}) shapes how you plan this trip.`)
      break
    }
    case 'C123':
    case 'C124':
      if (r.flags.textbook === 'library') lines.push('Your booked reserve-copy sessions at the library already give you a study rhythm.')
      if (prepModifier) lines.push(PREP_LINE)
      break
    case 'C125':
      lines.push(...semesterRecap(r))
      break
    case 'C201':
      if (flagOn(r, 'scholarship_application'))
        lines.push('Your scholarship application from November is still being reviewed. The statement shows no award, so you plan with confirmed aid only.')
      break
    case 'C209':
      if (r.flags.laptop) lines.push("September's laptop repair is a reminder of why this cushion matters.")
      break
    case 'C210':
    case 'C211':
    case 'C212':
    case 'C213':
    case 'C214': {
      const f = recall(r, 'C120')
      if (f) lines.push(`You remember November's urgent message, when you chose ${quote(f.choiceLabel)}. Checking the source first still applies.`)
      break
    }
    case 'C225': {
      for (const id of ['C202', 'C203', 'C204', 'C223', 'C224']) {
        const h = recall(r, id)
        if (h) lines.push(`Earlier this spring you explored work by choosing ${quote(h.choiceLabel)}.`)
      }
      if (flagOn(r, 'spreadsheet_skill')) lines.push('Your spreadsheet training is listed on your placement form, though no placement is guaranteed by it.')
      if (flagOn(r, 'inventory_lead') || flagOn(r, 'inventory_training')) lines.push('Your inventory leadership experience is on your placement form too.')
      const club = recall(r, 'C108')
      if (club) lines.push(`Your fall club choice (${quote(club.choiceLabel)}) comes up in the interview.`)
      break
    }
    case 'C301': {
      const pay = Number(r.flags.summer_pay ?? 0)
      lines.push(`You start at ${summerPlace(r.flags.summer_mode)}: $${pay.toFixed(2)} take-home every two weeks, first paid on Jun 15. Living costs are $70.00 a week.`)
      lines.push('If you switch placements, the change applies only from your next unpaid pay period.')
      break
    }
    case 'C302':
    case 'C303': {
      const pay = r.ledger.find((l) => l.kind === 'earning' && l.id.startsWith('summerpay:'))
      if (pay) lines.push(`${formatCents(ledgerAmount(pay))} arrived on ${dayLabel('college', pay.day)} from ${summerPlace(r.flags.summer_mode)}.`)
      break
    }
    case 'C305': {
      if (flagOn(r, 'gig_done')) {
        const gig = r.ledger.find((l) => l.eventId === 'C211' && l.kind === 'earning')
        const materials = r.ledger.find((l) => l.eventId === 'C211' && l.kind === 'purchase')
        lines.push(
          `Your flyer gig goes in the folder too: ${gig ? `${formatCents(ledgerAmount(gig))} received on ${dayLabel('college', gig.day)}` : 'the payment record'}${
            materials ? `, with a ${formatCents(-ledgerAmount(materials))} materials receipt` : ', made with approved free materials'
          }.`,
        )
      }
      if (flagOn(r, 'summer_stub_checked')) lines.push('You add the June pay statement you already checked.')
      break
    }
    case 'C307':
    case 'C317':
    case 'C319':
      lines.push(...housingOpening(r))
      break
    case 'C318': {
      const preferredDorm = r.flags.housing_interest === 'dorm' || r.flags.housing_interest === 'support' || flagOn(r, 'deposit_target_pending')
      if (preferredDorm) lines.push("The apartment was Alex's option; you had been leaning toward campus housing, so your own plan hasn't changed.")
      else lines.push(...housingOpening(r))
      break
    }
    case 'C309': {
      const laptop = r.flags.laptop
      if (laptop === 'semester_loaner') lines.push('The educator uses your campus loaner laptop as an example: who pays if a borrowed device breaks?')
      else if (laptop) lines.push("The educator uses September's laptop problem as an example of what insurance can and cannot cover.")
      if (r.flags.housing_interest) lines.push("Next year's housing plan makes renters insurance worth understanding too.")
      break
    }
    case 'C313':
      lines.push(...holdingsLines(r, r.prices, 'broad'))
      break
    case 'C314':
      lines.push(...holdingsLines(r, r.prices, 'single'))
      break
    case 'C315':
      lines.push(...holdingsLines(r, r.prices))
      break
    case 'C316':
      lines.push(...concentrationLines(r))
      if (r.history.some((h) => h.eventId === 'C308')) lines.push('What you learned about bonds earlier this summer fits into the plan.')
      break
    case 'C320':
      lines.push(`Checking ${formatCents(bal(r, 'checking'))}, savings ${formatCents(bal(r, 'savings'))}, investments ${formatCents(investmentValue(r))}.`)
      if (r.flags.next_housing || r.flags.housing_interest) lines.push("Next year's housing is a plan you have worked on, not a funded guarantee.")
      if (r.flags.return_plan === 'saving') lines.push('The return-to-campus list is planned spending, not a separate pot of money.')
      break
  }
  return lines
}

function concentrationLines(r: CampaignRun): string[] {
  const total = portfolioValue(r.lots, r.prices)
  if (total === 0) return ['Your portfolio is empty, so the plan starts from savings and future contributions. That is a valid starting point.']
  const broadV = valueOf(unitsHeld(r.lots, 'broad'), r.prices.broad)
  const singleV = valueOf(unitsHeld(r.lots, 'single'), r.prices.single)
  const largest = Math.max(broadV, singleV)
  const share = Math.round((largest / total) * 100)
  return [
    `Your largest position is ${share}% of your ${formatCents(total)} portfolio${
      singleV === largest && share > 50 ? ', in a single company: concentrated.' : share === 100 ? ', in one broad fund that itself holds many companies.' : '.'
    }`,
    `Realized result so far: ${formatCents(r.realizedCents, true)}. Unrealized: ${formatCents(total - basisOf(r.lots), true)}.`,
  ]
}

// ── The other lives: structured callbacks ──────────────────────────────────

/** The chapter recap built from the real ledger, receivables, holdings and open follow-ups. */
export function recapLines(r: CampaignRun): string[] {
  const spec = ROLES[r.role]
  const lines: string[] = []
  const income = r.ledger.filter((l) => l.kind === 'earning').reduce((s, l) => s + ledgerAmount(l), 0)
  const costs = -r.ledger.filter((l) => l.kind === 'bill' || l.kind === 'fee').reduce((s, l) => s + ledgerAmount(l), 0)
  lines.push(`So far this year: ${formatCents(income)} received as income and ${formatCents(costs)} in routine costs and fees. Transfers between your own accounts are counted in neither.`)
  lines.push(spec.accounts.map((a) => `${ACCOUNT_NAMES[a]} ${formatCents(bal(r, a))}`).join(' · ') + '.')
  if (receivablesTotal(r) > 0) lines.push(`${formatCents(receivablesTotal(r))} is earned and on its way (receivable), not yet cash.`)
  if (investmentValue(r) > 0) lines.push(`Classroom investments are worth ${formatCents(investmentValue(r))} today; that value is not cash until sold.`)
  if (arrearsTotal(r) > 0) lines.push(`${formatCents(arrearsTotal(r))} of routine costs is still unpaid and will be settled first from the next income.`)
  const open = r.deadlines.filter((d) => !d.resolved && d.kind !== 'item_ready')
  for (const d of open) lines.push(`Still open: ${d.label} (${dayLabel(r.role, d.day)}).`)
  return lines
}

function structuredLines(r: CampaignRun, ev: EventDef): string[] {
  const lines: string[] = []
  for (const cb of ev.callbacks) {
    if (cb.type === 'prior_choice_text') {
      const h = recall(r, cb.eventId)
      const choice = h && getEvent(h.eventId).choices.find((c) => c.id === h.choiceId)
      if (h && choice && cb.flags.some((f) => f in choice.flags)) {
        lines.push(`Earlier, in “${h.title}”, you chose ${quote(h.choiceLabel)}. What you can pay today still comes from your actual balances.`)
      }
    } else if (cb.type === 'actual_holdings') {
      if (r.history.some((h) => h.eventId === cb.eventId)) lines.push(...holdingsLines(r, r.prices))
      else
        lines.push(
          `Cash investing hasn't opened in this story yet, so this uses a labeled paper example: $20.00 of a broad fund at $100.00 would be worth ${formatCents(valueOf(quoteBuy(2000, 10000).units, r.prices.broad))} at today's price.`,
        )
    } else if (cb.type === 'chapter_summary') {
      lines.push(...recapLines(r))
    }
  }
  return lines
}

export function sceneExtras(r: CampaignRun, ev: EventDef): SceneExtras {
  const prepModifier = r.role === 'college' && prepModifierApplies(r, ev.id)
  const workload = workloadFor(r, ev)
  const lines = r.role === 'college' ? collegeLines(r, ev, prepModifier) : structuredLines(r, ev)
  if (workload) lines.push(`You're already stretched (stress ${stat(r, 'stress')}). Taking on this extra work adds ${workload.stress} more stress; declining stays free.`)
  return { lines, prepModifier, workload }
}
