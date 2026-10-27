import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ONBOARDING_FINAL, onboardingSteps } from '../../data/onboarding'
import { NAME_MAX } from '../../lib/saveStore'
import { useGame, useGameDispatch } from '../../state/GameProvider'
import { lifePresets, type Appearance } from '../../sprites/catalog'
import { CharacterPortrait } from '../sprite/CharacterSprite'
import { Icon } from '../ui/Icon'
import { centeredIn, measure, place, roundedRect, type Box, type Placement } from './spotlight'

/** The tour's guide. Appears only inside the tour. */
const guideLook: Appearance = {
  ...lifePresets.entrepreneur,
  skin: 'olive',
  hair: 'bob',
  hairColor: 'chestnut',
  top: 'blazer',
  topColor: 'navy',
  glasses: 'round',
  watch: 'none',
}

/** The welcome tour: customize the avatar and lives, then meet the shop. Lights real UI and waits for real saves. */
export function Onboarding() {
  const { onboarding, creator, account } = useGame()
  const dispatch = useGameDispatch()
  // The tour waits while an editor is open; a save there is what moves it on.
  const step = creator ? null : onboarding.step
  const def = step === null ? null : onboardingSteps[step]
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const [name, setName] = useState('')
  const [boxes, setBoxes] = useState<Box[]>([])
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState({ w: 352, h: 220 })

  // Centered cards have no target to follow, so track the window itself too.
  useEffect(() => {
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Follow the targets while the page scrolls, resizes, or finishes changing tab.
  useEffect(() => {
    if (!def || def.targets.length === 0) {
      setBoxes([])
      return
    }
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

  useLayoutEffect(() => {
    const el = cardRef.current
    if (el && (el.offsetWidth !== size.w || el.offsetHeight !== size.h)) setSize({ w: el.offsetWidth, h: el.offsetHeight })
  })

  useEffect(() => {
    if (step === null) return
    if (def?.mode === 'next') primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: 'onboardingSkip' })
      } else if (e.key === 'Tab' && def?.mode === 'next' && cardRef.current) {
        const buttons = [...cardRef.current.querySelectorAll<HTMLElement>('button, input')]
        const at = buttons.indexOf(document.activeElement as HTMLElement)
        e.preventDefault()
        buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, def, dispatch])

  if (step === null || !def) return null

  const centered = def.targets.length === 0 || boxes.length === 0
  const final = step === ONBOARDING_FINAL
  const welcome = step === 0
  const placement: Placement = centered
    ? centeredIn(view, size)
    : place(boxes, size, def.side)
  const holes = boxes.map(roundedRect).join('')
  const clipPath = `path(evenodd, 'M0 0H${view.w}V${view.h}H0Z${holes}')`
  const go = (to: number) => {
    // The welcome card asks for the player's name; leaving it empty keeps the current one.
    if (welcome && name.trim()) dispatch({ type: 'setUsername', name })
    dispatch({ type: 'onboardingGo', to })
  }

  const ui = (
    <div data-onboarding>
      {/* The dim: clipped around the targets so clicks reach them on action steps. */}
      <div className="fixed inset-0 z-[100] bg-ink/70" style={{ clipPath }} aria-hidden />
      {boxes.map((b, i) => (
        <div
          key={`${step}-${i}`}
          className={`fixed z-[101] rounded-[12px] shadow-[0_0_0_3px_#2a1a12,0_0_0_6px_rgb(247_201_72/0.9),0_0_18px_6px_rgb(247_201_72/0.35)] motion-safe:animate-[glow_2.4s_ease-in-out_infinite] ${def.mode === 'next' ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
          aria-hidden
        />
      ))}

      {placement.arrow && (
        <div
          className="pointer-events-none fixed z-[102] h-7 w-7"
          style={{ left: placement.arrow.left, top: placement.arrow.top, transform: `rotate(${placement.arrow.rotate}deg)` }}
          aria-hidden
        >
          <Icon name="arrow" className="anim-nudge h-full w-full drop-shadow-[0_2px_0_rgb(42_26_18)]" />
        </div>
      )}

      <div
        ref={cardRef}
        role="region"
        aria-label="Welcome tour"
        aria-live="polite"
        key={step}
        className={`panel-wood anim-pop fixed z-[103] flex max-h-[calc(100dvh-1.5rem)] flex-col gap-3 overflow-y-auto px-3.5 pt-3.5 pb-3.5 ${centered ? 'w-[min(26rem,calc(100vw-1.5rem))]' : 'w-[min(21rem,calc(100vw-1.5rem))]'}`}
        style={{ left: placement.left, top: placement.top }}
      >
        {/* guide and speech bubble */}
        <div className="flex items-start gap-3">
          <span
            className={`relative shrink-0 overflow-hidden rounded-[10px] border-[3px] border-ink bg-[#8ec9e0] shadow-[inset_0_2px_0_rgb(255_255_255/0.4)] ${centered ? 'h-[4.5rem] w-[4.5rem]' : 'h-14 w-14'}`}
            aria-hidden
          >
            <CharacterPortrait appearance={guideLook} className="h-full w-full" />
          </span>
          <div className="relative min-w-0 flex-1 rounded-[12px] border-[3px] border-ink bg-parch-100 px-3 py-2 text-ink shadow-[inset_0_-3px_0_rgb(0_0_0/0.08)]">
            <span className="absolute top-5 -left-[9px] h-3 w-3 rotate-45 border-b-[3px] border-l-[3px] border-ink bg-parch-100" aria-hidden />
            <h2 className="font-display text-[17px] leading-tight">{def.title}</h2>
            <p className="mt-1 text-[14px] leading-snug font-semibold">{def.text}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex gap-1" role="img" aria-label={`Step ${step + 1} of ${onboardingSteps.length}`}>
            {onboardingSteps.map((s, i) => (
              <span key={s.id} className={`h-1.5 rounded-full ${i === step ? 'w-4 bg-brass-400' : i < step ? 'w-1.5 bg-brass-600' : 'w-1.5 bg-black/35'}`} aria-hidden />
            ))}
          </span>
          {!final && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'onboardingSkip' })}
              className="rounded-md px-1 py-1.5 text-[13px] font-bold text-parch-300 underline decoration-1 underline-offset-4 hover:text-white"
            >
              Skip tutorial
            </button>
          )}
        </div>

        {welcome && (
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-extrabold tracking-wide text-parch-200 uppercase">What should we call you?</span>
            <input
              value={name}
              onChange={(e) => setName([...e.target.value].slice(0, NAME_MAX).join(''))}
              onKeyDown={(e) => e.key === 'Enter' && go(1)}
              placeholder={account.username}
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full rounded-[8px] border-2 border-ink bg-parch-100 px-3 font-display text-lg text-ink outline-none placeholder:text-ink-soft/60 focus-visible:outline-[3px] focus-visible:outline-brass-300"
            />
          </label>
        )}

        {def.mode === 'do' && (
          <p className="self-start rounded-full border-2 border-ink bg-brass-500 px-3 py-1 text-[12px] font-extrabold text-ink">{def.hint}</p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {def.back !== undefined && !final && (
            <button type="button" onClick={() => go(def.back!)} className="btn-3d btn-parch mr-auto min-h-10 rounded-[10px] px-3 text-[13px] font-extrabold [--lip:3px]">
              Back
            </button>
          )}
          {final ? (
            <>
              <button type="button" onClick={() => dispatch({ type: 'onboardingFinish', adventure: false })} className="btn-3d btn-parch min-h-11 rounded-[12px] px-4 text-[14px] font-extrabold">
                Explore Capiture
              </button>
              <button
                ref={primaryRef}
                type="button"
                onClick={() => dispatch({ type: 'onboardingFinish', adventure: true })}
                className="btn-3d btn-gold min-h-11 gap-2 rounded-[12px] px-5"
              >
                <span className="txt-game text-base leading-none">START MY ADVENTURE</span>
              </button>
            </>
          ) : def.mode === 'next' ? (
            <button ref={primaryRef} type="button" onClick={() => go(step + 1)} className="btn-3d btn-gold min-h-11 gap-2 rounded-[12px] px-5">
              <span className="txt-game text-lg leading-none">{welcome ? 'LET’S GET STARTED' : 'NEXT'}</span>
              {!welcome && <Icon name="arrow" className="h-5 w-4" />}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => go(def.skipTo ?? step + 1)} className="btn-3d btn-parch min-h-10 rounded-[10px] px-3 text-[13px] font-extrabold [--lip:3px]">
                Skip step
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(ui, document.body)
}
