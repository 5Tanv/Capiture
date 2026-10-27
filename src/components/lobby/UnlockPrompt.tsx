import { useGame, useGameDispatch } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'
import { Portrait } from './Portrait'

/** Appears when finishing Chapter 1 opens the next life, and takes the player there. */
export function UnlockPrompt() {
  const { unlockPrompt, lives, creator } = useGame()
  const dispatch = useGameDispatch()
  const life = unlockPrompt ? lives[unlockPrompt] : null
  if (!life || creator) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="unlock-h">
      <div className="surface-reading anim-rise flex w-full max-w-[24rem] flex-col items-center gap-3 p-6 text-center">
        <Portrait lifeId={life.id} worldId={life.worldId} className="h-24 w-24 rounded-[14px] border-[3px] border-ink" />
        <p className="font-pixel text-[13px] text-ember-700">NEW LIFE UNLOCKED</p>
        <h2 id="unlock-h" className="font-display text-[26px] leading-tight text-ink">
          {life.archetype}
        </h2>
        <p className="text-[14px] font-semibold text-ink-soft">You finished Chapter 1, so the next life is open. Their story starts fresh.</p>
        <button type="button" autoFocus onClick={() => dispatch({ type: 'goToUnlocked' })} className="btn-3d btn-gold btn-shine min-h-12 w-full gap-2 rounded-[12px] px-5">
          <span className="txt-game text-lg leading-none">GO TO {life.archetype.toUpperCase()}</span>
          <Icon name="arrow" className="h-5 w-4" />
        </button>
        <button type="button" onClick={() => dispatch({ type: 'dismissUnlock' })} className="min-h-10 rounded-md px-3 text-[13px] font-extrabold text-ink-soft hover:text-ink">
          Later
        </button>
      </div>
    </div>
  )
}
