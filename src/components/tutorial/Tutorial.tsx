import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TUTORIAL_FINAL, TUTORIAL_XP, tourSteps } from '../../data/tutorial'
import { useGame, useGameDispatch } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'
import { centeredIn, measure, place, roundedRect, type Box, type Placement } from './spotlight'

/** The first-run tour: dims the page, lights the target, and points at it. */
export function Tutorial() {
  const { tutorial, eventOpen, creator, lives } = useGame()
  const first = lives.freshman.name.split(' ')[0]
  const fill = (t?: string) => t?.replaceAll('{name}', first)
  const dispatch = useGameDispatch()
  // The tour waits while the character creator is open.
  const step = creator ? null : tutorial.step
  const def = step !== null && step < TUTORIAL_FINAL ? tourSteps[step] : null
  const cardRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState({ w: 336, h: 180 })

  // Centered cards have no target to follow, so track the window itself too.
  useEffect(() => {
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Follow the targets: they move while the page scrolls, resizes, or the modal animates in.
  useEffect(() => {
    if (!def) return
    document.querySelector<HTMLElement>(`[data-tour="${def.targets[0]}"]`)?.scrollIntoView({ block: 'center', inline: 'nearest' })
    let raf = 0
    let last = ''
    const tick = () => {
      const next = measure(def.targets)
      const key = `${window.innerWidth}x${window.innerHeight}|${next.map((b) => `${b.x},${b.y},${b.w},${b.h}`).join('|')}`
      if (key !== last) {
        last = key
        setBoxes(next)
        setView({ w: window.innerWidth, h: window.innerHeight })
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [def])

  // The finish card has no target.
  useEffect(() => {
    if (step === TUTORIAL_FINAL) setBoxes([])
  }, [step])

  const host = step === null ? null : eventOpen ? document.getElementById('event-dialog') : null

  useLayoutEffect(() => {
    const el = cardRef.current
    if (el && (el.offsetWidth !== size.w || el.offsetHeight !== size.h)) setSize({ w: el.offsetWidth, h: el.offsetHeight })
  })

  // Read-and-tap steps hand focus to the card; Esc ends the tour from anywhere.
  useEffect(() => {
    if (step === null) return
    if (def?.mode !== 'do') nextRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: 'tutorialSkip' })
      } else if (e.key === 'Tab' && def?.mode !== 'do' && cardRef.current) {
        const buttons = [...cardRef.current.querySelectorAll('button')]
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
        e.preventDefault()
        buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, def, dispatch, host])

  if (step === null) return null

  const final = step === TUTORIAL_FINAL
  const placement: Placement =
    def && boxes.length > 0
      ? place(boxes, size, def.side)
      : centeredIn(view, size)
  const holes = boxes.map(roundedRect).join('')
  const clipPath = `path(evenodd, 'M0 0H${view.w}V${view.h}H0Z${holes}')`
  const lit = def?.mode === 'next'
  // Over a tall target (the event's choices) a full card would cover the very thing being taught: shrink it to a strip at the top.
  // Judged against a nominal full-size card, never the measured one, so the strip can't flip the answer back.
  const compact = eventOpen && def?.mode === 'do' && boxes.length > 0 && place(boxes, { w: 312, h: 210 }, def.side).arrow === null

  const ui = (
    <div data-tutorial>
      {/* The dim. Clipped around the targets so clicks reach them; in the other steps shields keep the page still. */}
      <div className="fixed inset-0 z-[100] bg-ink/70" style={{ clipPath }} aria-hidden />
      {boxes.map((b, i) => (
        <div
          key={i}
          className={`fixed z-[101] rounded-[12px] shadow-[0_0_0_3px_#2a1a12,0_0_0_6px_rgb(247_201_72/0.9),0_0_18px_6px_rgb(247_201_72/0.35)] motion-safe:animate-[glow_2.4s_ease-in-out_infinite] ${lit ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
          aria-hidden
        />
      ))}

      {placement.arrow && !compact && (
        <div
          className="pointer-events-none fixed z-[102] h-7 w-7"
          style={{ left: placement.arrow.left, top: placement.arrow.top, transform: `rotate(${placement.arrow.rotate}deg)` }}
          aria-hidden
        >
          <Icon name="arrow" className="h-full w-full anim-nudge drop-shadow-[0_2px_0_rgb(42_26_18)]" />
        </div>
      )}

      <div
        ref={cardRef}
        role="region"
        aria-label="Tutorial"
        aria-live="polite"
        key={step}
        className={
          compact
            ? 'panel-wood anim-pop fixed top-2 left-1/2 z-[103] flex w-[min(34rem,calc(100vw-1.5rem))] -translate-x-1/2 items-center gap-3 px-3 py-2'
            : 'panel-wood anim-pop fixed z-[103] flex max-h-[calc(100dvh-1.5rem)] w-[min(19.5rem,calc(100vw-1.5rem))] flex-col gap-2.5 overflow-y-auto px-4 pt-3.5 pb-3.5'
        }
        style={compact ? undefined : { left: placement.left, top: placement.top }}
      >
        {compact && def ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold tracking-wide text-brass-300 uppercase">
                Step {step + 1} of {tourSteps.length}
              </span>
              <span className="txt-game-sm block truncate text-base leading-tight">{fill(def.title)}</span>
            </span>
            <span className="rounded-full border-2 border-ink bg-brass-500 px-2.5 py-1 text-[12px] leading-tight font-extrabold text-ink">{def.hint}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'tutorialSkip' })}
              className="shrink-0 rounded-md px-1 py-2 text-[13px] font-bold text-parch-300 underline decoration-1 underline-offset-4 hover:text-white"
            >
              Skip
            </button>
          </>
        ) : (
          <>
        <p className="text-[12px] font-extrabold tracking-wide text-brass-300 uppercase">
          {final ? 'All done' : `Step ${step + 1} of ${tourSteps.length}`}
        </p>
        <h2 className="txt-game-sm text-xl leading-tight">{final ? 'You’re ready to play' : fill(def?.title)}</h2>
        <p className="text-[15px] leading-snug font-semibold text-parch-100">
          {final
            ? tutorial.rewarded
              ? `That choice moved ${first}’s money, not yours. Your XP is yours to keep.`
              : 'Every life keeps its own money. Your XP and FiCoins stay with you.'
            : fill(def?.text)}
        </p>
        {final && tutorial.rewarded && (
          <p className="anim-pop flex items-center gap-2 self-start rounded-full border-2 border-ink bg-xp-500 py-0.5 pr-3 pl-1.5 text-[14px] font-extrabold text-ink">
            <Icon name="xp" className="h-5 w-5" />+{TUTORIAL_XP} XP
          </p>
        )}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {final ? (
            <button
              ref={nextRef}
              type="button"
              onClick={() => dispatch({ type: 'tutorialNext' })}
              className="btn-3d btn-gold ml-auto min-h-11 gap-2 rounded-[12px] px-6"
            >
              <span className="txt-game text-lg leading-none">LET’S PLAY</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => dispatch({ type: 'tutorialSkip' })}
                className="rounded-md px-1 py-2 text-[13px] font-bold text-parch-300 underline decoration-1 underline-offset-4 hover:text-white"
              >
                Skip tutorial
              </button>
              {def?.mode === 'next' ? (
                <button
                  ref={nextRef}
                  type="button"
                  onClick={() => dispatch({ type: 'tutorialNext' })}
                  className="btn-3d btn-gold min-h-11 gap-2 rounded-[12px] px-5"
                >
                  <span className="txt-game text-lg leading-none">NEXT</span>
                  <Icon name="arrow" className="h-5 w-4" />
                </button>
              ) : (
                <span className="rounded-full border-2 border-ink bg-brass-500 px-3 py-1 text-[12px] font-extrabold text-ink">{def?.hint}</span>
              )}
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(ui, host ?? document.body)
}
