import type { LifeId } from '../types/game'
import type { Ramp } from './color'

// Everything a character can look like. Ids are stable: they are what gets saved.

export const skinTones: { id: string; name: string; ramp: Ramp }[] = [
  { id: 'porcelain', name: 'Porcelain', ramp: ['#ffeadb', '#f8d5bc', '#e3ad8f', '#b97e66'] },
  { id: 'fair', name: 'Fair', ramp: ['#fde0c2', '#f4c7a0', '#dc9f77', '#b07352'] },
  { id: 'beige', name: 'Beige', ramp: ['#f5cfa6', '#e6b285', '#c88d5f', '#9c6645'] },
  { id: 'tan', name: 'Tan', ramp: ['#ebbc8e', '#d59d6b', '#b27b4d', '#865636'] },
  { id: 'olive', name: 'Olive', ramp: ['#dca874', '#c28856', '#9e683b', '#744828'] },
  { id: 'brown', name: 'Brown', ramp: ['#b98256', '#9c653c', '#7c4b29', '#58331c'] },
  { id: 'deep', name: 'Deep', ramp: ['#94603e', '#77482c', '#5a341e', '#3e2314'] },
  { id: 'ebony', name: 'Ebony', ramp: ['#734a31', '#5a3822', '#432817', '#2c190e'] },
]

export const hairColors: { id: string; name: string; ramp: Ramp }[] = [
  { id: 'black', name: 'Black', ramp: ['#4a4152', '#2c2530', '#1c171f', '#110d13'] },
  { id: 'espresso', name: 'Espresso', ramp: ['#6e4a35', '#4b3022', '#331f16', '#21130d'] },
  { id: 'chestnut', name: 'Chestnut', ramp: ['#a66b42', '#7e4b2b', '#5c331d', '#3e2113'] },
  { id: 'auburn', name: 'Auburn', ramp: ['#c76a3a', '#9c4527', '#73301c', '#4d1f13'] },
  { id: 'ginger', name: 'Ginger', ramp: ['#f2a25a', '#db7a35', '#b05a25', '#7f3d19'] },
  { id: 'honey', name: 'Honey', ramp: ['#f6d58c', '#e0b25e', '#b98a3f', '#8a6129'] },
  { id: 'platinum', name: 'Platinum', ramp: ['#fbf3df', '#e6d9bb', '#c2b393', '#968869'] },
  { id: 'silver', name: 'Silver', ramp: ['#e2e4ea', '#b8bcc8', '#8b8fa0', '#626678'] },
  { id: 'ocean', name: 'Ocean', ramp: ['#7fc4e8', '#4a8fc4', '#335f9a', '#233d6e'] },
  { id: 'berry', name: 'Berry', ramp: ['#f19ac0', '#cf628f', '#a03f6b', '#6f294b'] },
]

export const eyeColors: { id: string; name: string; ramp: Ramp }[] = [
  { id: 'umber', name: 'Umber', ramp: ['#8a5a3a', '#5a3622', '#3a2216', '#21130b'] },
  { id: 'hazel', name: 'Hazel', ramp: ['#a8904a', '#7a6430', '#54431f', '#332812'] },
  { id: 'green', name: 'Green', ramp: ['#7dbf6a', '#4a8a46', '#2f6233', '#1d3f21'] },
  { id: 'blue', name: 'Blue', ramp: ['#7fbde8', '#3f7fbf', '#2b5590', '#1b3561'] },
  { id: 'gray', name: 'Gray', ramp: ['#b4bcc6', '#7f8894', '#58606c', '#383e48'] },
  { id: 'onyx', name: 'Onyx', ramp: ['#4a4152', '#2a2230', '#1a1520', '#100c14'] },
]

