import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'

export type Accent = 'blue' | 'orange' | 'gold' | 'emerald' | 'red'

interface ActivityCardProps {
  accent: Accent
  /** Short status chip at the top, e.g. "3/5 answered". */
  ribbon: string
  art: ReactNode
  title: string
  /** Secondary line(s) under the title. */
  children?: ReactNode
  /** The visible verb at the bottom of the card ("Open challenge"). */
  action: string
  /** Fill the action strip in gold, for a ready-to-take step like "View in Shop". */
  strongAction?: boolean
  /** Finished for now: calmer styling and a check, but still opens for review. */
  done?: boolean
  /** Full accessible name; defaults to title, ribbon and action. */
  label?: string
  onClick: () => void
}

/** One home activity: the whole card is a single button. */
export function ActivityCard({ accent, ribbon, art, title, children, action, strongAction = false, done = false, label, onClick }: ActivityCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? `${title}. ${ribbon}${done ? ', done' : ''}. ${action}`}
      data-done={done}
      className={`activity-card accent-${accent} group h-full w-full overflow-hidden`}
    >
      <span className={`flex w-full flex-1 flex-col items-center px-2.5 pt-2.5 pb-2 lg:short:pt-2 lg:short:pb-1.5`}>
        <span className="activity-ribbon flex max-w-full items-center gap-1 px-2 py-[3px] text-[12px] leading-none font-extrabold whitespace-nowrap">
          {done && <Icon name="check" className="h-3 w-3 shrink-0" />}
          <span className="truncate">{ribbon}</span>
        </span>
        <span
          className={`mt-2.5 grid h-12 w-[3.75rem] place-items-center drop-shadow-[0_4px_0_rgb(0_0_0/0.35)] lg:short:mt-1.5 lg:short:h-9 lg:short:w-11`}
        >
          {art}
        </span>
        <span className={`txt-game-sm mt-2 line-clamp-2 w-full text-[16px] leading-tight break-words lg:short:mt-1 lg:short:text-[15px]`} title={title}>
          {title}
        </span>
        {children && (
          <span className="mt-1 flex w-full flex-col items-center gap-1 text-[13px] leading-snug font-bold text-parch-200">{children}</span>
        )}
      </span>
      <span
        className={`activity-action flex w-full items-center justify-center gap-1 px-2 py-1.5 text-[13px] leading-none font-extrabold lg:short:py-1 after:inline-block after:transition-transform whitespace-nowrap after:content-['›']`}
        data-strong={strongAction}
        aria-hidden
      >
        {action}
      </span>
    </button>
  )
}
