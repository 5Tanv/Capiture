import { useRef, type ReactNode } from 'react'
import { CharacterSprite } from '../sprite/CharacterSprite'
import type { BackgroundItem, PetItem } from '../../data/shop'
import { useAsset, useLive } from '../../lib/shopAssets'
import type { Loadout } from '../../lib/shopStore'
import type { Appearance } from '../../sprites/catalog'
import { SPRITE_H, SPRITE_W } from '../../sprites/render'
import { EffectLayer } from './EffectLayer'
import { FrameLayer } from './FrameLayer'
import { TitlePlaque } from './TitlePlaque'

// The one renderer for a profile stage, used by the Shop preview and the Profile card so a
// purchased background, title, pet, frame and effect look the same in both. It is a 4:3 box:
//   background art (or the default scene) → effect → avatar → pet →
//   frame → title plaque → whatever the caller overlays (the level badge).

const STAGE_RATIO = 4 / 3
const AVATAR_H = 0.62
const FEET_Y = 0.9

/** Where a pet's image sits so its visible feet land on the anchor and it fits the box. */
export function petPlacement(pet: PetItem) {
  const [x0, y0, x1, y1] = pet.bbox
  const [sw, sh] = pet.sourceSize
  const boxW = pet.maxW
  const boxH = pet.maxH / STAGE_RATIO // stage width = 1, so its height is 1 / ratio
  const bw = x1 - x0
  const bh = y1 - y0
  const s = Math.min(boxW / bw, boxH / bh)
  const H = 1 / STAGE_RATIO
  return {
    left: (pet.anchor.x - ((x0 + x1) / 2) * s) * 100,
    top: ((pet.anchor.footY * H - y1 * s) / H) * 100,
    width: sw * s * 100,
    height: ((sh * s) / H) * 100,
  }
}

function PetImage({ pet }: { pet: PetItem }) {
  const state = useAsset(pet.src)
  if (state !== 'ready') return null
  const pl = petPlacement(pet)
  return (
    <img
      src={pet.src}
      alt=""
      draggable={false}
      data-pet={pet.id}
      className={`pointer-events-none absolute max-w-none select-none object-contain ${pet.bob ? 'pet-bob' : ''}`}
      style={{ left: `${pl.left}%`, top: `${pl.top}%`, width: `${pl.width}%`, height: `${pl.height}%`, imageRendering: 'auto' }}
    />
  )
}

function BackgroundImage({ item }: { item: BackgroundItem }) {
  const state = useAsset(item.src)
  if (state !== 'ready') return null
  return <img src={item.src} alt="" draggable={false} data-bg={item.id} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: item.objectPosition }} />
}

interface Props {
  look: Appearance
  loadout: Loadout
  /** Accessible name for the whole scene. */
  label: string
  className?: string
  /** Pause effects and bobbing even when visible (small thumbnails). */
  still?: boolean
  children?: ReactNode
}

export function ProfileStage({ look, loadout, label, className = '', still = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const live = useLive(ref) && !still
  const bg = loadout.background?.slot === 'background' ? loadout.background : null
  const pet = loadout.pet?.slot === 'pet' ? loadout.pet : null
  const title = loadout.title?.slot === 'title' ? loadout.title : null
  const frame = loadout.frame?.slot === 'frame' ? loadout.frame : null
  const effect = loadout.effect?.slot === 'effect' ? loadout.effect : null
  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-[12px] border-[3px] border-ink bg-[radial-gradient(circle_at_50%_35%,#3b6b5a,#1d3029)] [container-type:inline-size] ${live ? '' : 'pet-paused'} ${className}`}
    >
      {bg ? (
        <BackgroundImage item={bg} />
      ) : (
        <span className="absolute inset-x-0 bottom-0 h-[26%] bg-black/20" aria-hidden />
      )}
      {effect && <EffectLayer item={effect} live={live} />}
      <span className="absolute left-1/2 h-[3.5%] w-[24%] -translate-x-1/2 rounded-[50%] bg-black/35" style={{ top: `${(FEET_Y - 0.015) * 100}%` }} aria-hidden />
      <span
        className="absolute left-1/2 block -translate-x-1/2"
        style={{ height: `${AVATAR_H * 100}%`, aspectRatio: `${SPRITE_W} / ${SPRITE_H}`, bottom: `${(1 - FEET_Y) * 100 - 1.5}%` }}
        data-avatar
      >
        <CharacterSprite appearance={look} animate={live} className="h-full w-full" />
      </span>
      {pet && <PetImage pet={pet} />}
      {frame && <FrameLayer item={frame} />}
      {title && (
        <div className="pointer-events-none absolute inset-x-[14%] top-[11%] z-10 flex justify-center">
          <TitlePlaque item={title} />
        </div>
      )}
      {children}
    </div>
  )
}
