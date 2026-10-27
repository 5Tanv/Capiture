import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NAME_MAX } from '../../lib/saveStore'
import { lifeOrder } from '../../data/lives'
import { ramp } from '../../sprites/color'
import {
  accountPreset,
  bottoms,
  dyes,
  eyeColors,
  eyeShapes,
  faceDetails,
  glasses,
  hairColors,
  hairStyles,
  hats,
  lifePresets,
  packs,
  premiumClothing,
  premiumDefaults,
  randomAppearance,
  shoes,
  skinTones,
  tops,
  watches,
  type Appearance,
} from '../../sprites/catalog'
import { lifeThemes } from '../../theme/lifeThemes'
import { useShopView } from '../../lib/useShop'
import { useGame, useGameDispatch } from '../../state/GameProvider'
import type { CreatorTarget } from '../../state/gameReducer'
import { scenes } from '../world/scenes'
import { CharacterPortrait, CharacterSprite, SvgCharacter } from '../sprite/CharacterSprite'
import { Icon } from '../ui/Icon'

type Tab = 'face' | 'hair' | 'outfit' | 'shoes' | 'extras'

const TABS: { id: Tab; label: string }[] = [
  { id: 'face', label: 'Body & Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'extras', label: 'Extras' },
]

/** Opens over everything when a life is first played, or from "Edit look". */
export function CharacterCreator() {
  const { creator, lives, account } = useGame()
  const dispatch = useGameDispatch()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (creator && !d.open) d.showModal()
    if (!creator && d.open) d.close()
  }, [creator])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="creator-title"
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-parch-100 backdrop:bg-pine-950/85 lg:m-auto lg:h-[min(52rem,calc(100dvh-2rem))] lg:w-[min(78rem,calc(100vw-2rem))]"
      onCancel={(e) => {
        e.preventDefault()
        // Esc keeps the current look on a first visit; otherwise it discards the edit.
        if (creator?.firstTime) dialogRef.current?.dispatchEvent(new CustomEvent('creator-confirm'))
        else dispatch({ type: 'closeCreator' })
      }}
    >
      {creator && (
        <CreatorBody
          key={`${creator.target}-${creator.firstTime}`}
          target={creator.target}
          firstTime={creator.firstTime}
          initialName={creator.target === 'account' ? account.username : lives[creator.target].name}
          initial={creator.target === 'account' ? account.appearance : lives[creator.target].appearance}
          dialog={dialogRef}
        />
      )}
    </dialog>
  )
}

