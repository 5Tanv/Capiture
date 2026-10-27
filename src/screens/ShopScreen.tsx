import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { EffectLayer } from '../components/shop/EffectLayer'
import { FrameLayer } from '../components/shop/FrameLayer'
import { ProfileStage } from '../components/shop/ProfileStage'
import { TitlePlaque } from '../components/shop/TitlePlaque'
import { CharacterPortrait, CharacterSprite } from '../components/sprite/CharacterSprite'
import { Icon } from '../components/ui/Icon'
import {
  assetOf,
  categoryOrder,
  featured,
  getItem,
  itemsById,
  itemsInSlot,
  rarityLabel,
  shopItems,
  slotLabel,
  type Category,
  type Rarity,
  type ShopItem,
  type Slot,
} from '../data/shop'
import { formatNumber } from '../lib/format'
import { purchase, readStoredProgress, type PurchaseOutcome } from '../lib/saveStore'
import { ensureAsset, useAsset } from '../lib/shopAssets'
import { goalStatus, spentCoins, type GoalStatus, type Loadout } from '../lib/shopStore'
import { useShopView, wornLook } from '../lib/useShop'
import { useGame, useGameDispatch } from '../state/GameProvider'

type Filter = 'all' | 'owned' | 'unowned'
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unowned', label: 'Not owned' },
  { id: 'owned', label: 'Owned' },
]

const tabLabel = (c: Category) => (c === 'featured' ? 'Featured' : slotLabel[c].many)

/** Rarity is always written out; the color only backs it up. */
const rarityTone: Record<Rarity, string> = {
  common: 'text-[#e8dcc0] border-[#8a7f66]',
  uncommon: 'text-[#9be6a8] border-[#3f8f55]',
  rare: 'text-[#9fcfff] border-[#3f77b8]',
  epic: 'text-[#dcb4ff] border-[#8a55c0]',
  legendary: 'text-[#ffd96b] border-[#c9962c]',
}

function RarityChip({ rarity }: { rarity: Rarity }) {
  return (
    <span className={`inline-flex items-center rounded-full border-2 bg-black/70 px-1.5 py-px text-[11px] leading-tight font-extrabold ${rarityTone[rarity]}`}>
      {rarityLabel[rarity]}
    </span>
  )
}

