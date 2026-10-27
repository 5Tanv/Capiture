import { bottoms, premiumDefaults, tops, type Appearance } from '../sprites/catalog'
import { featuredIds, newCatalogRaw } from './shopCatalog'

// Profile cosmetics, priced in FiCoins. The catalog merges the original hats and glasses (ids and prices unchanged) with the 35 newer titles, backgrounds, pets, frames and
// effects. Everything here is cosmetic: nothing grants coins, XP, stats or life money, and
// buying never touches a life's cash.

export type Slot = 'background' | 'pet' | 'title' | 'frame' | 'effect' | 'top' | 'bottom' | 'headwear' | 'eyewear'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
/** The shelf tabs. */
export type Category = Slot | 'featured'

export const SLOTS: Slot[] = ['background', 'pet', 'title', 'frame', 'effect', 'top', 'bottom', 'headwear', 'eyewear']

export const slotLabel: Record<Slot, { one: string; many: string; none: string }> = {
  background: { one: 'Background', many: 'Backgrounds', none: 'Default stage' },
  pet: { one: 'Pet', many: 'Pets', none: 'No pet' },
  title: { one: 'Title', many: 'Titles', none: 'No title' },
  frame: { one: 'Frame', many: 'Frames', none: 'No frame' },
  effect: { one: 'Effect', many: 'Effects', none: 'No effect' },
  top: { one: 'Top', many: 'Tops', none: 'My own top' },
  bottom: { one: 'Pants', many: 'Pants', none: 'My own pants' },
  headwear: { one: 'Headwear', many: 'Headwear', none: 'My own hat' },
  eyewear: { one: 'Eyewear', many: 'Eyewear', none: 'My own glasses' },
}

export const rarityLabel: Record<Rarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' }

export type FrameStyle = 'stepped_corners' | 'pixel_filigree' | 'pixel_leaves' | 'stepped_waves' | 'pixel_laurel' | 'corner_crowns'
export type EffectStyle = 'slow_fireflies' | 'pixel_coin_sparkles' | 'soft_pixel_halo' | 'orbiting_pixel_stars' | 'restrained_royal_glow'
export type TitleIcon = 'coin' | 'leaf' | 'star' | 'crown'

interface Base {
  /** Stable. Ownership, equipment and receipts store this, never the name. */
  id: string
  name: string
  price: number
  rarity: Rarity
  description: string
}

export interface TitleItem extends Base {
  slot: 'title'
  text: string
  fg: string
  bg: string
  icon: TitleIcon
}
export interface BackgroundItem extends Base {
  slot: 'background'
  /** Bundled image URL, resolved by the asset pipeline. */
  src: string
  objectPosition: string
}
export interface PetItem extends Base {
  slot: 'pet'
  src: string
  /** Where the feet land: the pet's horizontal center and its feet, as fractions of the stage. */
  anchor: { x: number; footY: number }
  /** The largest box the pet may fill, as fractions of the stage's width and height. */
  maxW: number
  maxH: number
  /** Visible pixels in the source image: [x0, y0, x1, y1]. */
  bbox: [number, number, number, number]
  sourceSize: [number, number]
  /** The two magical pets may bob gently. */
  bob: boolean
}
export interface FrameItem extends Base {
  slot: 'frame'
  style: FrameStyle
  palette: string[]
}
export interface EffectItem extends Base {
  slot: 'effect'
  style: EffectStyle
  palette: string[]
  maxParticles: number
}
export interface WearItem extends Base {
  slot: 'headwear' | 'eyewear' | 'top' | 'bottom'
  /** The name the account lists this under when it already owns it. */
  ownedAs: string
  patch: Partial<Appearance>
}
export type ShopItem = TitleItem | BackgroundItem | PetItem | FrameItem | EffectItem | WearItem