function CreatorBody({
  target,
  firstTime,
  initialName,
  initial,
  dialog,
}: {
  target: CreatorTarget
  firstTime: boolean
  initialName: string
  initial: Appearance
  dialog: React.RefObject<HTMLDialogElement | null>
}) {
  const { lives } = useGame()
  const dispatch = useGameDispatch()
  const [look, setLook] = useState(initial)
  const [name, setName] = useState(initialName)
  const [tab, setTab] = useState<Tab>('face')
  const [equipKey, setEquipKey] = useState(0)
  const isAccount = target === 'account'
  const life = isAccount ? null : lives[target]
  const theme = life ? lifeThemes[life.id] : null
  const defaultLook = isAccount ? accountPreset : lifePresets[target]
  const nameOk = name.trim().length > 0

  const set = (patch: Partial<Appearance>) => {
    setLook((l) => ({ ...l, ...patch }))
    setEquipKey((k) => k + 1)
  }

  const confirm = () => {
    if (!nameOk) return
    dispatch({ type: 'saveCharacter', target, name, appearance: look })
  }
  const confirmRef = useRef(confirm)
  confirmRef.current = confirm
  useEffect(() => {
    const d = dialog.current
    const onConfirm = () => confirmRef.current()
    d?.addEventListener('creator-confirm', onConfirm)
    return () => d?.removeEventListener('creator-confirm', onConfirm)
  }, [dialog])

  const title = isAccount ? 'Your Avatar' : firstTime ? `Meet ${life!.name.split(' ')[0]}` : `Edit ${life!.name.split(' ')[0]}`
  const subtitle = isAccount
    ? 'This is you across Capiture: your profile, leagues and badges. It never changes a life.'
    : `${life!.archetype}. ${theme!.mood}. This look is saved for this life only.`

  return (
    <div className="flex h-full flex-col lg:p-0" style={theme ? ({ '--life-accent': theme.accent, '--life-accent-2': theme.accent2 } as React.CSSProperties) : undefined}>
      <div className="panel-wood flex h-full min-h-0 flex-col overflow-hidden rounded-none border-x-0 lg:rounded-[var(--radius-panel)] lg:border-x-[3px]">
        <header className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-2 sm:px-6 sm:pt-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border-2 border-ink" style={{ background: theme?.accent ?? 'var(--color-xp-500)' }}>
            <Icon name="brush" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 id="creator-title" className="txt-game text-2xl leading-none sm:text-[1.75rem]">{title}</h2>
            <p className="mt-1 line-clamp-2 text-[13px] font-semibold text-parch-300 sm:text-[14px]">{subtitle}</p>
          </div>
          {!firstTime && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'closeCreator' })}
              className="btn-3d ml-auto h-10 w-10 shrink-0 rounded-[10px] text-parch-100 [--lip:3px]"
              aria-label="Close without saving"
            >
              <span aria-hidden className="font-display text-xl leading-none">×</span>
            </button>
          )}
        </header>

        {/* Short screens: this body scrolls between the pinned header and footer instead of
            squeezing the editor to nothing; each part keeps a usable minimum height. */}
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(18rem,1fr)] gap-3 overflow-y-auto overscroll-contain px-3 pb-3 sm:px-5 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:grid-rows-[minmax(min-content,1fr)] lg:gap-5 lg:pb-5 lg:short:gap-3 lg:short:pb-3">
          {/* Preview: the character standing in their world */}
          <div className="flex flex-col gap-3 lg:min-h-0">
            <Preview look={look} target={target} equipKey={equipKey} />
            <div className="surface-hud flex items-center gap-3 p-2 sm:p-2.5">
              <CharacterPortrait appearance={look} className="hidden h-14 w-14 shrink-0 rounded-[10px] border-2 border-ink bg-sky-300 min-[420px]:block" label="Portrait preview" />
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[12px] font-extrabold tracking-wide text-sage-300 uppercase">{isAccount ? 'Your name' : 'Name'} (up to {NAME_MAX} characters)</span>
                  <input
                    value={name}
                    onChange={(e) => setName([...e.target.value].slice(0, NAME_MAX).join(''))}
                    aria-invalid={!nameOk}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 w-full rounded-[8px] border-2 border-ink bg-parch-100 px-3 font-display text-lg text-ink outline-none focus-visible:outline-[3px] focus-visible:outline-brass-300"
                  />
                </label>
            </div>
            <Presets current={look} onPick={(a) => set(a)} />
          </div>

          {/* Options */}
          <div className="surface-reading flex min-h-0 flex-col overflow-hidden">
            <div role="tablist" aria-label="Customize" className="flex shrink-0 gap-1 overflow-x-auto border-b-2 border-parch-300 px-2 pt-2 [scrollbar-width:none]">
              {TABS.map((t) => {
                const active = t.id === tab
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`relative min-h-11 shrink-0 rounded-t-[10px] px-3.5 font-display text-[16px] transition-colors sm:px-4 ${
                      active ? 'bg-parch-200 text-ink' : 'text-ink-soft hover:bg-parch-200/60'
                    }`}
                  >
                    {t.label}
                    {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t" style={{ background: 'var(--life-accent, var(--color-xp-500))' }} aria-hidden />}
                  </button>
                )
              })}
            </div>
            <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
              <TabContent tab={tab} look={look} set={set} />
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t-2 border-ink/60 bg-black/25 px-3 py-3 sm:px-5">
          <button type="button" onClick={() => set(randomAppearance())} className="btn-3d btn-teal min-h-12 gap-2 rounded-[12px] px-4 text-white">
            <Icon name="dice" className="h-6 w-6" />
            <span className="txt-game-sm hidden text-[15px] leading-none min-[420px]:inline">Randomize</span>
            <span className="sr-only min-[420px]:hidden">Randomize</span>
          </button>
          <button type="button" onClick={() => set(defaultLook)} className="btn-3d btn-parch min-h-12 rounded-[12px] px-4 text-[14px] font-extrabold">
            Reset
          </button>
          <p className="mx-2 hidden text-[13px] font-semibold text-parch-300 md:block">Every option here is free. Special shop clothing shows up once you've bought it.</p>
          <button
            type="button"
            onClick={confirm}
            disabled={!nameOk}
            className="btn-3d btn-gold btn-shine ml-auto min-h-12 gap-2 rounded-[12px] px-5 sm:px-7"
          >
            <span className="txt-game text-[17px] leading-none whitespace-nowrap sm:text-xl">{firstTime ? 'START THIS LIFE' : 'SAVE LOOK'}</span>
            <Icon name="arrow" className="h-5 w-4" />
          </button>
        </footer>
      </div>
    </div>
  )
}

