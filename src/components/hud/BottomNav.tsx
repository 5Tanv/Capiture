import { useGame, useGameDispatch } from '../../state/GameProvider'
import type { TabId } from '../../types/game'
import { Icon } from '../ui/Icon'
import type { IconName } from '../world/sprites'

const tabs: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'life', label: 'Life Road', icon: 'road' },
  { id: 'learn', label: 'Learn', icon: 'book' },
  { id: 'compete', label: 'Compete', icon: 'bolt' },
  { id: 'shop', label: 'Shop', icon: 'bag' },
  { id: 'profile', label: 'Profile', icon: 'person' },
]

/** Persistent game navigation. On phones only the active tab shows its label. */
export function BottomNav() {
  const { tab } = useGame()
  const dispatch = useGameDispatch()

  return (
    <nav
      aria-label="Main"
      data-chrome="bottom"
      className="strip-wood rail-brass-top fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-[4.25rem] max-w-[960px] items-end px-1 lg:h-[4.75rem] short:h-14">
        {tabs.map((t) => {
          const active = t.id === tab
          return (
            <li key={t.id} className={`flex h-full transition-[flex-grow] duration-200 ${active ? 'grow-[1.7] lg:grow-[1.3]' : 'grow'} basis-0`}>
              <button
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: t.id })}
                aria-current={active ? 'page' : undefined}
                aria-label={t.label}
                data-tour={`nav-${t.id}`}
                className={`group relative flex w-full flex-col items-center justify-center gap-1 rounded-t-[12px] transition-colors ${
                  active
                    ? '-mt-2 h-[calc(100%+0.5rem)] border-[3px] border-b-0 border-ink bg-gradient-to-b from-walnut-400 to-walnut-600 shadow-[inset_0_3px_0_rgb(255_214_160/0.4),0_-6px_14px_-4px_rgb(247_201_72/0.35)]'
                    : 'hover:bg-white/5'
                }`}
              >
                {active && <span className="absolute inset-x-3 top-0 h-[3px] rounded-b bg-brass-500" aria-hidden />}
                <Icon
                  name={t.icon}
                  className={`transition-transform duration-200 ${active ? 'h-9 w-9 -translate-y-0.5 short:h-7 short:w-7' : 'h-7 w-7 short:h-6 short:w-6 opacity-80 group-hover:-translate-y-0.5 group-hover:opacity-100'}`}
                />
                <span
                  className={`txt-game-sm text-[12px] leading-none lg:text-[13px] ${active ? 'block' : 'hidden text-parch-200 md:block'}`}
                >
                  {t.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