function Coins({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-display tabular-nums ${className}`}>
      <Icon name="coin" className="h-4 w-4" />
      {formatNumber(n)}
    </span>
  )
}

/** The picture on a shelf card: the item as it would look, never a blank box. */
export function Thumb({ item, look }: { item: ShopItem; look: import('../sprites/catalog').Appearance }) {
  switch (item.slot) {
    case 'title':
      return (
        <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_40%,#35584a,#1d3029)] p-2">
          <TitlePlaque item={item} fixed />
        </div>
      )
    case 'background':
      return <BgThumb src={item.src} position={item.objectPosition} name={item.name} />
    case 'pet':
      return <PetThumb src={item.src} name={item.name} />
    case 'frame':
      return (
        <div className="relative h-full w-full bg-[radial-gradient(circle_at_50%_40%,#35584a,#1d3029)]">
          <FrameLayer item={item} />
        </div>
      )
    case 'effect':
      return (
        <div className="relative h-full w-full [container-type:inline-size] bg-[radial-gradient(circle_at_50%_40%,#2a4a3c,#14231c)]">
          <EffectLayer item={item} />
        </div>
      )
    case 'top':
    case 'bottom':
      return (
        <div className="grid h-full w-full place-items-center bg-[#e7efe3]">
          <CharacterSprite appearance={{ ...look, pack: 'none', ...item.patch }} className="h-[94%]" />
        </div>
      )
    default:
      return (
        <div className="grid h-full w-full place-items-center bg-[#cfe9f3]">
          <CharacterPortrait appearance={{ ...look, hat: 'none', glasses: 'none', ...item.patch }} className="aspect-square h-[88%]" />
        </div>
      )
  }
}

function BgThumb({ src, position, name }: { src: string; position: string; name: string }) {
  const state = useAsset(src)
  if (state === 'error') return <Missing name={name} />
  return state === 'ready' ? <img src={src} alt="" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: position }} /> : <div className="h-full w-full animate-pulse bg-black/30" />
}

function PetThumb({ src, name }: { src: string; name: string }) {
  const state = useAsset(src)
  if (state === 'error') return <Missing name={name} />
  return (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_60%,#35584a,#1d3029)]">
      {state === 'ready' && <img src={src} alt="" draggable={false} className="h-[96%] w-[96%] object-contain" />}
    </div>
  )
}

function Missing({ name }: { name: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-black/40 p-2 text-center text-[12px] font-bold text-parch-200">
      <span>
        <Icon name="lock" className="mx-auto mb-1 h-6 w-6" />
        {name} art is unavailable, so it is not for sale.
      </span>
    </div>
  )
}

/** Whether the item can be bought right now: its renderer exists and its art is not broken. */
function useSellable(item: ShopItem | null): boolean {
  const state = useAsset(item ? assetOf(item) : null)
  return item !== null && state !== 'error'
}

interface CardProps {
  item: ShopItem
  look: import('../sprites/catalog').Appearance
  owned: boolean
  equipped: boolean
  previewing: boolean
  onTry: () => void
  onEquip: () => void
  onUnequip: () => void
  goal: boolean
  onGoal: () => void
}

function ItemCard({ item, look, owned, equipped, previewing, onTry, onEquip, onUnequip, goal, onGoal }: CardProps) {
  const wide = item.slot === 'background' || item.slot === 'frame' || item.slot === 'effect'
  const art = assetOf(item)
  const broken = useAsset(art) === 'error'
  return (
    <li
      className={`slot flex min-w-0 flex-col overflow-hidden ${previewing ? 'ring-[3px] ring-brass-400' : equipped ? 'ring-[3px] ring-cash-500' : ''}`}
      data-item={item.id}
      data-owned={owned}
    >
      <div className={`relative overflow-hidden ${wide ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}>
        <Thumb item={item} look={look} />
        <span className="absolute top-1.5 right-1.5">
          <RarityChip rarity={item.rarity} />
        </span>
        {owned && (
          <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full border-2 border-ink bg-cash-500 px-1.5 py-px text-[11px] font-extrabold text-ink">
            <Icon name="check" className="h-3.5 w-3.5" />
            {equipped ? 'Equipped' : 'Owned'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div>
          <p className="font-display text-[15px] leading-tight">{item.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug font-semibold text-sage-300">{item.description}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          {owned ? (
            <span className="text-[12px] font-extrabold text-sage-300">Yours</span>
          ) : (
            <Coins n={item.price} className="text-[15px] text-brass-400" />
          )}
          {owned ? (
            equipped ? (
              <button type="button" onClick={onUnequip} className="btn-3d btn-parch min-h-9 rounded-[8px] px-2.5 text-[12px] font-extrabold whitespace-nowrap [--lip:3px]" aria-label={`${item.name} is equipped. Unequip`}>
                Equipped · Unequip
              </button>
            ) : (
              <button type="button" onClick={onEquip} className="btn-3d btn-green min-h-9 rounded-[8px] px-3 text-[12px] font-extrabold whitespace-nowrap text-ink [--lip:3px]" aria-label={`Equip ${item.name}`}>
                Equip
              </button>
            )
          ) : broken ? (
            <span className="text-[12px] font-extrabold text-parch-300">Unavailable</span>
          ) : (
            <button
              type="button"
              onClick={onTry}
              aria-pressed={previewing}
              aria-label={`${previewing ? 'Previewing' : 'Try on'} ${item.name}, ${item.price} FiCoins`}
              className={`btn-3d min-h-9 shrink-0 rounded-[8px] px-2.5 text-[12px] font-extrabold whitespace-nowrap [--lip:3px] ${previewing ? 'btn-gold text-ink' : 'btn-parch'}`}
            >
              {previewing ? 'Previewing' : 'Try on'}
            </button>
          )}
        </div>
        {!owned && !broken && <GoalButton item={item} goal={goal} onGoal={onGoal} />}
      </div>
    </li>
  )
}

/** Free to press: marks the item as the savings goal. It never buys, reserves or equips. */
function GoalButton({ item, goal, onGoal, className = '' }: { item: ShopItem; goal: boolean; onGoal: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onGoal}
      aria-pressed={goal}
      aria-label={goal ? `${item.name} is your savings goal. Clear goal` : `Save toward ${item.name}`}
      className={`min-h-8 w-full rounded-[8px] border-2 px-2 text-[12px] font-extrabold ${goal ? 'border-ink bg-brass-400 text-ink' : 'border-parch-300/40 text-parch-200 hover:border-parch-300'} ${className}`}
      data-goal-toggle
    >
      {goal ? '★ Savings goal · Clear' : '☆ Save toward this'}
    </button>
  )
}

/** The savings goal at a glance, with Change and Clear. */
function GoalPanel({ status, balance, onChange, onClear }: { status: GoalStatus; balance: number; onChange: () => void; onClear: () => void }) {
  const item = status.kind === 'none' ? undefined : status.item
  const line =
    status.kind === 'none'
      ? 'No goal yet. Tap “Save toward this” on anything you want. It’s free and holds no coins.'
      : status.kind === 'unavailable'
        ? `${item?.name ?? 'Your goal item'} isn’t sold anymore. Your coins and items are untouched.`
        : status.kind === 'collected'
          ? `Goal collected! ${status.item.name} is yours.`
          : status.kind === 'reached'
            ? `Goal reached! You have ${formatNumber(balance)} / ${formatNumber(status.item.price)} FiCoins for ${status.item.name}.`
            : `${status.item.name}: ${formatNumber(balance)} / ${formatNumber(status.item.price)} FiCoins, ${formatNumber(status.remaining)} to go.`
  return (
    <section aria-labelledby="goal-h" className="surface-utility flex flex-col gap-2 px-3 py-2.5" data-goal-panel>
      <h2 id="goal-h" className="txt-game-sm text-[15px]">Savings goal</h2>
      <p className="text-[13px] leading-snug font-semibold text-parch-200">{line}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onChange} className="btn-3d btn-parch min-h-9 rounded-[8px] px-3 text-[12px] font-extrabold [--lip:3px]">
          {status.kind === 'none' ? 'Choose a goal' : status.kind === 'saving' || status.kind === 'reached' ? 'Change goal' : 'Choose next goal'}
        </button>
        {status.kind !== 'none' && (
          <button type="button" onClick={onClear} className="btn-3d min-h-9 rounded-[8px] px-3 text-[12px] font-extrabold [--lip:3px]">
            Clear goal
          </button>
        )}
      </div>
    </section>
  )
}