function Preview({ look, target, equipKey }: { look: Appearance; target: CreatorTarget; equipKey: number }) {
  const { lives } = useGame()
  const world = target === 'account' ? null : lives[target].worldId
  const scene = useMemo(() => (world ? scenes[world]() : null), [world])
  if (!scene) {
    return (
      <div className="panel-wood relative grid h-[clamp(9rem,24vh,13rem)] place-items-center overflow-hidden p-2 lg:h-auto lg:min-h-[9rem] lg:flex-1">
        <div className="absolute inset-[7px] rounded-[12px] border-[3px] border-ink bg-[radial-gradient(circle_at_50%_40%,#5fb4d8,#2a5f7a)]" />
        <span className="absolute bottom-[12%] h-3 w-[40%] rounded-[50%] bg-black/30" aria-hidden />
        <CharacterSprite key={equipKey} appearance={look} className="anim-pop relative h-[80%] max-h-[20rem]" label="Avatar preview" />
      </div>
    )
  }
  const { x, y } = scene.standAt
  // A close crop of the world around where the character stands.
  const vw = 100
  const vh = 74
  return (
    <div className="panel-wood relative h-[clamp(9rem,24vh,13rem)] p-[7px] lg:h-auto lg:min-h-[16rem] lg:flex-1 lg:short:min-h-[9rem]">
      <div className="relative h-full overflow-hidden rounded-[12px] border-[3px] border-ink">
        <svg
          viewBox={`${x - vw / 2} ${y - vh + 6} ${vw} ${vh}`}
          preserveAspectRatio="xMidYMax slice"
          shapeRendering="crispEdges"
          className="block h-full w-full"
          role="img"
          aria-label="Character preview"
        >
          {scene.backdrop}
          <rect x={x - 12} y={y - 1} width={24} height={3} fill={scene.groundShadow} opacity={0.9} />
          <g key={equipKey} className="anim-hop" style={{ transformBox: 'fill-box' }}>
            <SvgCharacter appearance={look} x={x} y={y} />
          </g>
          {scene.foreground}
        </svg>
      </div>
    </div>
  )
}