// ---- art pipeline -----------------------------------------------------------------------
const art = import.meta.glob('../assets/shop/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const artUrl = (asset: string) => art[`../assets/${asset.replace(/^assets\//, 'shop/')}`]

// ---- the new 35 -------------------------------------------------------------------------
interface Raw {
  id: string
  name: string
  slot: string
  price: number
  rarity: string
  description: string
  render: Record<string, any>
}

function fromRaw(r: Raw): ShopItem {
  const base = { id: r.id, name: r.name, price: r.price, rarity: r.rarity as Rarity, description: r.description }
  const x = r.render
  switch (r.slot) {
    case 'title':
      return { ...base, slot: 'title', text: x.text, fg: x.foreground, bg: x.background, icon: x.pixel_icon }
    case 'background':
      return { ...base, slot: 'background', src: artUrl(x.asset), objectPosition: x.object_position }
    case 'pet':
      return {
        ...base,
        slot: 'pet',
        src: artUrl(x.asset),
        anchor: { x: x.anchor.x, footY: x.anchor.foot_y },
        maxW: x.max_stage_width,
        maxH: x.max_stage_height,
        bbox: x.alpha_bbox,
        sourceSize: x.source_size,
        bob: x.animation === 'optional_slow_bob',
      }
    case 'frame':
      return { ...base, slot: 'frame', style: x.style, palette: x.palette }
    default:
      return { ...base, slot: 'effect', style: x.style, palette: x.palette, maxParticles: Math.min(8, x.max_particles) }
  }
}

// ---- the originals: ids and prices stay exactly as they were ------------------------------
const rarityByPrice = (p: number): Rarity => (p <= 110 ? 'common' : p <= 200 ? 'uncommon' : 'rare')
const wear = (id: string, name: string, slot: WearItem['slot'], price: number, description: string, patch: Partial<Appearance>): WearItem => ({
  id, name, slot, price, rarity: rarityByPrice(price), description, ownedAs: name, patch,
})

// Extravagant clothing: bought here, then worn from the look editor (and the shop's try-on).
const outfits: ShopItem[] = [
  wear('shop.top.starlight-jacket', 'Starlight Jacket', 'top', 130, 'A night-sky jacket with gold trim and stars that twinkle.', { top: 'starlight', ...premiumDefaults.starlight }),
  wear('shop.top.royal-velvet-coat', 'Royal Velvet Coat', 'top', 190, 'A long velvet coat with gold edging, an ermine collar and a jewel brooch.', { top: 'royalcoat', ...premiumDefaults.royalcoat }),
  wear('shop.top.dragonscale-mail', 'Dragonscale Mail', 'top', 240, 'Scaled armor with gold pauldrons and a glowing gem.', { top: 'dragonmail', ...premiumDefaults.dragonmail }),
  wear('shop.top.aurora-gala-coat', 'Aurora Gala Coat', 'top', 320, 'A tailcoat with gold epaulettes that shimmers like the northern lights.', { top: 'galacoat', ...premiumDefaults.galacoat }),
  wear('shop.bottom.gilded-slacks', 'Gilded Slacks', 'bottom', 110, 'Slacks with a gold belt, side stripes and cuffs.', { bottom: 'gilded', ...premiumDefaults.gilded }),
  wear('shop.bottom.starfall-leggings', 'Starfall Leggings', 'bottom', 140, 'Dark leggings scattered with falling stars.', { bottom: 'starfall', ...premiumDefaults.starfall }),
  wear('shop.bottom.emerald-sequin-pants', 'Emerald Sequin Pants', 'bottom', 170, 'Pants covered in glittering sequins that catch the light.', { bottom: 'sequin', ...premiumDefaults.sequin }),
  wear('shop.bottom.royal-trousers', 'Royal Trousers', 'bottom', 200, 'Pinstriped trousers with a jeweled gold belt.', { bottom: 'royalpants', ...premiumDefaults.royalpants }),
].map((i): ShopItem => ({ ...i, rarity: i.price >= 300 ? 'legendary' : i.price >= 180 ? 'epic' : 'rare' }))

const legacy: ShopItem[] = [
  wear('teal-cap', 'Teal Cap', 'headwear', 160, 'A cheerful teal baseball cap.', { hat: 'cap', hatColor: 'teal' }),
  wear('mustard-beanie', 'Mustard Beanie', 'headwear', 120, 'A warm mustard knit beanie.', { hat: 'beanie', hatColor: 'mustard' }),
  wear('plum-beanie', 'Plum Beanie', 'headwear', 120, 'A cozy plum knit beanie.', { hat: 'beanie', hatColor: 'plum' }),
  wear('crimson-cap', 'Crimson Cap', 'headwear', 160, 'A bold crimson baseball cap.', { hat: 'cap', hatColor: 'crimson' }),
  wear('gold-band', 'Gold Headband', 'headwear', 140, 'A bright gold headband.', { hat: 'headband', hatColor: 'mustard' }),
  wear('round-glasses', 'Round Glasses', 'eyewear', 100, 'Classic round frames.', { glasses: 'round' }),
  wear('square-frames', 'Square Frames', 'eyewear', 110, 'Sharp square frames.', { glasses: 'square' }),
  wear('shades', 'Sunshades', 'eyewear', 180, 'Dark sunshades for sunny days.', { glasses: 'shades' }),
]

export const shopItems: ShopItem[] = [...legacy, ...outfits, ...(newCatalogRaw as unknown as Raw[]).map(fromRaw)]
export const itemsById: Record<string, ShopItem> = Object.fromEntries(shopItems.map((i) => [i.id, i]))
export const getItem = (id: string | null | undefined): ShopItem | undefined => (id ? itemsById[id] : undefined)

export const categoryOrder: Category[] = ['featured', 'background', 'pet', 'title', 'frame', 'effect', 'top', 'bottom', 'headwear', 'eyewear']
export const featured: ShopItem[] = featuredIds.map((id) => itemsById[id]).filter(Boolean)

export const itemsInSlot = (slot: Slot) => shopItems.filter((i) => i.slot === slot).sort((a, b) => a.price - b.price)

/** Items whose renderer or art is ready. Nothing blank is ever sold. */
export function hasRenderer(item: ShopItem): boolean {
  switch (item.slot) {
    case 'background':
    case 'pet':
      return Boolean(item.src)
    case 'title':
      return item.text.length > 0
    case 'frame':
      return ['stepped_corners', 'pixel_filigree', 'pixel_leaves', 'stepped_waves', 'pixel_laurel', 'corner_crowns'].includes(item.style)
    case 'effect':
      return ['slow_fireflies', 'pixel_coin_sparkles', 'soft_pixel_halo', 'orbiting_pixel_stars', 'restrained_royal_glow'].includes(item.style)
    case 'top':
      return item.patch.top !== undefined && tops.some((t) => t.id === item.patch.top)
    case 'bottom':
      return item.patch.bottom !== undefined && bottoms.some((b) => b.id === item.patch.bottom)
    default:
      return true
  }
}

/** The image an item needs before it can be sold, if any. */
export const assetOf = (item: ShopItem): string | null => (item.slot === 'background' || item.slot === 'pet' ? item.src : null)

/** Legacy items are owned by name on the account. */
export const legacyOwnedName = (item: ShopItem): string | null => (item.slot === 'headwear' || item.slot === 'eyewear' ? item.ownedAs : null)

/** The label every shop debit carries, so it is never mistaken for a learning reward. */
export const PURCHASE_REASON = 'Cosmetic purchase'
