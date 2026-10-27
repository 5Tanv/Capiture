import type { LifeSim } from '../../types/game'
import { Icon } from '../ui/Icon'
import { Portrait } from './Portrait'

interface NextEventButtonProps {
  life: LifeSim
  onPlay: () => void
  onOpenRoad: () => void
  /** The campaign's next event. */
  nextTitle?: string
  /** An event is already open (mid-lesson, mid-decision or paused). */
  resuming?: boolean
  /** The year is complete. */
  campaignDone?: boolean
  /** The life isn't open yet: the one before it must finish Chapter 1. */
  lockedBy?: string
}

/** The lobby's primary action, with the life's road pennant beside it. */
export function NextEventButton({ life, onPlay, onOpenRoad, nextTitle, resuming, campaignDone, lockedBy }: NextEventButtonProps) {
  const { chapter } = life
  const started = chapter.eventIndex > 0 || chapter.number > 1
  const locked = Boolean(lockedBy)
  const hype = !locked && !campaignDone && !resuming && !started
  const label = locked ? 'LOCKED' : campaignDone ? 'YEAR COMPLETE' : resuming ? 'RESUME' : started ? 'NEXT EVENT' : 'START LIFE'
  const sub = locked
    ? `Finish Chapter 1 of ${lockedBy} first`
    : campaignDone
    ? 'See your year on the road'
    : nextTitle
      ? `Event ${chapter.eventIndex + 1} of ${chapter.eventTotal} · ${nextTitle}`
      : `Begin Chapter ${chapter.number}: ${chapter.title}`

  return (
    <div className="flex items-stretch justify-center gap-3">
      <button
        type="button"
        onClick={campaignDone ? onOpenRoad : onPlay}
        disabled={locked}
        data-tour="next-event"
        className={`btn-3d ${locked ? 'btn-locked' : 'btn-gold btn-shine'} ${hype ? 'btn-hype' : ''} min-h-[4.75rem] w-full max-w-[22rem] flex-1 gap-3 rounded-[16px] px-4 py-3 sm:min-h-[5.25rem] sm:gap-4 sm:px-6 lg:short:min-h-[4.25rem] lg:short:py-2`}
      >
        {hype && (
          <span className="hype-stars" aria-hidden>
            <i /><i /><i /><i /><i /><i />
          </span>
        )}
        <span className="flex min-w-0 flex-col items-center text-center leading-none">
          <span className="txt-game text-[clamp(1.35rem,7vw,1.7rem)] leading-[1.05] tracking-wide text-balance sm:text-[2.25rem] lg:short:text-[1.9rem]">{label}</span>
          <span className="mt-2 max-w-full rounded-full bg-brass-900/25 px-3 py-1 text-[12px] leading-tight font-extrabold text-balance text-ink sm:text-[13px]">{sub}</span>
        </span>
        <Icon name={locked ? 'lock' : 'arrow'} className="h-7 w-6 shrink-0 sm:h-8 sm:w-7 drop-shadow-[0_3px_0_rgb(42_26_18)]" />
      </button>

      {/* road pennant: shows whose life this is and opens their event road */}
      <button
        type="button"
        onClick={onOpenRoad}
        aria-label={`Open ${life.name}'s life road`}
        className="group relative w-16 shrink-0 sm:w-[4.75rem] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0.5"
      >
        <span
          className="absolute inset-0 bg-ink"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)' }}
          aria-hidden
        />
        <span
          className="strip-wood absolute inset-[3px]"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%)' }}
          aria-hidden
        />
        <span className="relative flex flex-col items-center gap-1 pt-2.5">
          <Portrait lifeId={life.id} worldId={life.worldId} className="h-11 w-11 rounded-[8px] border-[3px] border-ink sm:h-12 sm:w-12" />
          <span className="txt-game-sm text-[11px] leading-none text-brass-300">ROAD</span>
        </span>
      </button>
    </div>
  )
}