/** Clothing dyes. Ramps are generated from the base so every item shades the same way. */
export const dyes: { id: string; name: string; base: string }[] = [
  { id: 'cream', name: 'Cream', base: '#efe3c6' },
  { id: 'charcoal', name: 'Charcoal', base: '#474552' },
  { id: 'navy', name: 'Navy', base: '#2e3f6b' },
  { id: 'denim', name: 'Denim', base: '#4b6ea8' },
  { id: 'sky', name: 'Sky', base: '#7cc0e0' },
  { id: 'teal', name: 'Teal', base: '#2f8a86' },
  { id: 'sage', name: 'Sage', base: '#7c9f7e' },
  { id: 'forest', name: 'Forest', base: '#3f6b48' },
  { id: 'mustard', name: 'Mustard', base: '#e0b040' },
  { id: 'terracotta', name: 'Terracotta', base: '#d0673f' },
  { id: 'crimson', name: 'Crimson', base: '#b8363a' },
  { id: 'plum', name: 'Plum', base: '#7a4a86' },
  { id: 'rose', name: 'Rose', base: '#e08a9a' },
  { id: 'khaki', name: 'Khaki', base: '#bfa27a' },
  { id: 'cocoa', name: 'Cocoa', base: '#6e4a34' },
  { id: 'white', name: 'White', base: '#f4f2ee' },
]

export const hairStyles = [
  { id: 'crop', name: 'Crop' },
  { id: 'sidepart', name: 'Side Part' },
  { id: 'buzz', name: 'Buzz' },
  { id: 'messy', name: 'Messy' },
  { id: 'curls', name: 'Curls' },
  { id: 'afro', name: 'Afro' },
  { id: 'bob', name: 'Bob' },
  { id: 'long', name: 'Long' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'bun', name: 'Top Bun' },
  { id: 'braids', name: 'Braids' },
  { id: 'locs', name: 'Locs' },
] as const

export const eyeShapes = [
  { id: 'round', name: 'Round' },
  { id: 'wide', name: 'Bright' },
  { id: 'sleepy', name: 'Calm' },
  { id: 'happy', name: 'Joyful' },
] as const

export const faceDetails = [
  { id: 'none', name: 'None' },
  { id: 'blush', name: 'Blush' },
  { id: 'freckles', name: 'Freckles' },
  { id: 'mole', name: 'Beauty mark' },
] as const

export const tops = [
  { id: 'tee', name: 'T-shirt', kind: 'Shirts' },
  { id: 'shirt', name: 'Button-up', kind: 'Shirts' },
  { id: 'hoodie', name: 'Hoodie', kind: 'Hoodies' },
  { id: 'sweater', name: 'Sweater', kind: 'Sweaters' },
  { id: 'jacket', name: 'Jacket', kind: 'Jackets' },
  { id: 'blazer', name: 'Blazer', kind: 'Jackets' },
  { id: 'jersey', name: 'Jersey', kind: 'Shirts' },
  // Shop exclusives: they only appear in the creator once bought (see premiumClothing).
  { id: 'starlight', name: 'Starlight Jacket', kind: 'Jackets' },
  { id: 'royalcoat', name: 'Royal Velvet Coat', kind: 'Jackets' },
  { id: 'dragonmail', name: 'Dragonscale Mail', kind: 'Armor' },
  { id: 'galacoat', name: 'Aurora Gala Coat', kind: 'Jackets' },
] as const

export const bottoms = [
  { id: 'jeans', name: 'Jeans' },
  { id: 'slacks', name: 'Slacks' },
  { id: 'joggers', name: 'Joggers' },
  { id: 'shorts', name: 'Shorts' },
  { id: 'athletic', name: 'Gym Shorts' },
  { id: 'skirt', name: 'Skirt' },
  { id: 'gilded', name: 'Gilded Slacks' },
  { id: 'starfall', name: 'Starfall Leggings' },
  { id: 'royalpants', name: 'Royal Trousers' },
  { id: 'sequin', name: 'Emerald Sequin Pants' },
] as const

export const shoes = [
  { id: 'sneakers', name: 'Sneakers' },
  { id: 'hightops', name: 'High-tops' },
  { id: 'boots', name: 'Boots' },
  { id: 'loafers', name: 'Loafers' },
] as const

export const hats = [
  { id: 'none', name: 'None' },
  { id: 'beanie', name: 'Beanie' },
  { id: 'cap', name: 'Cap' },
  { id: 'headband', name: 'Headband' },
] as const

export const glasses = [
  { id: 'none', name: 'None' },
  { id: 'round', name: 'Round' },
  { id: 'square', name: 'Square' },
  { id: 'shades', name: 'Shades' },
] as const

export const packs = [
  { id: 'none', name: 'None' },
  { id: 'backpack', name: 'Backpack' },
] as const

export const watches = [
  { id: 'none', name: 'None' },
  { id: 'watch', name: 'Watch' },
] as const

