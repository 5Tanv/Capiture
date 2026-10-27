import { ProfileStage } from '../components/shop/ProfileStage'
import { Portrait } from '../components/lobby/Portrait'
import { Icon } from '../components/ui/Icon'
import { ProgressBar } from '../components/ui/ProgressBar'
import { shopItems, slotLabel, type Slot } from '../data/shop'
import { STAT_LABELS, statKeys, roleOfLife } from '../campaign/roles'
import { formatMoneyExact, formatNumber } from '../lib/format'
import { useShopView } from '../lib/useShop'
import { useDaily } from '../lib/daily'
import { lifeUnlocked, unlockedBy } from '../lib/unlock'
import { useGame, useGameDispatch } from '../state/GameProvider'
import { lifeThemes } from '../theme/lifeThemes'

const BADGE_SLOTS = 6
/** Collection shows only the scene items; clothing and accessories live in the look editor. */
const SCENE_SLOTS: Slot[] = ['background', 'pet', 'title', 'frame', 'effect']

/** The player's identity: one account, separate from all four lives. */
export function ProfileScreen() {
  const { account, lives, lifeOrder, runs } = useGame()
  const dispatch = useGameDispatch()
  const { owned: ownedSet, loadout, look } = useShopView()
  const { streak } = useDaily()
  const mine = shopItems.filter((i) => ownedSet.has(i.id) && SCENE_SLOTS.includes(i.slot))
  const slots = [...new Set(mine.map((i) => i.slot))] as Slot[]

  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-5 pb-10 lg:grid-cols-[23rem_minmax(0,1fr)] lg:px-6">
      {/* the player card */}
      <section aria-labelledby="player-h" className="lg:self-start lg:tall:sticky lg:tall:top-5">
        <div className="panel-wood overflow-hidden p-[7px]" data-tour="avatar-card">
          <ProfileStage look={look} loadout={loadout} label={`${account.username}'s profile`}>
            <span className="absolute top-[3%] right-[3%] z-20 grid h-[13%] min-h-9 aspect-square place-items-center">
              <Icon name="level" className="absolute inset-0 h-full w-full" />
              <span className="txt-game-sm relative text-lg leading-none">{account.knowledgeLevel}</span>
            </span>
          </ProfileStage>
          <div className="px-3 pt-3 pb-3">
            <h1 id="player-h" className="txt-game text-3xl leading-none">
              {account.username}
            </h1>
            <p className="mt-1 text-[14px] font-bold text-brass-300">{account.title}</p>
            <div className="mt-3">
              <p className="flex justify-between text-[12px] font-extrabold text-parch-200">
                <span>Knowledge level {account.knowledgeLevel}</span>
                <span className="tabular-nums">
                  {account.xp} / {account.xpToNext} XP
                </span>
              </p>
              <ProgressBar value={account.xp} max={account.xpToNext} fill="bg-xp-500" className="mt-1 h-3.5" label="Knowledge XP" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { icon: 'coin' as const, value: formatNumber(account.fiCoins), label: 'FiCoins' },
                { icon: 'book' as const, value: String(account.lessonsCompleted), label: 'Lessons' },
                { icon: 'flame' as const, value: `${streak}d`, label: 'Streak' },
              ].map((s) => (
                <div key={s.label} className="surface-hud flex flex-col items-center gap-0.5 px-1 py-2">
                  <Icon name={s.icon} className="h-6 w-6" />
                  <span className="font-display text-lg leading-none tabular-nums">{s.value}</span>
                  <span className="text-[11px] font-extrabold text-sage-300 uppercase">{s.label}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'openCreator', target: 'account' })}
              className="btn-3d btn-teal mt-3 min-h-11 w-full gap-2 rounded-[12px] text-white"
              data-tour="edit-avatar"
            >
              <Icon name="brush" className="h-5 w-5" />
              <span className="txt-game-sm text-[15px] leading-none">Edit avatar</span>
            </button>
          </div>
        </div>
      </section>

      <div className="flex min-w-0 flex-col gap-6">
        {/* badges */}
        <section aria-labelledby="badges-h" data-tour="badges">
          <h2 id="badges-h" className="txt-game-sm mb-2.5 flex items-center gap-2 text-xl">
            <Icon name="medal" className="h-6 w-6" />
            Badges
            <span className="text-[13px] font-bold text-sage-300">
              {account.badges.length} earned
            </span>
          </h2>
          <ul className="surface-collection grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
            {account.badges.map((b) => (
              <li key={b.id} className="slot flex items-center gap-3 p-3">
                <Icon name="medal" className="h-10 w-10 shrink-0 drop-shadow-[0_3px_0_rgb(0_0_0/0.35)]" />
                <span className="min-w-0">
                  <span className="block font-display text-[15px] leading-tight">{b.name}</span>
                  <span className="block text-[12px] leading-snug font-semibold text-sage-300">{b.description}</span>
                </span>
              </li>
            ))}
            {Array.from({ length: Math.max(0, BADGE_SLOTS - account.badges.length) }, (_, i) => (
              <li key={i} className="slot-empty flex items-center gap-3 p-3 text-sage-300">
                <Icon name="lock" className="h-8 w-8 shrink-0 opacity-60" />
                <span className="text-[12px] font-bold">Earn more by finishing lessons</span>
              </li>
            ))}
          </ul>
        </section>

        {/* account-owned cosmetics */}
        <section aria-labelledby="owned-h" data-tour="collection">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 id="owned-h" className="txt-game-sm flex items-center gap-2 text-xl">
              <Icon name="chest" className="h-6 w-6" />
              Collection
            </h2>
            <button
              type="button"
              onClick={() => dispatch({ type: 'setTab', tab: 'shop' })}
              className="flex min-h-9 items-center gap-1.5 rounded-md px-1 text-[13px] font-extrabold text-brass-300 hover:text-brass-400"
            >
              Visit the shop
              <Icon name="arrow" className="h-3 w-2.5" />
            </button>
          </div>
          <div className="surface-collection flex flex-col gap-4 p-3">
            {slots.length === 0 && <p className="text-[13px] font-bold text-sage-300">Nothing yet. The shop has plenty to try on.</p>}
            {slots.map((slot) => (
              <div key={slot}>
                <h3 className="mb-1.5 flex items-center gap-2 text-[12px] font-extrabold tracking-wide text-sage-300 uppercase">
                  {slotLabel[slot].many}
                  <span className="font-bold normal-case">wearing {loadout[slot]?.name ?? slotLabel[slot].none.toLowerCase()}</span>
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {mine
                    .filter((i) => i.slot === slot)
                    .map((i) => {
                      const on = loadout[slot]?.id === i.id
                      return (
                        <li key={i.id} className={`slot flex items-center gap-2 py-1.5 pr-2 pl-2 ${on ? 'ring-[3px] ring-cash-500' : ''}`}>
                          <span className="text-[13px] font-extrabold">{i.name}</span>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => dispatch({ type: 'shopEquip', slot, itemId: on ? null : i.id })}
                            className={`btn-3d min-h-8 rounded-[8px] px-2 text-[12px] font-extrabold [--lip:2px] ${on ? 'btn-parch' : 'btn-green text-ink'}`}
                          >
                            {on ? 'Unequip' : 'Equip'}
                          </button>
                        </li>
                      )
                    })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* the four lives */}
        <section aria-labelledby="lives-h" data-tour="lives-section">
          <h2 id="lives-h" className="txt-game-sm mb-1 text-xl">
            Your Lives
          </h2>
          <p className="mb-3 text-[14px] font-semibold text-sage-300">
            Each life keeps its own look, name, money and story. Renaming changes nothing else. A life&rsquo;s money never turns into FiCoins; those come only from learning.
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lifeOrder.map((id) => {
              const l = lives[id]
              const t = lifeThemes[id]
              const open = lifeUnlocked(runs, lifeOrder, id)
              const prev = unlockedBy(lifeOrder, id)
              return (
                <li key={id} className={`surface-reading flex items-center gap-3 overflow-hidden p-3 ${open ? '' : 'opacity-70 grayscale'}`} style={{ boxShadow: `inset 4px 0 0 ${t.accent}, 0 8px 18px -8px rgb(0 0 0 / 0.55)` }}>
                  <Portrait lifeId={id} worldId={l.worldId} className="h-16 w-16 shrink-0 rounded-[10px] border-2 border-ink" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[17px] leading-tight text-ink">{l.name}</span>
                    {!open && prev && (
                      <>
                        <span className="block text-[12px] font-bold text-ink-soft">{l.archetype}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                          <Icon name="lock" className="h-4 w-4" />
                          Locked. Finish Chapter 1 of {lives[prev].archetype} to unlock.
                        </span>
                      </>
                    )}
                    {open && (
                      <>
                    <span className="block text-[12px] font-bold text-ink-soft">
                      {l.archetype} · Ch. {l.chapter.number}, {l.chapter.eventIndex}/{l.chapter.eventTotal}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 font-display text-[16px] text-cash-700 tabular-nums">
                      <Icon name="cash" className="h-4 w-4" />
                      {formatMoneyExact(l.cash)}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-bold text-ink-soft tabular-nums">
                      {statKeys(roleOfLife[id]).map((k) => `${STAT_LABELS[k]} ${runs[id].stats[k] ?? 0}`).join(' · ')}
                    </span>
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => dispatch({ type: 'openCreator', target: id })}
                    className="btn-3d btn-parch h-10 shrink-0 gap-1.5 rounded-[10px] px-2.5 text-[13px] font-extrabold [--lip:3px]"
                    aria-label={`Edit ${l.name}'s name and look`}
                    data-tour={`name-look-${id}`}
                  >
                    <Icon name="hanger" className="h-5 w-5" />
                    Name &amp; look
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="surface-utility flex flex-wrap items-center justify-between gap-3 p-3">
          <span className="flex items-center gap-2 text-[14px] font-bold text-parch-200">
            <Icon name="gear" className="h-6 w-6" />
            Want the welcome tour again?
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: 'onboardingStart' })}
            className="btn-3d btn-parch min-h-11 gap-2 rounded-[10px] px-4 text-[14px] font-extrabold"
          >
            <Icon name="book" className="h-5 w-5" />
            Replay Tutorial
          </button>
        </section>
      </div>
    </div>
  )
}