/** The purchase bar. It always shows the real balance, the item's price and any shortfall. */
function PurchaseBar({ item, balance, busy, onBuy, onCancel, goal, onGoal }: { item: ShopItem; balance: number; busy: boolean; onBuy: (equip: boolean) => void; onCancel: () => void; goal: boolean; onGoal: () => void }) {
  const sellable = useSellable(item)
  const short = item.price - balance
  const can = sellable && short <= 0 && !busy
  const block = (e: { preventDefault(): void }) => e.preventDefault()
  return (
    <div
      className="panel-wood fixed inset-x-2 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[34rem] flex-col gap-2 p-3 lg:relative lg:inset-auto lg:mx-0 lg:max-w-none"
      role="group"
      aria-label={`Preview of ${item.name}`}
      data-purchase-bar
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-wide text-sage-300 uppercase">Previewing · {slotLabel[item.slot].one}</p>
          <p className="truncate font-display text-lg leading-tight">{item.name}</p>
        </div>
        <RarityChip rarity={item.rarity} />
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] font-bold text-parch-200">
        <span className="flex items-center gap-1">
          Price <Coins n={item.price} className="text-brass-300" />
        </span>
        <span className="flex items-center gap-1">
          You have <Coins n={balance} className={short > 0 ? 'text-[#ff9c8f]' : 'text-cash-500'} />
        </span>
      </p>
      {!sellable ? (
        <p className="text-[13px] font-extrabold text-[#ffb0a0]" role="alert">This item&rsquo;s art could not load, so it can&rsquo;t be bought right now.</p>
      ) : short > 0 ? (
        <p className="text-[13px] font-extrabold text-[#ffb0a0]" data-shortfall>
          You need {formatNumber(short)} more FiCoin{short === 1 ? '' : 's'}. Trying it on is still free.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={(e) => (can ? onBuy(true) : block(e))}
          aria-disabled={!can}
          className={`btn-3d btn-gold col-span-2 min-h-11 rounded-[12px] px-3 text-ink ${can ? '' : 'cursor-not-allowed opacity-55 grayscale-[0.5]'}`}
          data-buy-equip
        >
          <span className="txt-game-sm text-[15px] leading-none">{busy ? 'Buying…' : `Buy & equip — ${formatNumber(item.price)} FiCoins`}</span>
        </button>
        <button
          type="button"
          onClick={(e) => (can ? onBuy(false) : block(e))}
          aria-disabled={!can}
          className={`btn-3d btn-green min-h-10 rounded-[10px] px-2 text-[13px] font-extrabold text-ink [--lip:3px] ${can ? '' : 'cursor-not-allowed opacity-55 grayscale-[0.5]'}`}
          data-buy-only
        >
          Buy only
        </button>
        <button type="button" onClick={onCancel} className="btn-3d btn-parch min-h-10 rounded-[10px] px-2 text-[13px] font-extrabold [--lip:3px]" data-cancel-preview>
          Cancel preview
        </button>
        {sellable && <GoalButton item={item} goal={goal} onGoal={onGoal} className="col-span-2" />}
      </div>
    </div>
  )
}

function failureText(out: Extract<PurchaseOutcome, { ok: false }>, item: ShopItem): string {
  switch (out.reason) {
    case 'insufficient':
      return `Not enough FiCoins: ${item.name} costs ${formatNumber(item.price)} and you have ${formatNumber(out.balance)}. You need ${formatNumber(out.need ?? item.price - out.balance)} more. Nothing was charged.`
    case 'asset':
      return `${item.name}'s art could not load, so it was not sold. Nothing was charged.`
    case 'unavailable':
    case 'unknown':
      return `${item.name} isn't available to buy. Nothing was charged.`
    case 'storage':
      return 'Your browser could not save the purchase, so nothing was charged and your wardrobe is unchanged. Please try again.'
  }
}

/** The cosmetic store: try items on for free, then buy them with FiCoins. */
export function ShopScreen() {
  const { shop, account } = useGame()
  const dispatch = useGameDispatch()
  const { owned, loadout, look: wornNow, legacyNames } = useShopView()
  const [category, setCategory] = useState<Category>('featured')
  const [filter, setFilter] = useState<Filter>('all')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null)
  const busyRef = useRef(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const goal = goalStatus(shop.goalId, owned, account.fiCoins)
  const toggleGoal = (item: ShopItem) => dispatch({ type: 'shopGoal', itemId: shop.goalId === item.id ? null : item.id })

  // Arriving from the home goal card: open that item's shelf, and its preview if it's still for sale.
  const { shopFocus } = useGame()
  useEffect(() => {
    if (shopFocus === null) return
    const item = getItem(shopFocus)
    if (item) {
      setCategory(item.slot)
      if (!owned.has(item.id)) setPreviewId(item.id)
    }
    dispatch({ type: 'shopFocusDone' })
  }, [shopFocus, owned, dispatch])

  const changeGoal = () => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tab = tabRefs.current[category]
    tab?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' })
    tab?.focus({ preventScroll: true })
  }

  // The preview is only ever an unowned item; once it is owned there is nothing left to try.
  const preview = useMemo(() => {
    const it = getItem(previewId)
    return it && !owned.has(it.id) ? it : null
  }, [previewId, owned])

  const shown: Loadout = preview ? { ...loadout, [preview.slot]: preview } : loadout
  const look = preview ? wornLook(account.appearance, shown) : wornNow
  const balance = account.fiCoins

  const counts = useMemo(() => {
    const per = {} as Record<Slot, { owned: number; total: number }>
    for (const i of shopItems) {
      const c = (per[i.slot] ??= { owned: 0, total: 0 })
      c.total++
      if (owned.has(i.id)) c.owned++
    }
    return per
  }, [owned])
  const totalOwned = shopItems.filter((i) => owned.has(i.id)).length

  const list = useMemo(() => {
    const base = category === 'featured' ? featured : itemsInSlot(category)
    return base.filter((i) => (filter === 'all' ? true : filter === 'owned' ? owned.has(i.id) : !owned.has(i.id)))
  }, [category, filter, owned])

  const refreshFromStorage = () => {
    const stored = readStoredProgress()
    if (stored) dispatch({ type: 'syncStorage', mastery: stored.mastery, runs: {}, shop: stored.shop })
  }

  const tryOn = (item: ShopItem) => {
    setNotice(null)
    setPreviewId((p) => (p === item.id ? null : item.id))
    if (window.matchMedia('(max-width: 1023px)').matches) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      stageRef.current?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' })
    }
  }

  const buy = async (equip: boolean) => {
    const item = preview
    if (!item || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      const art = assetOf(item)
      const assetOk = art ? await ensureAsset(art) : true
      const out = await purchase({ itemId: item.id, equip, legacyNames, assetOk })
      if (out.ok) {
        if (out.stored) dispatch({ type: 'syncStorage', mastery: out.stored.mastery, runs: {}, shop: out.stored.shop })
        setPreviewId(null)
        setNotice({
          kind: 'ok',
          text: out.alreadyOwned
            ? `${item.name} was already yours, so you weren't charged.${equip ? ' It is equipped.' : ''}`
            : `${item.name} is yours for ${formatNumber(out.charged)} FiCoins.${equip ? ' It is equipped.' : ' Equip it from the shelf any time.'}`,
        })
      } else {
        refreshFromStorage()
        setNotice({ kind: 'bad', text: failureText(out, item) })
      }
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const equip = (item: ShopItem) => dispatch({ type: 'shopEquip', slot: item.slot, itemId: item.id })
  const unequip = (slot: Slot) => dispatch({ type: 'shopEquip', slot, itemId: null })

  const onTabKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? categoryOrder.length - 1 : d ? (i + d + categoryOrder.length) % categoryOrder.length : null
    if (to === null) return
    e.preventDefault()
    setCategory(categoryOrder[to])
    tabRefs.current[categoryOrder[to]]?.focus()
  }

  const slotOfTab = category === 'featured' ? null : category
  const equippedHere = slotOfTab ? loadout[slotOfTab] : undefined
  const dragon = itemsById['shop.pet.auric-star-dragon']

  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-5 pb-48 lg:grid-cols-[24rem_minmax(0,1fr)] lg:px-6 lg:pb-10">
      {/* fitting room */}
      <aside className="flex flex-col gap-3 lg:sticky lg:top-5 lg:self-start" aria-label="Preview">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[12px] border-[3px] border-ink bg-[#7a4a86]">
            <Icon name="bag" className="h-8 w-8" />
          </span>
          <div>
            <h1 className="txt-game text-3xl leading-none">Shop</h1>
            <p className="mt-1 text-[13px] font-semibold text-sage-300">Cosmetics for your profile, paid in FiCoins.</p>
          </div>
        </div>
        <div ref={stageRef} className="panel-wood scroll-mt-20 p-[7px]">
          <ProfileStage look={look} loadout={shown} label={preview ? `Your avatar previewing ${preview.name}` : 'Your profile as it is now'} />
        </div>
        <div className="surface-hud flex items-center justify-between gap-3 px-3 py-2.5" data-tour="shop-coins">
          <span className="flex items-center gap-2">
            <Icon name="coin" className="h-7 w-7" />
            <span className="font-display text-xl tabular-nums" data-balance>{formatNumber(balance)}</span>
            <span className="text-[12px] font-extrabold text-sage-300">FiCoins</span>
          </span>
          <span className="text-[12px] font-bold text-sage-300 tabular-nums">
            {totalOwned}/{shopItems.length} collected
          </span>
        </div>
        {preview ? (
          <PurchaseBar item={preview} balance={balance} busy={busy} onBuy={buy} onCancel={() => setPreviewId(null)} goal={shop.goalId === preview.id} onGoal={() => toggleGoal(preview)} />
        ) : (
          <p className="surface-utility px-3 py-2.5 text-[13px] leading-snug font-semibold text-sage-300">
            Pick something and tap Try on. Trying on is always free and never changes what you own. FiCoins come from learning; a life&rsquo;s cash is never spent here.
          </p>
        )}
        <GoalPanel status={goal} balance={balance} onChange={changeGoal} onClear={() => dispatch({ type: 'shopGoal', itemId: null })} />
        <p role="status" aria-live="polite" className={notice ? `rounded-[10px] border-2 px-3 py-2 text-[13px] font-bold ${notice.kind === 'ok' ? 'border-cash-500 bg-cash-500/15 text-parch-100' : 'border-[#ff9c8f] bg-[#ff9c8f]/15 text-parch-100'}` : 'sr-only'} data-notice>
          {notice?.text}
        </p>
      </aside>

      {/* shelves */}
      <div className="flex min-w-0 flex-col gap-4" data-tour="shop-shelf">
        <div role="tablist" aria-label="Shop categories" className="flex gap-1.5 overflow-x-auto pb-1">
          {categoryOrder.map((c, i) => {
            const on = c === category
            const n = c === 'featured' ? null : counts[c]
            return (
              <button
                key={c}
                ref={(el) => {
                  tabRefs.current[c] = el
                }}
                type="button"
                role="tab"
                id={`tab-${c}`}
                aria-selected={on}
                aria-controls="shop-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setCategory(c)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`btn-3d min-h-10 shrink-0 rounded-[10px] px-3 text-[13px] font-extrabold whitespace-nowrap [--lip:3px] ${on ? 'btn-gold text-ink' : 'btn-parch'}`}
              >
                {tabLabel(c)}
                {n && <span className="ml-1.5 opacity-75 tabular-nums">{n.owned}/{n.total}</span>}
              </button>
            )
          })}
        </div>

        <div id="shop-panel" role="tabpanel" aria-labelledby={`tab-${category}`} className="flex flex-col gap-3">
          {category === 'featured' && dragon && (
            <section className="slot overflow-hidden" aria-labelledby="dragon-h" data-featured-dragon>
              <div className="grid gap-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                <div className="aspect-[4/3] sm:aspect-auto"><Thumb item={dragon} look={look} /></div>
                <div className="flex flex-col gap-2 p-4">
                  <RarityChip rarity="legendary" />
                  <h2 id="dragon-h" className="txt-game-sm text-2xl leading-none">{dragon.name}</h2>
                  <p className="text-[13px] leading-snug font-semibold text-parch-200">{dragon.description} A savings goal worth working toward.</p>
                  {owned.has(dragon.id) ? (
                    <p className="text-[13px] font-extrabold text-cash-500">In your collection.</p>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-extrabold text-parch-200">
                        <span>{formatNumber(Math.min(balance, dragon.price))} / {formatNumber(dragon.price)} FiCoins</span>
                        <span>{balance >= dragon.price ? 'Ready to buy' : `${formatNumber(dragon.price - balance)} to go`}</span>
                      </div>
                      <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-ink bg-black/40" role="progressbar" aria-label="Savings toward the Auric Star Dragon" aria-valuemin={0} aria-valuemax={dragon.price} aria-valuenow={Math.min(balance, dragon.price)}>
                        <div className="h-full bg-brass-400" style={{ width: `${Math.min(100, (balance / dragon.price) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label="Show" className="flex gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`min-h-9 rounded-full border-2 px-3 text-[12px] font-extrabold ${filter === f.id ? 'border-ink bg-brass-400 text-ink' : 'border-parch-300/40 text-parch-200 hover:border-parch-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {slotOfTab && (
              <p className="flex items-center gap-2 text-[12px] font-bold text-sage-300">
                <span>
                  Wearing: <b className="text-parch-100">{equippedHere?.name ?? slotLabel[slotOfTab].none}</b>
                </span>
                {equippedHere && (
                  <button type="button" onClick={() => unequip(slotOfTab)} className="btn-3d btn-parch min-h-8 rounded-[8px] px-2 text-[12px] font-extrabold [--lip:2px]">
                    Set to None
                  </button>
                )}
              </p>
            )}
          </div>

          {list.length === 0 ? (
            <p className="slot-empty p-6 text-center text-[14px] font-bold text-sage-300">
              {filter === 'owned' ? 'You don’t own anything here yet. Try something on!' : 'You own everything here. Nice collection!'}
            </p>
          ) : (
            <ul className="surface-collection grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-4">
              {list.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  look={account.appearance}
                  owned={owned.has(item.id)}
                  equipped={loadout[item.slot]?.id === item.id}
                  previewing={preview?.id === item.id}
                  onTry={() => tryOn(item)}
                  onEquip={() => equip(item)}
                  onUnequip={() => unequip(item.slot)}
                  goal={shop.goalId === item.id}
                  onGoal={() => toggleGoal(item)}
                />
              ))}
            </ul>
          )}
        </div>

        <section aria-labelledby="receipts-h" className="surface-utility p-3" data-receipts>
          <h2 id="receipts-h" className="txt-game-sm flex items-center gap-2 text-lg">
            <Icon name="bill" className="h-5 w-5" />
            Cosmetic purchases
          </h2>
          <p className="mt-1 text-[12px] font-semibold text-sage-300">Kept apart from lesson rewards. Total spent: {formatNumber(spentCoins(shop))} FiCoins.</p>
          {shop.receipts.length === 0 ? (
            <p className="mt-2 text-[13px] font-bold text-parch-300">Nothing bought yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {[...shop.receipts].reverse().map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-[8px] bg-black/25 px-3 py-1.5 text-[13px]">
                  <span className="min-w-0 truncate font-extrabold">{r.name}</span>
                  <span className="shrink-0 font-bold text-parch-300 tabular-nums">
                    −{formatNumber(r.price)} · left {formatNumber(r.balanceAfter)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
