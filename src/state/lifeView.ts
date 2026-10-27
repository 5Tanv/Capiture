import { calendars, dayLabel } from '../campaign/calendar'
import { summerPlace } from '../campaign/callbacks'
import { getEvent, lessonForEvent } from '../campaign/content'
import { eventDay } from '../campaign/engine'
import { ACCOUNT_NAMES, ROLES, STAT_LABELS } from '../campaign/roles'
import { arrearsTotal, bal, chapterOf, chapterStart, investmentValue, receivablesTotal, stat, type CampaignRun } from '../campaign/run'
import type { RoadEvent } from '../data/chapters'
import type { LifeSim } from '../types/game'

// Every life is played through its campaign run. These helpers present the run
// through the LifeSim shape the rest of the app already draws, so the HUD, life
// card and lobby keep working. Money stays in the run, in integer cents.

const POSITIONS = [15, 15, 10]
const THIRD_SHORT: Record<string, string> = { academics: 'Academics', job_performance: 'Job', business_reputation: 'Reputation', athletic_performance: 'Athletics' }

export function runChapter(run: CampaignRun) {
  const number = run.finished ? 3 : chapterOf(run.index)
  const total = POSITIONS[number - 1]
  return { number, title: ROLES[run.role].chapters[number - 1], eventIndex: run.finished ? total : run.index - chapterStart(number), eventTotal: total }
}

function situation(run: CampaignRun): string {
  if (run.finished)
    return run.role === 'college' ? 'Back at Riverbend State for sophomore year, with a year of real decisions behind you.' : 'The year is complete. Your road and notebook keep every decision.'
  const ev = getEvent(run.positions[run.index].eventId)
  const when = dayLabel(run.role, eventDay(ev), true)
  switch (run.role) {
    case 'college':
      if (run.index >= 30) return `${when}. Summer at ${summerPlace(run.flags.summer_mode)}; living costs are $70 a week.`
      return `${when}. The campus job pays $180 take-home every two weeks, and necessities cost $60 a week.`
    case 'adult':
      return `${when}. Net pay is $1,500 every two weeks; household necessities are $1,300 every two weeks.`
    case 'business':
      return `${when}. The studio receives $5,000 every two weeks and pays $2,500 in operating costs; you draw $1,500 to personal checking after each receipt.`
    case 'athlete':
      return eventDay(ev) > calendars.athlete.toDay(1, '08-31')
        ? `${when}. Offseason: no team pay until next season, while $5,000 of living commitments continue every two weeks.`
        : `${when}. Team pay is $12,000 every two weeks through August; living commitments are $5,000 every two weeks.`
  }
}

export function lifeView(life: LifeSim, run: CampaignRun): LifeSim {
  const spec = ROLES[run.role]
  const otherCash = spec.accounts.filter((a) => a !== spec.primaryAccount).reduce((s, a) => s + bal(run, a), 0)
  const receivables = spec.receivablesInNetWorth ? receivablesTotal(run) : 0
  return {
    ...life,
    archetype: spec.title,
    cash: bal(run, spec.primaryAccount) / 100,
    debt: (run.debt + arrearsTotal(run)) / 100,
    assets: (otherCash + investmentValue(run) + receivables) / 100,
    stats: { happiness: stat(run, 'happiness'), stress: stat(run, 'stress'), credit: null, third: { label: STAT_LABELS[spec.thirdStat], short: THIRD_SHORT[spec.thirdStat] ?? 'Role', value: stat(run, spec.thirdStat) } },
    chapter: runChapter(run),
    situation: situation(run),
  }
}

export const cashLabel = (run: CampaignRun) => ACCOUNT_NAMES[ROLES[run.role].primaryAccount]

export const runHistory = (run: CampaignRun): RoadEvent[] =>
  run.history.map((h) => ({ title: h.title, choice: h.choiceLabel, lesson: lessonForEvent(getEvent(h.eventId)).title }))
