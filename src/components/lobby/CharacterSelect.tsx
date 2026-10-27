import { useRef, type KeyboardEvent } from 'react'
import { useGame, useGameDispatch } from '../../state/GameProvider'
import { formatMoneyShort } from '../../lib/format'
import { lifeUnlocked } from '../../lib/unlock'
import { Icon } from '../ui/Icon'
import { Portrait } from './Portrait'

/** Picks which of the four lives is on stage. A radio group with arrow-key support. */
export function CharacterSelect({ layout }: { layout: 'rail' | 'strip' | 'grid' }) {
  const { lives, lifeOrder, activeLifeId, runs } = useGame()
  const dispatch = useGameDispatch()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight'
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    if (!forward && !back) return
    e.preventDefault()
    const next = (index + (forward ? 1 : -1) + lifeOrder.length) % lifeOrder.length
    dispatch({ type: 'selectLife', lifeId: lifeOrder[next] })
    refs.current[next]?.focus()
  }

  const isRail = layout === 'rail'
  const isGrid = layout === 'grid'

  return (
    <div
      role="radiogroup"
      aria-label="Choose a life"
      data-tour="lives"
      className={
        isRail
          ? 'flex flex-col items-center gap-4 short:gap-2'
          : isGrid
            ? 'grid grid-cols-2 justify-items-center gap-x-3 gap-y-4 pt-2 pb-1'
            : '-mx-4 flex snap-x justify-center-safe gap-2 overflow-x-auto px-4 pt-2 pb-2 [scrollbar-width:none] sm:gap-4'
      }
    >
      {lifeOrder.map((id, i) => {
        const life = lives[id]
        const active = id === activeLifeId
        const open = lifeUnlocked(runs, lifeOrder, id)
        const fresh = open && life.chapter.number === 1 && life.chapter.eventIndex === 0
        const prev = lives[lifeOrder[i - 1]]
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            title={open ? undefined : `Locked: finish Chapter 1 of ${prev?.archetype} first`}
            tabIndex={active ? 0 : -1}
            onClick={() => dispatch({ type: 'selectLife', lifeId: id })}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`group relative flex shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl ${isRail || isGrid ? 'w-full' : 'w-[4.5rem]'}`}
          >
            <span
              className={`relative grid place-items-center rounded-full border-[3px] border-ink bg-gradient-to-b from-brass-400 to-brass-700 transition-transform duration-150 group-hover:-translate-y-0.5 ${
                isGrid ? 'h-16 w-16 p-[4px]' : isRail ? 'h-[4.5rem] w-[4.5rem] p-[5px] 2xl:h-20 2xl:w-20 short:h-14 short:w-14' : 'h-14 w-14 p-1'
              } ${
                active
                  ? 'shadow-[0_0_0_3px_#2a1a12,0_0_0_6px_rgb(247_201_72/0.9),0_0_18px_6px_rgb(247_201_72/0.35)] motion-safe:animate-[glow_2.4s_ease-in-out_infinite]' : 'shadow-[0_6px_10px_-4px_rgb(0_0_0/0.6)]'
              }`}
            >
              <Portrait lifeId={id} worldId={life.worldId} className={`h-full w-full rounded-full border-2 border-ink ${open ? '' : 'opacity-60 grayscale'}`} />
              {!open && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45">
                  <Icon name="lock" className="h-7 w-7" label="Locked" />
                </span>
              )}
              {fresh && (
                <span className="txt-game-sm absolute -top-1.5 -right-2 rotate-6 rounded-md border-2 border-ink bg-ember-500 px-1.5 py-0.5 text-[10px] leading-none">
                  NEW
                </span>
              )}
            </span>
            <span className={`txt-game-sm px-1 text-center text-[12px] leading-tight ${open ? '' : 'text-sage-300'}`}>{life.archetype}</span>
            <span
              className={`-mt-1 rounded-full border-2 border-ink px-2 py-px text-[11px] leading-tight font-extrabold ${
                !open ? 'bg-ink/70 text-sage-300' : active ? 'bg-cash-500 text-ink' : 'bg-ink/70 text-cash-300'
              }`}
            >
              {open ? formatMoneyShort(life.cash) : 'Locked'}
            </span>
            <span className="sr-only">
              {life.archetype}, {open ? `Chapter ${life.chapter.number}, ${fresh ? 'not started' : `event ${life.chapter.eventIndex} of ${life.chapter.eventTotal}`}` : `locked until Chapter 1 of ${prev?.archetype} is finished`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