/** Clothing that must be bought in the shop: appearance id -> shop item id. Everything else is free. */
export const premiumClothing: Record<string, string> = {
  starlight: 'shop.top.starlight-jacket',
  royalcoat: 'shop.top.royal-velvet-coat',
  dragonmail: 'shop.top.dragonscale-mail',
  galacoat: 'shop.top.aurora-gala-coat',
  gilded: 'shop.bottom.gilded-slacks',
  starfall: 'shop.bottom.starfall-leggings',
  royalpants: 'shop.bottom.royal-trousers',
  sequin: 'shop.bottom.emerald-sequin-pants',
}

/** The colors each shop-only piece is designed in. Wearing one sets them; the editor can recolor after. */
export const premiumDefaults: Record<string, Partial<Appearance>> = {
  starlight: { topColor: 'navy', topAccent: 'cream' },
  royalcoat: { topColor: 'plum', topAccent: 'cream' },
  dragonmail: { topColor: 'forest', topAccent: 'crimson' },
  galacoat: { topColor: 'charcoal', topAccent: 'white' },
  gilded: { bottomColor: 'charcoal' },
  starfall: { bottomColor: 'navy' },
  royalpants: { bottomColor: 'plum' },
  sequin: { bottomColor: 'forest' },
}

/**
 * Put back any shop-only clothing the player does not own (a stale save, or a look copied from
 * elsewhere), so nothing can be worn before it is bought. Free clothing is never touched.
 */
export function guardClothing(a: Appearance, owned: ReadonlySet<string>, fallback: Appearance): Appearance {
  const locked = (id: string) => id in premiumClothing && !owned.has(premiumClothing[id])
  const free = (list: readonly { id: string }[], want: string) => (list.some((i) => i.id === want && !(i.id in premiumClothing)) ? want : undefined)
  const top = locked(a.top) ? (free(tops, fallback.top) ?? 'tee') : a.top
  const bottom = locked(a.bottom) ? (free(bottoms, fallback.bottom) ?? 'jeans') : a.bottom
  return top === a.top && bottom === a.bottom ? a : { ...a, top: top as Appearance['top'], bottom: bottom as Appearance['bottom'] }
}

type Id<T extends readonly { id: string }[]> = T[number]['id']

export interface Appearance {
  skin: string
  eyes: Id<typeof eyeShapes>
  eyeColor: string
  detail: Id<typeof faceDetails>
  hair: Id<typeof hairStyles>
  hairColor: string
  top: Id<typeof tops>
  topColor: string
  /** Trim, inner shirt, or jersey number. */
  topAccent: string
  bottom: Id<typeof bottoms>
  bottomColor: string
  shoes: Id<typeof shoes>
  shoeColor: string
  hat: Id<typeof hats>
  hatColor: string
  glasses: Id<typeof glasses>
  pack: Id<typeof packs>
  packColor: string
  watch: Id<typeof watches>
}

/** Each life's starting look. Suggestions only: every option stays open to every life. */
export const lifePresets: Record<LifeId, Appearance> = {
  freshman: {
    skin: 'deep', eyes: 'round', eyeColor: 'umber', detail: 'freckles',
    hair: 'messy', hairColor: 'chestnut',
    top: 'hoodie', topColor: 'terracotta', topAccent: 'cream',
    bottom: 'jeans', bottomColor: 'denim', shoes: 'sneakers', shoeColor: 'white',
    hat: 'none', hatColor: 'mustard', glasses: 'none', pack: 'backpack', packColor: 'teal', watch: 'none',
  },
  professional: {
    skin: 'tan', eyes: 'sleepy', eyeColor: 'hazel', detail: 'blush',
    hair: 'bob', hairColor: 'espresso',
    top: 'sweater', topColor: 'rose', topAccent: 'cream',
    bottom: 'slacks', bottomColor: 'khaki', shoes: 'loafers', shoeColor: 'cocoa',
    hat: 'none', hatColor: 'sage', glasses: 'none', pack: 'none', packColor: 'sage', watch: 'watch',
  },
  entrepreneur: {
    skin: 'olive', eyes: 'round', eyeColor: 'onyx', detail: 'none',
    hair: 'sidepart', hairColor: 'black',
    top: 'blazer', topColor: 'navy', topAccent: 'white',
    bottom: 'slacks', bottomColor: 'charcoal', shoes: 'loafers', shoeColor: 'cocoa',
    hat: 'none', hatColor: 'navy', glasses: 'square', pack: 'none', packColor: 'charcoal', watch: 'watch',
  },
  athlete: {
    skin: 'beige', eyes: 'wide', eyeColor: 'umber', detail: 'none',
    hair: 'crop', hairColor: 'black',
    top: 'jersey', topColor: 'terracotta', topAccent: 'cream',
    bottom: 'athletic', bottomColor: 'navy', shoes: 'hightops', shoeColor: 'white',
    hat: 'headband', hatColor: 'mustard', glasses: 'none', pack: 'none', packColor: 'navy', watch: 'none',
  },
}

