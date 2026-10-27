import type { RoleId } from './types'

// Fixed, non-leap educational calendars. Nothing here reads the device clock.
// College: day 0 is August 25 of fictional Year 1 and day 365 is August 25 of Year 2.
// The other lives play one year: day 0 is January 1 and the story ends December 20 (day 353).

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 0-based day of a non-leap year. */
export function dayOfYear(month: number, day: number) {
  let n = 0
  for (let m = 1; m < month; m++) n += MONTH_DAYS[m - 1]
  return n + day - 1
}

const parse = (md: string) => md.split('-').map(Number) as [number, number]

const COLLEGE_START = dayOfYear(8, 25)
const COLLEGE_YEAR2 = 365 - COLLEGE_START

function monthDay(doy: number) {
  let month = 1
  let d = doy
  while (d >= MONTH_DAYS[month - 1]) {
    d -= MONTH_DAYS[month - 1]
    month++
  }
  return { month, day: d + 1 }
}

export interface Calendar {
  toDay(year: 1 | 2, md: string): number
  fromDay(day: number): { year: 1 | 2; month: number; day: number }
  lastDay: number
}

const collegeCalendar: Calendar = {
  toDay(year, md) {
    const doy = dayOfYear(...parse(md))
    return year === 1 ? doy - COLLEGE_START : COLLEGE_YEAR2 + doy
  },
  fromDay(day) {
    const year: 1 | 2 = day < COLLEGE_YEAR2 ? 1 : 2
    return { year, ...monthDay(year === 1 ? day + COLLEGE_START : day - COLLEGE_YEAR2) }
  },
  lastDay: 365,
}

const yearCalendar: Calendar = {
  toDay: (_year, md) => dayOfYear(...parse(md)),
  fromDay: (day) => ({ year: 1, ...monthDay(day) }),
  lastDay: dayOfYear(12, 20),
}

export const calendars: Record<RoleId, Calendar> = {
  college: collegeCalendar,
  adult: yearCalendar,
  business: yearCalendar,
  athlete: yearCalendar,
}

/** "Sep 8"; the college calendar can add its year. */
export function dayLabel(role: RoleId, day: number, withYear = false): string {
  const d = calendars[role].fromDay(day)
  return `${MONTH_NAMES[d.month - 1]} ${d.day}${withYear && role === 'college' ? `, Year ${d.year}` : ''}`
}

export const isMonthStart = (role: RoleId, day: number) => calendars[role].fromDay(day).day === 1

export function nextMonthStart(role: RoleId, after: number): number | null {
  for (let d = after + 1; d <= calendars[role].lastDay; d++) if (isMonthStart(role, d)) return d
  return null
}

export interface SeriesDates {
  first: number
  every: number
  last: number
}

export function inSeries(day: number, s: SeriesDates) {
  return day >= s.first && day <= s.last && (day - s.first) % s.every === 0
}

export function nextInSeries(after: number, s: SeriesDates): number | null {
  if (after < s.first) return s.first
  const d = s.first + (Math.floor((after - s.first) / s.every) + 1) * s.every
  return d <= s.last ? d : null
}

/** How many dates a series has, for tests and summaries. */
export const seriesCount = (s: SeriesDates) => (s.last < s.first ? 0 : Math.floor((s.last - s.first) / s.every) + 1)