function Presets({ current, onPick }: { current: Appearance; onPick: (a: Appearance) => void }) {
  const looks = [...lifeOrder.map((id) => ({ id: id as string, look: lifePresets[id] })), { id: 'account', look: accountPreset }]
  const names: Record<string, string> = { freshman: 'Campus', professional: 'Weekday', entrepreneur: 'Founder', athlete: 'Court', account: 'Explorer' }
  return (
    <div className="surface-utility hidden p-2.5 lg:block">
      <p className="px-1 text-[12px] font-extrabold tracking-wide text-sage-300 uppercase">Start from a look</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {looks.map(({ id, look }) => {
          const on = JSON.stringify(look) === JSON.stringify(current)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(look)}
              aria-pressed={on}
              className={`flex flex-col items-center gap-1 rounded-[10px] p-1 transition-transform hover:-translate-y-0.5 ${on ? 'bg-brass-500/25 ring-2 ring-brass-400' : ''}`}
            >
              <CharacterPortrait appearance={look} className="aspect-square w-full rounded-[8px] border-2 border-ink bg-sky-300" />
              <span className="text-[11px] font-extrabold text-parch-200">{names[id]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── option groups ────────────────────────────────────────────────────────

function TabContent({ tab, look, set }: { tab: Tab; look: Appearance; set: (p: Partial<Appearance>) => void }) {
  // Shop-exclusive clothing only appears here once it has been bought.
  const { owned } = useShopView()
  const ownedTops = tops.filter((t) => !(t.id in premiumClothing) || owned.has(premiumClothing[t.id]))
  const ownedBottoms = bottoms.filter((b) => !(b.id in premiumClothing) || owned.has(premiumClothing[b.id]))
  const head = (patch: Partial<Appearance>) => <CharacterPortrait appearance={{ ...look, ...patch }} className="aspect-square w-full rounded-[8px] bg-[#cfe9f3]" />
  const full = (patch: Partial<Appearance>) => (
    <span className="grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[8px] bg-[#e7efe3]">
      <CharacterSprite appearance={{ ...look, ...patch }} animate={false} className="h-[92%]" />
    </span>
  )
  switch (tab) {
    case 'face':
      return (
        <>
          <Group title="Skin tone">
            <Swatches items={skinTones.map((s) => ({ id: s.id, name: s.name, colors: s.ramp }))} value={look.skin} onChange={(id) => set({ skin: id })} big />
          </Group>
          <Options title="Eyes" items={eyeShapes} value={look.eyes} onChange={(id) => set({ eyes: id })} render={(id) => head({ eyes: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
          <Group title="Eye color">
            <Swatches items={eyeColors.map((s) => ({ id: s.id, name: s.name, colors: s.ramp }))} value={look.eyeColor} onChange={(id) => set({ eyeColor: id })} />
          </Group>
          <Options title="Details" items={faceDetails} value={look.detail} onChange={(id) => set({ detail: id })} render={(id) => head({ detail: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
        </>
      )
    case 'hair':
      return (
        <>
          <Options title="Hairstyle" items={hairStyles} value={look.hair} onChange={(id) => set({ hair: id })} render={(id) => head({ hair: id, hat: 'none' })} />
          <Group title="Hair color">
            <Swatches items={hairColors.map((s) => ({ id: s.id, name: s.name, colors: s.ramp }))} value={look.hairColor} onChange={(id) => set({ hairColor: id })} />
          </Group>
        </>
      )
    case 'outfit':
      return (
        <>
          <Options title="Top" items={ownedTops} value={look.top} onChange={(id) => set({ top: id, ...premiumDefaults[id] })} render={(id) => full({ top: id, pack: 'none', ...premiumDefaults[id] })} />
          <Group title="Top color">
            <DyeSwatches value={look.topColor} onChange={(id) => set({ topColor: id })} />
          </Group>
          <Group title="Trim and inner layer">
            <DyeSwatches value={look.topAccent} onChange={(id) => set({ topAccent: id })} />
          </Group>
          <Options title="Bottoms" items={ownedBottoms} value={look.bottom} onChange={(id) => set({ bottom: id, ...premiumDefaults[id] })} render={(id) => full({ bottom: id, pack: 'none', ...premiumDefaults[id] })} />
          <Group title="Bottoms color">
            <DyeSwatches value={look.bottomColor} onChange={(id) => set({ bottomColor: id })} />
          </Group>
        </>
      )
    case 'shoes':
      return (
        <>
          <Options title="Shoes" items={shoes} value={look.shoes} onChange={(id) => set({ shoes: id })} render={(id) => full({ shoes: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
          <Group title="Shoe color">
            <DyeSwatches value={look.shoeColor} onChange={(id) => set({ shoeColor: id })} />
          </Group>
        </>
      )
    case 'extras':
      return (
        <>
          <Options title="Hat" items={hats} value={look.hat} onChange={(id) => set({ hat: id })} render={(id) => head({ hat: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
          {look.hat !== 'none' && (
            <Group title="Hat color">
              <DyeSwatches value={look.hatColor} onChange={(id) => set({ hatColor: id })} />
            </Group>
          )}
          <Options title="Glasses" items={glasses} value={look.glasses} onChange={(id) => set({ glasses: id })} render={(id) => head({ glasses: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
          <Options title="Bag" items={packs} value={look.pack} onChange={(id) => set({ pack: id })} render={(id) => full({ pack: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
          {look.pack !== 'none' && (
            <Group title="Bag color">
              <DyeSwatches value={look.packColor} onChange={(id) => set({ packColor: id })} />
            </Group>
          )}
          <Options title="Wrist" items={watches} value={look.watch} onChange={(id) => set({ watch: id })} render={(id) => full({ watch: id })} cols="grid-cols-4 sm:grid-cols-5 xl:grid-cols-6" />
        </>
      )
  }
}

function Group({ title, children, controls }: { title: string; children: ReactNode; controls?: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-display text-[17px] text-ink">{title}</h3>
        {controls}
      </div>
      {children}
    </section>
  )
}

function Options<T extends string>({
  title,
  items,
  value,
  onChange,
  render,
  cols = 'grid-cols-3 sm:grid-cols-4 xl:grid-cols-6',
}: {
  title: string
  items: readonly { id: T; name: string }[]
  value: T
  onChange: (id: T) => void
  render: (id: T) => ReactNode
  cols?: string
}) {
  const index = Math.max(0, items.findIndex((i) => i.id === value))
  const step = (d: number) => onChange(items[(index + d + items.length) % items.length].id)
  return (
    <Group
      title={title}
      controls={
        <span className="flex items-center gap-1.5">
          <button type="button" onClick={() => step(-1)} className="btn-3d btn-parch h-9 w-9 rounded-[8px] [--lip:3px]" aria-label={`Previous ${title.toLowerCase()}`}>
            <Icon name="arrow" className="h-4 w-3 rotate-180" />
          </button>
          <span className="min-w-[5.5rem] text-center text-[13px] font-extrabold text-ink-soft" aria-live="polite">
            {items[index].name}
          </span>
          <button type="button" onClick={() => step(1)} className="btn-3d btn-parch h-9 w-9 rounded-[8px] [--lip:3px]" aria-label={`Next ${title.toLowerCase()}`}>
            <Icon name="arrow" className="h-4 w-3" />
          </button>
        </span>
      }
    >
      <div role="radiogroup" aria-label={title} className={`grid gap-2 ${cols}`}>
        {items.map((it) => {
          const on = it.id === value
          return (
            <button
              key={it.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(it.id)}
              className={`group flex flex-col items-center gap-1 rounded-[12px] border-2 p-1.5 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 ${
                on ? 'border-ink bg-brass-400 shadow-[0_3px_0_var(--color-ink)]' : 'border-parch-300 bg-parch-100 hover:border-parch-500'
              }`}
            >
              {render(it.id)}
              <span className="text-[12px] leading-tight font-extrabold text-ink">{it.name}</span>
            </button>
          )
        })}
      </div>
    </Group>
  )
}

function Swatches({
  items,
  value,
  onChange,
  big,
}: {
  items: { id: string; name: string; colors: readonly string[] }[]
  value: string
  onChange: (id: string) => void
  big?: boolean
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {items.map((s) => {
        const on = s.id === value
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={s.name}
            title={s.name}
            onClick={() => onChange(s.id)}
            className={`relative grid overflow-hidden rounded-[10px] border-2 border-ink transition-transform duration-150 hover:-translate-y-0.5 ${big ? 'h-14 w-14' : 'h-11 w-11'} ${
              on ? 'ring-[3px] ring-brass-500 ring-offset-2 ring-offset-parch-100' : ''
            }`}
            style={{ gridTemplateRows: '2fr 1fr' }}
          >
            <span style={{ background: s.colors[1] }} />
            <span className="grid grid-cols-3">
              <span style={{ background: s.colors[0] }} />
              <span style={{ background: s.colors[2] }} />
              <span style={{ background: s.colors[3] }} />
            </span>
            {on && <Icon name="check" className="absolute top-0.5 right-0.5 h-4 w-4" />}
          </button>
        )
      })}
    </div>
  )
}

const dyeSwatchItems = dyes.map((d) => ({ id: d.id, name: d.name, colors: ramp(d.base) }))

function DyeSwatches({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <Swatches items={dyeSwatchItems} value={value} onChange={onChange} />
}