/** The player's own account avatar, separate from every life. */
export const accountPreset: Appearance = {
  skin: 'fair', eyes: 'happy', eyeColor: 'blue', detail: 'blush',
  hair: 'curls', hairColor: 'auburn',
  top: 'jacket', topColor: 'teal', topAccent: 'mustard',
  bottom: 'joggers', bottomColor: 'charcoal', shoes: 'sneakers', shoeColor: 'cream',
  hat: 'cap', hatColor: 'sky', glasses: 'round', pack: 'none', packColor: 'teal', watch: 'none',
}

const pick = <T,>(list: readonly T[], r: () => number) => list[Math.floor(r() * list.length)]

/** A random but wearable look: clothing colors avoid matching each other. */
export function randomAppearance(seed = Date.now()): Appearance {
  let s = seed % 2147483647 || 1
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  const dyeIds = dyes.map((d) => d.id)
  const top = pick(dyeIds, r)
  const bottom = pick(dyeIds.filter((d) => d !== top), r)
  const roll = (chance: number) => r() < chance
  return {
    skin: pick(skinTones, r).id,
    eyes: pick(eyeShapes, r).id,
    eyeColor: pick(eyeColors, r).id,
    detail: pick(faceDetails, r).id,
    hair: pick(hairStyles, r).id,
    hairColor: pick(hairColors, r).id,
    top: pick(tops.filter((t) => !(t.id in premiumClothing)), r).id,
    topColor: top,
    topAccent: pick(dyeIds.filter((d) => d !== top), r),
    bottom: pick(bottoms.filter((b) => !(b.id in premiumClothing)), r).id,
    bottomColor: bottom,
    shoes: pick(shoes, r).id,
    shoeColor: pick(dyeIds, r),
    hat: roll(0.3) ? pick(hats.slice(1), r).id : 'none',
    hatColor: pick(dyeIds, r),
    glasses: roll(0.3) ? pick(glasses.slice(1), r).id : 'none',
    pack: roll(0.25) ? 'backpack' : 'none',
    packColor: pick(dyeIds, r),
    watch: roll(0.3) ? 'watch' : 'none',
  }
}

/** Fill in anything a saved look is missing (new options added after it was saved). */
export function normalizeAppearance(saved: Partial<Appearance> | undefined, fallback: Appearance): Appearance {
  const valid = <K extends keyof Appearance>(key: K, ids: readonly string[]) =>
    saved && typeof saved[key] === 'string' && ids.includes(saved[key] as string) ? (saved[key] as Appearance[K]) : fallback[key]
  const dyeIds = dyes.map((d) => d.id)
  return {
    skin: valid('skin', skinTones.map((t) => t.id)),
    eyes: valid('eyes', eyeShapes.map((t) => t.id)),
    eyeColor: valid('eyeColor', eyeColors.map((t) => t.id)),
    detail: valid('detail', faceDetails.map((t) => t.id)),
    hair: valid('hair', hairStyles.map((t) => t.id)),
    hairColor: valid('hairColor', hairColors.map((t) => t.id)),
    top: valid('top', tops.map((t) => t.id)),
    topColor: valid('topColor', dyeIds),
    topAccent: valid('topAccent', dyeIds),
    bottom: valid('bottom', bottoms.map((t) => t.id)),
    bottomColor: valid('bottomColor', dyeIds),
    shoes: valid('shoes', shoes.map((t) => t.id)),
    shoeColor: valid('shoeColor', dyeIds),
    hat: valid('hat', hats.map((t) => t.id)),
    hatColor: valid('hatColor', dyeIds),
    glasses: valid('glasses', glasses.map((t) => t.id)),
    pack: valid('pack', packs.map((t) => t.id)),
    packColor: valid('packColor', dyeIds),
    watch: valid('watch', watches.map((t) => t.id)),
  }
}
