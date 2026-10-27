import type { RoadEvent } from '../../data/chapters'
import { Icon } from '../ui/Icon'

/** The most recent decisions in this life, newest first. */
export function LifeLog({ events, onOpenRoad }: { events: RoadEvent[]; onOpenRoad: () => void }) {
  const recent = events.slice(-3).reverse()
  return (
    <section className="surface-utility flex flex-col gap-2 p-3" aria-labelledby="life-log-h">
      <div className="flex items-center justify-between px-1">
        <h2 id="life-log-h" className="txt-game-sm text-[16px]">
          Life Log
        </h2>
        <button
          type="button"
          onClick={onOpenRoad}
          className="flex min-h-9 items-center gap-1.5 rounded-md px-1 text-[13px] font-extrabold text-brass-300 hover:text-brass-400"
        >
          Full road
          <Icon name="arrow" className="h-3 w-2.5" />
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="rounded-[10px] border-2 border-dashed border-sage-500/50 px-3 py-3 text-[14px] font-semibold text-sage-300">
          A fresh start. Choices you make will be written here.
        </p>
      ) : (
        <ol className="flex flex-col">
          {recent.map((ev, i) => (
            <li key={`${events.length - i}-${ev.title}`} className="flex gap-3 border-t border-white/5 px-1 py-2 first:border-t-0">
              <span className="font-display grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-cash-500 text-[12px] text-ink tabular-nums">
                {events.length - i}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] leading-snug font-extrabold">{ev.title}</span>
                <span className="block text-[13px] leading-snug font-semibold text-sage-300">{ev.choice}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
