import { useEffect, useRef, useState } from 'react'
import { formatMoneyExact, formatMoneyShort, formatNumber } from '../../lib/format'
import { ROLES } from '../../campaign/roles'
import { MoneyPanel } from '../campaign/MoneyPanel'
import { useCountUp } from '../../lib/useCountUp'
import { useActiveLife, useGame, useGameDispatch } from '../../state/GameProvider'
import { AccountPortrait, Portrait } from '../lobby/Portrait'
import { Icon } from '../ui/Icon'

/** Persistent account HUD. The account (left) and the active life (right) are visibly different. */
export function TopBar() {
  const { account, runs, activeLifeId } = useGame()
  const run = runs[activeLifeId]
  const life = useActiveLife()
  const dispatch = useGameDispatch()
  const cash = useCountUp(life.cash)
  const xpPct = (account.xp / account.xpToNext) * 100
  // Each life tracks several accounts; the chip shows the main one and opens a breakdown of all of them.
  const accountLabel = ROLES[run.role].primaryAccount === 'business_cash' ? 'studio cash' : 'checking'
  const [moneyOpen, setMoneyOpen] = useState(false)
  const moneyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!moneyOpen) return
    const away = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !moneyRef.current?.contains(e.target as Node)) setMoneyOpen(false)
    }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', away)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', away)
    }
  }, [moneyOpen])

  return (
    <header data-chrome="top" className="hud-bar relative z-20">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-1.5 px-2.5 min-[400px]:gap-2 min-[400px]:px-3 sm:gap-4 sm:px-5 lg:h-[4.5rem] short:h-14">
        {/* Knowledge level + XP */}
        <div className="flex shrink-0 items-center" data-tour="xp" title={`Knowledge level ${account.knowledgeLevel}: ${account.xp} of ${account.xpToNext} XP`}>
          <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center min-[400px]:h-11 min-[400px]:w-11 lg:h-12 lg:w-12 short:h-10 short:w-10">
            <svg viewBox="0 0 40 44" className="absolute inset-0 h-full w-full" aria-hidden>
              <path d="M20 2 37 11.5v21L20 42 3 32.5v-21Z" fill="#2a1a12" />
              <path d="M20 6 33.5 13.5v17L20 38 6.5 30.5v-17Z" fill="#2bb3e6" />
              <path d="M20 6 33.5 13.5v5L20 11 6.5 18.5v-5Z" fill="#bdeefc" opacity=".7" />
            </svg>
            <span className="txt-game-sm relative text-lg leading-none lg:text-xl">{account.knowledgeLevel}</span>
            <span className="sr-only">Knowledge level</span>
          </span>
          <div className="-ml-3">
            <div className="bar-track h-6 w-14 pl-2.5 min-[340px]:w-[4.25rem] min-[420px]:w-24 sm:w-36 lg:w-44">
              <div className="bar-fill bg-gradient-to-b from-[#5fd0f2] to-xp-500" style={{ width: `${xpPct}%` }} />
              <span className="txt-game-sm absolute inset-0 flex items-center justify-center pl-2 text-[10px] leading-none tabular-nums min-[340px]:text-[11px] min-[420px]:text-[12px]">
                {account.xp}/{account.xpToNext}
                <span className="ml-1 hidden sm:inline">XP</span>
              </span>
            </div>
          </div>
        </div>

        <p className="ml-4 hidden items-center gap-2 lg:flex" aria-label="Capiture">
          <Icon name="coin" className="h-7 w-7 -rotate-12" />
          <span className="txt-game text-[1.75rem] leading-none short:text-2xl" aria-hidden>
            <span className="text-brass-400">Cap</span>iture
          </span>
        </p>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 min-[400px]:gap-2 sm:gap-4">
          {/* FiCoins: earned by learning, the + leads to lessons (Learn is in the nav on the narrowest phones) */}
          <div className="flex shrink-0 items-center" data-tour="coins" title="FiCoins: earned from lessons and questions">
            <button
              type="button"
              onClick={() => dispatch({ type: 'setTab', tab: 'learn' })}
              className="btn-3d btn-green relative z-10 hidden h-8 w-8 rounded-[8px] [--lip:3px] min-[380px]:inline-flex"
              aria-label="Earn more FiCoins in Learn"
            >
              <svg viewBox="0 0 10 10" className="h-3.5 w-3.5" aria-hidden>
                <path d="M4 0h2v4h4v2H6v4H4V6H0V4h4Z" fill="#fff" stroke="#2a1a12" strokeWidth=".8" paintOrder="stroke" />
              </svg>
            </button>
            <div className="flex h-8 items-center rounded-full border-[3px] border-ink bg-ink/70 pr-1 pl-2 min-[380px]:-ml-1.5 min-[380px]:rounded-l-none min-[380px]:border-l-0 min-[380px]:pl-3">
              <span className="txt-game-sm text-[15px] leading-none tabular-nums lg:text-base">{formatNumber(account.fiCoins)}</span>
              <span className="ml-1 hidden text-[11px] font-extrabold text-brass-300 lg:inline">FiCoins</span>
              <Icon name="coin" className="-mr-2.5 ml-1 h-7 w-7 drop-shadow min-[400px]:-mr-3 min-[400px]:ml-1.5 min-[400px]:h-8 min-[400px]:w-8-[0_2px_0_rgb(0_0_0/0.4)]" label="FiCoins" />
            </div>
          </div>

          {/* Life money: belongs to the character on stage, not the account */}
          <div ref={moneyRef} className="relative flex shrink-0 items-center min-[340px]:ml-1.5 min-[400px]:ml-2" data-tour="life-cash" title={`${life.name}'s ${accountLabel} in their simulated life`}>
            <button
              type="button"
              onClick={() => setMoneyOpen((o) => !o)}
              aria-expanded={moneyOpen}
              aria-label={`${life.name}'s money: ${formatMoneyExact(life.cash)} in ${accountLabel}. Show all accounts`}
              className="flex h-9 items-center gap-2 rounded-[10px] border-[3px] border-ink bg-gradient-to-b from-[#2f9a55] to-cash-700 py-0.5 pr-2.5 pl-0.5 shadow-[inset_0_2px_0_rgb(255_255_255/0.3)] "
            >
              <Portrait lifeId={life.id} worldId={life.worldId} className="hidden h-7 w-7 rounded-[6px] border-2 border-ink min-[360px]:flex" />
              <span className="flex flex-col items-start leading-none">
                <span className="hidden text-[10px] font-extrabold tracking-wide text-cash-300 uppercase sm:block">
                  <span className="inline-block max-w-[7rem] truncate align-bottom">{life.name.split(' ')[0]}</span>&rsquo;s {accountLabel}
                </span>
                <span className="txt-game-sm text-[15px] leading-none tabular-nums lg:text-base">{Math.abs(cash) < 10000 ? formatMoneyExact(cash) : formatMoneyShort(cash)}</span>
              </span>
              <Icon name="cash" className="hidden h-5 w-7 sm:block" />
            </button>
            {moneyOpen && (
              <div className="surface-reading anim-rise absolute top-full right-0 z-30 mt-2 w-[min(20rem,calc(100vw-1.5rem))] px-4 py-3 text-ink">
                <p className="font-display text-[17px]">{life.name.split(' ')[0]}&rsquo;s money</p>
                <MoneyPanel run={run} />
              </div>
            )}
          </div>

          {/* Account profile */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'setTab', tab: 'profile' })}
            className="group flex shrink-0 items-center gap-2 rounded-xl"
            aria-label={`Open profile for ${account.username}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-[10px] border-[3px] border-ink bg-gradient-to-b from-brass-400 to-brass-700 p-[3px] transition-transform group-hover:-translate-y-0.5 min-[400px]:h-11 min-[400px]:w-11 lg:h-12 lg:w-12 short:h-10 short:w-10">
              <AccountPortrait className="h-full w-full rounded-[6px]" />
            </span>
            <span className="hidden flex-col text-left leading-tight xl:flex">
              <span className="txt-game-sm text-[15px]">{account.username}</span>
              <span className="text-[12px] font-bold text-parch-300">{account.title}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
