import type { Appearance } from './catalog'

// The Capiture character, drawn pixel by pixel on a 32×48 grid (one sprite pixel =
// one world pixel, so characters and scenes share a density). Light comes from
// the top-left: right edges and undersides take the shade tone.
//
// Layout (x 0–31, y 0–47):
//   hair 0–12 · head 6–21 (x 7–24) · neck 22–23 · torso 24–34 (x 10–21)
//   arms 24–35 (x 7–9, 22–24) · hips 35–36 · legs 37–43 · feet 44–46

export const SPRITE_W = 32
export const SPRITE_H = 48

/** 0 light · 1 base · 2 shade · 3 deep */
export type Tone = 0 | 1 | 2 | 3

export type Material =
  | 'skin' | 'hair' | 'brow' | 'eyeW' | 'eye' | 'mouth' | 'blush'
  | 'top' | 'accent' | 'bottom' | 'shoe' | 'sole' | 'hat' | 'pack' | 'watch' | 'frame' | 'lens' | 'gold' | 'spark'

export interface Cell {
  m: Material
  t: Tone
}

export class Pix {
  cells: (Cell | null)[] = new Array(SPRITE_W * SPRITE_H).fill(null)

  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return null
    return this.cells[y * SPRITE_W + x]
  }
  set(x: number, y: number, m: Material, t: Tone = 1) {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return
    this.cells[y * SPRITE_W + x] = { m, t }
  }
  erase(x: number, y: number) {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return
    this.cells[y * SPRITE_W + x] = null
  }
  span(y: number, x0: number, x1: number, m: Material, t: Tone = 1) {
    for (let x = x0; x <= x1; x++) this.set(x, y, m, t)
  }
  /** Paint rows from a table of `y: [x0, x1][]` spans. */
  rows(table: Record<number, [number, number][]>, m: Material, t: Tone = 1) {
    for (const [y, spans] of Object.entries(table)) for (const [a, b] of spans) this.span(Number(y), a, b, m, t)
  }
  /** Retone a pixel only if it is already this material. */
  tone(x: number, y: number, m: Material, t: Tone) {
    const c = this.get(x, y)
    if (c && c.m === m) c.t = t
  }
  is(x: number, y: number, m: Material) {
    return this.get(x, y)?.m === m
  }
  each(fn: (x: number, y: number, c: Cell) => void) {
    for (let y = 0; y < SPRITE_H; y++) for (let x = 0; x < SPRITE_W; x++) {
      const c = this.cells[y * SPRITE_W + x]
      if (c) fn(x, y, c)
    }
  }
}

/** Shade the right and bottom edges of a material, and rim-light its top-left. */
function autoShade(p: Pix, m: Material, { rim = true }: { rim?: boolean } = {}) {
  const marks: [number, number, Tone][] = []
  p.each((x, y, c) => {
    if (c.m !== m || c.t !== 1) return
    if (!p.is(x + 1, y, m) || !p.is(x, y + 1, m)) marks.push([x, y, 2])
    else if (rim && !p.is(x, y - 1, m) && x < 17) marks.push([x, y, 0])
  })
  for (const [x, y, t] of marks) p.tone(x, y, m, t)
}

// ─── body ─────────────────────────────────────────────────────────────────

const HEAD: Record<number, [number, number][]> = {
  6: [[10, 21]], 7: [[8, 23]], 8: [[7, 24]], 9: [[7, 24]], 10: [[7, 24]], 11: [[7, 24]], 12: [[7, 24]],
  13: [[6, 25]], 14: [[6, 25]], 15: [[6, 25]], 16: [[7, 24]], 17: [[7, 24]], 18: [[7, 24]],
  19: [[8, 23]], 20: [[9, 22]], 21: [[11, 20]],
}

function body(p: Pix) {
  p.rows(HEAD, 'skin')
  for (let y = 6; y <= 21; y++) {
    // right side of the face and the jaw sit in shade
    let x = SPRITE_W - 1
    while (x > 0 && !p.is(x, y, 'skin')) x--
    p.tone(x, y, 'skin', 2)
  }
  p.span(21, 11, 20, 'skin', 2)
  p.tone(6, 15, 'skin', 2)
  p.tone(25, 13, 'skin', 2)
  p.tone(25, 14, 'skin', 2)
  p.tone(25, 15, 'skin', 2)
  // neck, in the chin's shadow
  p.span(22, 14, 17, 'skin', 2)
  p.span(23, 14, 17, 'skin', 2)
  // shoulders, torso, arms and hands
  p.span(24, 10, 21, 'skin')
  for (let y = 25; y <= 34; y++) p.span(y, 10, 21, 'skin')
  p.span(24, 8, 9, 'skin')
  p.span(24, 22, 23, 'skin')
  for (let y = 25; y <= 35; y++) {
    p.span(y, 7, 9, 'skin')
    p.span(y, 22, 24, 'skin')
    p.tone(9, y, 'skin', 2)
    p.tone(24, y, 'skin', 2)
  }
  // hips, legs, feet
  p.span(35, 11, 20, 'skin')
  p.span(36, 11, 20, 'skin')
  for (let y = 37; y <= 46; y++) {
    p.span(y, 11, 14, 'skin')
    p.span(y, 17, 20, 'skin')
    p.tone(14, y, 'skin', 2)
    p.tone(20, y, 'skin', 2)
  }
}

// ─── face ─────────────────────────────────────────────────────────────────

type EyeShape = Appearance['eyes'] | 'blink'

function eye(p: Pix, x: number, shape: EyeShape) {
  // x is the eye's left column; both eyes catch the glint on their upper-left.
  switch (shape) {
    case 'round':
      p.span(13, x, x + 1, 'eye', 3)
      p.set(x, 14, 'eyeW', 1)
      p.set(x + 1, 14, 'eye', 1)
      p.span(15, x, x + 1, 'eye', 2)
      break
    case 'wide':
      p.span(12, x, x + 1, 'eye', 3)
      p.set(x, 13, 'eyeW', 1)
      p.set(x + 1, 13, 'eye', 1)
      p.set(x, 14, 'eye', 1)
      p.set(x + 1, 14, 'eye', 2)
      p.span(15, x, x + 1, 'eye', 2)
      break
    case 'sleepy':
      p.span(14, x, x + 1, 'eye', 3)
      p.set(x, 15, 'eye', 1)
      p.set(x + 1, 15, 'eye', 2)
      break
    case 'happy':
      p.span(13, x, x + 1, 'eye', 3)
      p.set(x - 1, 14, 'eye', 3)
      p.set(x + 2, 14, 'eye', 3)
      break
    case 'blink':
      p.span(15, x, x + 1, 'eye', 3)
      break
  }
}

function face(p: Pix, a: Appearance, blink: boolean) {
  const shape: EyeShape = blink && a.eyes !== 'happy' ? 'blink' : a.eyes
  eye(p, 11, shape)
  eye(p, 19, shape)
  // brows
  const browY = a.eyes === 'wide' ? 10 : 11
  p.span(browY, 11, 12, 'brow', 1)
  p.span(browY, 19, 20, 'brow', 1)
  // nose and a small smile
  p.tone(16, 16, 'skin', 2)
  p.set(14, 17, 'mouth', 2)
  p.span(18, 15, 16, 'mouth', 1)
  p.set(17, 17, 'mouth', 2)
  if (a.detail === 'blush') {
    p.span(16, 9, 10, 'blush')
    p.span(16, 21, 22, 'blush')
  } else if (a.detail === 'freckles') {
    for (const [x, y] of [[9, 16], [11, 17], [10, 18], [20, 17], [22, 16], [21, 18]]) p.tone(x, y, 'skin', 2)
  } else if (a.detail === 'mole') {
    p.tone(21, 18, 'skin', 3)
  }
}

// ─── hair ─────────────────────────────────────────────────────────────────

const CAP: Record<number, [number, number][]> = {
  3: [[11, 20]], 4: [[9, 22]], 5: [[8, 23]], 6: [[7, 24]], 7: [[7, 24]],
}

interface HairStyle {
  front: Record<number, [number, number][]>
  back?: Record<number, [number, number][]>
  /** In-front strands that fall over the shoulders, drawn after the top. */
  drape?: Record<number, [number, number][]>
  shine?: [number, number][]
  strands?: [number, number][]
  texture?: (x: number, y: number) => Tone | null
}

const curlTexture = (x: number, y: number): Tone | null => ((x + y * 2) % 5 === 0 ? 0 : (x * 3 + y) % 7 === 0 ? 2 : null)

const STYLES: Record<Appearance['hair'], HairStyle> = {
  crop: {
    front: { ...CAP, 8: [[7, 24]], 9: [[7, 10], [14, 24]], 10: [[7, 8], [22, 24]], 11: [[7, 7], [24, 24]], 12: [[24, 24]] },
    shine: [[11, 4], [12, 4], [13, 4], [10, 5], [11, 5]],
    strands: [[13, 8], [18, 7], [20, 9]],
  },
  sidepart: {
    front: {
      2: [[12, 19]], 3: [[10, 21]], 4: [[8, 23]], 5: [[7, 24]], 6: [[6, 25]], 7: [[6, 25]], 8: [[6, 25]],
      9: [[6, 15], [22, 25]], 10: [[6, 11], [23, 25]], 11: [[6, 8], [24, 24]], 12: [[7, 7], [24, 24]],
    },
    shine: [[11, 3], [12, 3], [9, 4], [10, 4], [8, 5]],
    strands: [[18, 3], [18, 4], [18, 5], [12, 8], [15, 9], [9, 9]],
  },
  buzz: {
    front: { 5: [[10, 21]], 6: [[8, 23]], 7: [[7, 24]], 8: [[7, 24]], 9: [[7, 8], [23, 24]], 10: [[7, 7], [24, 24]], 11: [[24, 24]] },
    texture: (x, y) => ((x + y) % 3 === 0 ? 1 : 2),
  },
  messy: {
    front: {
      1: [[13, 13], [18, 18]], 2: [[10, 14], [17, 20]], 3: [[8, 23]], 4: [[7, 24]], 5: [[7, 24]], 6: [[6, 25]], 7: [[6, 25]],
      8: [[6, 25]], 9: [[6, 9], [11, 13], [16, 18], [21, 25]], 10: [[6, 8], [12, 12], [17, 17], [23, 25]], 11: [[7, 7], [24, 24]],
    },
    shine: [[10, 3], [11, 3], [9, 4], [10, 4], [8, 5]],
    strands: [[15, 4], [15, 5], [20, 5], [12, 7], [17, 8], [22, 7]],
  },
  curls: {
    front: {
      1: [[12, 19]], 2: [[9, 22]], 3: [[7, 24]], 4: [[6, 25]], 5: [[5, 26]], 6: [[5, 26]], 7: [[5, 26]], 8: [[5, 26]],
      9: [[5, 26]], 10: [[5, 9], [11, 14], [17, 20], [22, 26]], 11: [[5, 8], [23, 26]], 12: [[5, 7], [24, 26]],
      13: [[5, 6], [25, 26]], 14: [[5, 6], [25, 26]], 15: [[6, 6], [25, 25]],
    },
    texture: curlTexture,
  },
  afro: {
    front: {
      0: [[11, 20]], 1: [[8, 23]], 2: [[6, 25]], 3: [[5, 26]], 4: [[4, 27]], 5: [[4, 27]], 6: [[4, 27]], 7: [[4, 27]],
      8: [[4, 27]], 9: [[4, 8], [23, 27]], 10: [[4, 6], [25, 27]], 11: [[4, 6], [25, 27]], 12: [[4, 6], [25, 27]],
      13: [[4, 5], [26, 27]], 14: [[4, 5], [26, 27]], 15: [[5, 5], [26, 26]],
    },
    texture: curlTexture,
  },
  bob: {
    front: {
      3: [[11, 20]], 4: [[9, 22]], 5: [[7, 24]], 6: [[6, 25]], 7: [[6, 25]], 8: [[6, 25]], 9: [[6, 25]], 10: [[6, 25]],
      11: [[6, 8], [23, 25]], 12: [[6, 8], [23, 25]], 13: [[5, 8], [23, 26]], 14: [[5, 8], [23, 26]], 15: [[5, 8], [23, 26]],
      16: [[5, 8], [23, 26]], 17: [[5, 8], [23, 26]], 18: [[5, 8], [23, 26]], 19: [[5, 9], [22, 26]], 20: [[6, 9], [22, 25]],
    },
    shine: [[11, 4], [12, 4], [9, 5], [10, 5], [11, 5], [7, 6], [8, 6]],
    strands: [[11, 10], [15, 10], [20, 10], [7, 15], [24, 15]],
  },
  long: {
    front: {
      3: [[11, 20]], 4: [[9, 22]], 5: [[8, 23]], 6: [[7, 24]], 7: [[6, 25]], 8: [[6, 25]], 9: [[6, 13], [18, 25]],
      10: [[6, 10], [21, 25]], 11: [[6, 9], [22, 25]], 12: [[5, 8], [23, 26]], 13: [[5, 7], [24, 26]], 14: [[5, 7], [24, 26]],
      15: [[5, 7], [24, 26]], 16: [[5, 7], [24, 26]], 17: [[5, 7], [24, 26]], 18: [[5, 7], [24, 26]], 19: [[5, 8], [23, 26]],
      20: [[5, 8], [23, 26]], 21: [[5, 9], [22, 26]],
    },
    back: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [21 + i, [[5, 26]] as [number, number][]])),
    drape: { 22: [[6, 9], [22, 25]], 23: [[6, 9], [22, 25]], 24: [[6, 9], [22, 25]], 25: [[6, 8], [23, 25]], 26: [[6, 8], [23, 25]], 27: [[6, 8], [23, 25]], 28: [[7, 8], [23, 24]] },
    shine: [[11, 4], [12, 4], [13, 4], [9, 5], [10, 5], [8, 6]],
    strands: [[15, 4], [16, 5], [16, 6], [16, 7], [7, 14], [25, 16], [7, 18]],
  },
  ponytail: {
    front: { ...CAP, 8: [[7, 24]], 9: [[7, 9], [22, 24]], 10: [[7, 8], [23, 24]], 11: [[7, 7], [24, 24]] },
    back: {
      4: [[23, 25]], 5: [[23, 27]], 6: [[24, 28]], 7: [[25, 28]], 8: [[26, 28]], 9: [[26, 28]], 10: [[26, 28]],
      11: [[26, 28]], 12: [[26, 28]], 13: [[26, 28]], 14: [[26, 27]], 15: [[26, 27]], 16: [[26, 27]], 17: [[26, 26]],
    },
    shine: [[11, 4], [12, 4], [10, 5]],
    strands: [[14, 5], [17, 6], [20, 7], [27, 9], [27, 12]],
  },
  bun: {
    front: {
      0: [[13, 18]], 1: [[12, 19]], 2: [[12, 19]], 3: [[11, 20]], 4: [[9, 22]], 5: [[8, 23]], 6: [[7, 24]], 7: [[7, 24]],
      8: [[7, 9], [22, 24]], 9: [[7, 8], [23, 24]], 10: [[7, 7], [24, 24]],
    },
    shine: [[13, 0], [14, 0], [13, 1], [10, 4], [11, 4], [9, 5]],
    strands: [[12, 3], [19, 3], [15, 5], [19, 6]],
  },
  braids: {
    front: { ...CAP, 8: [[7, 24]], 9: [[6, 9], [22, 25]], 10: [[5, 8], [23, 26]], 11: [[5, 7], [24, 26]] },
    back: Object.fromEntries(Array.from({ length: 26 }, (_, i) => [11 + i, [[4, 7], [24, 27]] as [number, number][]])),
    drape: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [12 + i, [[5, 7], [24, 26]] as [number, number][]])),
    texture: (x, y) => ((x + y) % 2 === 0 ? 2 : null),
    shine: [[11, 4], [12, 4], [10, 5]],
    strands: [[13, 5], [15, 5], [17, 5], [19, 5], [11, 7], [14, 7], [17, 7], [20, 7]],
  },
  locs: {
    front: { ...CAP, 8: [[7, 24]], 9: [[6, 9], [22, 25]], 10: [[5, 8], [23, 26]], 11: [[5, 8], [23, 26]] },
    back: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [10 + i, [[4, 27]] as [number, number][]])),
    drape: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [12 + i, [[5, 8], [23, 26]] as [number, number][]])),
    texture: (x) => (x % 2 === 0 ? 2 : null),
    shine: [[11, 4], [12, 4], [10, 5]],
    strands: [[12, 4], [15, 4], [18, 4], [21, 5], [10, 6], [13, 6], [16, 6], [19, 6], [22, 7]],
  },
}

function hairLayer(p: Pix, rowsTable: Record<number, [number, number][]> | undefined, style: HairStyle) {
  if (!rowsTable) return
  p.rows(rowsTable, 'hair')
  if (style.texture) {
    for (const [y, spans] of Object.entries(rowsTable)) for (const [a, b] of spans) for (let x = a; x <= b; x++) {
      const t = style.texture(x, Number(y))
      if (t !== null) p.tone(x, Number(y), 'hair', t)
    }
  }
}

function hairFinish(p: Pix, style: HairStyle) {
  autoShade(p, 'hair', { rim: !style.texture })
  for (const [x, y] of style.shine ?? []) p.tone(x, y, 'hair', 0)
  for (const [x, y] of style.strands ?? []) p.tone(x, y, 'hair', 2)
}

/** Skin directly under hair or a hat brim sits in its shadow. */
function castShadows(p: Pix) {
  const marks: [number, number][] = []
  p.each((x, y, c) => {
    if (c.m !== 'skin') return
    const above = p.get(x, y - 1)
    if (above && (above.m === 'hair' || above.m === 'hat') && y < 22) marks.push([x, y])
  })
  for (const [x, y] of marks) p.tone(x, y, 'skin', 2)
}

// ─── clothing ─────────────────────────────────────────────────────────────

function torso(p: Pix, m: Material = 'top') {
  for (let y = 24; y <= 34; y++) p.span(y, 10, 21, m)
}

function sleeves(p: Pix, end: number) {
  p.span(24, 8, 9, 'top')
  p.span(24, 22, 23, 'top')
  for (let y = 25; y <= end; y++) {
    p.span(y, 7, 9, 'top')
    p.span(y, 22, 24, 'top')
  }
}

/** Shared top shading: lit left shoulder, shaded right side, inner arm seams, hem. */
function shadeTop(p: Pix, sleeveEnd: number) {
  for (let y = 25; y <= 34; y++) {
    p.tone(21, y, 'top', 2)
    if (y >= 31) p.tone(20, y, 'top', 2)
  }
  p.span(34, 10, 21, 'top', 2)
  for (let y = 25; y <= sleeveEnd; y++) {
    p.tone(9, y, 'top', 2)
    p.tone(22, y, 'top', 2)
    p.tone(24, y, 'top', 2)
    if (y < 29) p.tone(7, y, 'top', 0)
  }
  p.tone(11, 25, 'top', 0)
  p.tone(12, 25, 'top', 0)
  p.tone(10, 25, 'top', 0)
}


// ─── shop-exclusive clothing ──────────────────────────────────────────────
// These use two fixed materials besides the dyes: 'gold' trim and 'spark' glints. Glints sit on
// one of two phases, so the idle and bob frames twinkle against each other (and hold still when
// motion is reduced, because the idle frame is what shows).

type Glint = [x: number, y: number, phase: 0 | 1]

function twinkle(p: Pix, bob: boolean, pts: Glint[]) {
  for (const [x, y, ph] of pts) if (ph === (bob ? 1 : 0)) p.set(x, y, 'spark', 0)
}

/** A four-point star: bright center, softer arms. */
function star(p: Pix, bob: boolean, x: number, y: number, phase: 0 | 1) {
  if (phase !== (bob ? 1 : 0)) return
  p.set(x, y, 'spark', 0)
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.set(x + dx, y + dy, 'spark', 1)
}

function premiumTop(p: Pix, a: Appearance, bob: boolean) {
  switch (a.top) {
    case 'starlight': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      for (let y = 24; y <= 34; y++) {
        p.set(15, y, 'gold', 1)
        p.set(16, y, 'gold', 2)
      }
      for (const x of [12, 13, 18, 19]) p.set(x, 24, 'gold', x < 16 ? 0 : 2)
      p.span(33, 7, 9, 'gold', 1)
      p.span(33, 22, 24, 'gold', 2)
      p.span(34, 10, 21, 'gold', 2)
      for (let x = 10; x <= 21; x++) if (x !== 15 && x !== 16) p.tone(x, 32, 'top', 2)
      for (const [x, y] of [[11, 29], [13, 31], [18, 28], [20, 32], [8, 30], [23, 27]]) p.tone(x, y, 'top', 0)
      star(p, bob, 12, 27, 0)
      star(p, bob, 19, 30, 1)
      star(p, bob, 12, 32, 1)
      star(p, bob, 19, 26, 0)
      twinkle(p, bob, [[8, 27, 1], [23, 30, 0], [8, 31, 0], [23, 26, 1]])
      break
    }
    case 'royalcoat': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      // coat skirt over the hips, split at the back-center
      for (let y = 35; y <= 38; y++) {
        p.span(y, 10, 21, 'top', y === 38 ? 3 : 1)
        for (let x = 17; x <= 21; x++) p.tone(x, y, 'top', 2)
      }
      for (const y of [37, 38]) {
        p.erase(15, y)
        p.erase(16, y)
      }
      // open front shows the inner layer
      for (let y = 25; y <= 34; y++) p.span(y, 15, 16, 'accent', y > 31 ? 2 : 1)
      p.span(24, 14, 17, 'skin', 2)
      // gold edging down both fronts, collar, cuffs and hem
      for (let y = 25; y <= 36; y++) {
        p.set(14, y, 'gold', 1)
        p.set(17, y, 'gold', 2)
      }
      p.span(38, 10, 14, 'gold', 2)
      p.span(38, 17, 21, 'gold', 3)
      p.span(33, 7, 9, 'gold', 1)
      p.span(33, 22, 24, 'gold', 2)
      p.span(24, 11, 13, 'spark', 1)
      p.span(24, 18, 20, 'spark', 2)
      p.span(25, 11, 12, 'spark', 2)
      p.span(25, 19, 20, 'spark', 3)
      for (const y of [28, 31, 34]) {
        p.set(12, y, 'gold', 0)
        p.set(19, y, 'gold', 2)
      }
      p.set(8, 24, 'gold', 0)
      p.set(23, 24, 'gold', 2)
      p.set(7, 25, 'gold', 1)
      p.set(24, 25, 'gold', 2)
      p.set(13, 27, 'accent', 0)
      twinkle(p, bob, [[13, 27, 0], [8, 24, 1], [20, 37, 0], [11, 38, 1], [23, 29, 1]])
      break
    }
    case 'dragonmail': {
      torso(p)
      sleeves(p, 30)
      shadeTop(p, 30)
      for (let y = 25; y <= 33; y++) for (let x = 10; x <= 21; x++) {
        if ((x + y) % 2 === 0) p.tone(x, y, 'top', y < 29 ? 2 : 3)
        else if (y % 2 === 1) p.tone(x, y, 'top', 0)
      }
      // gold pauldrons, collar, bracers and belt
      for (const [a0, b0] of [[7, 10], [21, 24]]) for (let y = 24; y <= 26; y++) p.span(y, a0, b0, 'gold', y === 26 ? 2 : y === 25 ? 1 : 0)
      p.span(24, 12, 13, 'gold', 1)
      p.span(24, 18, 19, 'gold', 2)
      p.span(29, 7, 9, 'gold', 1)
      p.span(30, 7, 9, 'gold', 2)
      p.span(29, 22, 24, 'gold', 2)
      p.span(30, 22, 24, 'gold', 3)
      p.span(33, 10, 21, 'gold', 1)
      p.span(34, 10, 21, 'gold', 2)
      p.span(28, 15, 16, 'accent', 0)
      p.span(29, 15, 16, 'accent', 1)
      p.set(15, 30, 'accent', 2)
      p.set(16, 30, 'accent', 3)
      twinkle(p, bob, [[15, 28, 0], [8, 25, 1], [22, 25, 0], [12, 33, 1], [19, 33, 0]])
      break
    }
    case 'galacoat': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      // tails hang at both sides, leaving the middle clear
      for (let y = 35; y <= 40; y++) {
        const w = y === 40 ? 1 : 0
        p.span(y, 10 + w, 13, 'top', 1)
        p.span(y, 18, 21 - w, 'top', 1)
        p.tone(13, y, 'top', 2)
        p.tone(21 - w, y, 'top', 2)
      }
      p.span(40, 11, 13, 'gold', 2)
      p.span(40, 18, 20, 'gold', 3)
      // inner shirt front and gold lapel edges
      for (let y = 24; y <= 34; y++) {
        const half = y <= 26 ? 2 : 1
        p.span(y, 16 - half, 15 + half, 'accent', y > 31 ? 2 : 1)
      }
      p.span(24, 14, 17, 'skin', 2)
      for (const [x, y] of [[13, 25], [13, 26], [13, 27], [14, 28], [14, 29], [14, 30]]) p.set(x, y, 'gold', 1)
      for (const [x, y] of [[18, 25], [18, 26], [18, 27], [17, 28], [17, 29], [17, 30]]) p.set(x, y, 'gold', 2)
      for (const y of [29, 31, 33]) p.set(16, y, 'gold', 0)
      // epaulettes with fringe, cuffs
      p.span(24, 8, 9, 'gold', 0)
      p.span(24, 22, 23, 'gold', 2)
      for (const y of [25, 26]) {
        p.set(7, y, 'gold', 1)
        p.set(24, y, 'gold', 2)
      }
      p.set(7, 27, 'gold', 2)
      p.set(24, 27, 'gold', 3)
      p.span(33, 7, 9, 'gold', 1)
      p.span(33, 22, 24, 'gold', 2)
      for (const [x, y] of [[11, 30], [12, 32], [20, 29], [19, 33], [8, 29], [23, 31]]) p.tone(x, y, 'top', 0)
      star(p, bob, 11, 27, 0)
      star(p, bob, 20, 31, 1)
      twinkle(p, bob, [[12, 37, 1], [19, 38, 0], [8, 31, 0], [23, 28, 1], [12, 30, 1]])
      break
    }
  }
}

function premiumBottom(p: Pix, a: Appearance, bob: boolean) {
  switch (a.bottom) {
    case 'gilded': {
      legs(p, 43)
      p.span(35, 11, 20, 'gold', 1)
      p.set(15, 35, 'gold', 0)
      p.set(16, 35, 'gold', 3)
      for (let y = 36; y <= 43; y++) {
        p.set(11, y, 'gold', 1)
        p.set(20, y, 'gold', 2)
      }
      p.span(42, 12, 14, 'gold', 1)
      p.span(42, 17, 19, 'gold', 1)
      p.span(43, 12, 14, 'gold', 2)
      p.span(43, 17, 19, 'gold', 3)
      twinkle(p, bob, [[11, 38, 0], [20, 41, 1], [15, 35, 1], [12, 42, 0]])
      break
    }
    case 'starfall': {
      legs(p, 43)
      for (let y = 37; y <= 43; y++) for (const x of [11, 12, 13, 17, 18, 19]) p.tone(x, y, 'bottom', y > 40 ? 3 : 2)
      p.span(35, 11, 20, 'gold', 2)
      p.span(43, 11, 14, 'bottom', 3)
      p.span(43, 17, 20, 'bottom', 3)
      for (const [x, y] of [[13, 39], [18, 42], [11, 37], [19, 38], [12, 42]]) p.set(x, y, 'gold', 1)
      star(p, bob, 12, 40, 0)
      star(p, bob, 18, 39, 1)
      twinkle(p, bob, [[13, 37, 1], [19, 42, 0], [11, 41, 1], [17, 37, 0]])
      break
    }
    case 'royalpants': {
      legs(p, 43)
      for (let y = 37; y <= 43; y++) {
        p.set(12, y, 'gold', 1)
        p.set(18, y, 'gold', 2)
      }
      p.span(35, 11, 20, 'gold', 1)
      p.span(36, 11, 20, 'bottom', 2)
      p.span(35, 15, 16, 'accent', 0)
      p.set(13, 36, 'gold', 0)
      p.set(18, 36, 'gold', 2)
      p.span(42, 11, 14, 'gold', 1)
      p.span(42, 17, 20, 'gold', 1)
      p.span(43, 11, 14, 'gold', 2)
      p.span(43, 17, 20, 'gold', 3)
      twinkle(p, bob, [[15, 35, 1], [12, 39, 0], [18, 40, 1]])
      break
    }
    case 'sequin': {
      legs(p, 43)
      p.span(35, 11, 20, 'accent', 1)
      p.set(15, 35, 'spark', 0)
      for (let y = 36; y <= 43; y++) for (const x of [11, 12, 13, 14, 17, 18, 19, 20]) {
        if ((x * 2 + y) % 4 === 0) p.tone(x, y, 'bottom', 0)
        else if ((x + y * 3) % 5 === 0) p.set(x, y, 'spark', 2)
      }
      p.span(43, 11, 14, 'bottom', 2)
      p.span(43, 17, 20, 'bottom', 2)
      twinkle(p, bob, [[12, 38, 0], [19, 37, 1], [13, 41, 1], [18, 42, 0], [11, 40, 0], [20, 39, 1]])
      break
    }
  }
}

function top(p: Pix, a: Appearance, bob = false) {
  premiumTop(p, a, bob)
  switch (a.top) {
    case 'tee': {
      torso(p)
      sleeves(p, 28)
      shadeTop(p, 28)
      p.span(28, 7, 9, 'top', 2)
      p.span(28, 22, 24, 'top', 2)
      p.span(24, 14, 17, 'accent')
      p.span(24, 15, 16, 'skin', 2)
      p.span(25, 15, 16, 'accent')
      break
    }
    case 'hoodie': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      p.span(22, 10, 13, 'top', 2)
      p.span(22, 18, 21, 'top', 2)
      p.span(23, 10, 13, 'top')
      p.span(23, 18, 21, 'top')
      p.span(23, 13, 13, 'top', 2)
      p.span(23, 18, 18, 'top', 2)
      for (let y = 25; y <= 28; y++) {
        p.set(14, y, 'accent', y === 28 ? 0 : 1)
        p.set(17, y, 'accent', y === 28 ? 0 : 1)
      }
      p.span(29, 12, 19, 'top', 2)
      for (let y = 30; y <= 32; y++) {
        p.tone(12, y, 'top', 2)
        p.tone(19, y, 'top', 2)
      }
      p.span(32, 7, 9, 'top', 2)
      p.span(32, 22, 24, 'top', 2)
      p.span(33, 7, 9, 'top', 3)
      p.span(33, 22, 24, 'top', 3)
      break
    }
    case 'sweater': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      p.span(24, 13, 18, 'top', 2)
      p.span(24, 14, 17, 'accent', 1)
      p.span(28, 10, 21, 'accent')
      p.span(28, 7, 9, 'accent')
      p.span(28, 22, 24, 'accent')
      for (let x = 10; x <= 21; x += 2) p.set(x, 29, 'accent', 2)
      for (let x = 7; x <= 24; x++) {
        if (p.is(x, 33, 'top')) p.tone(x, 33, 'top', x % 2 ? 2 : 3)
        p.tone(x, 34, 'top', x % 2 ? 2 : 3)
      }
      break
    }
    case 'jacket': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      for (let y = 24; y <= 34; y++) p.span(y, 14, 17, 'accent', y === 34 ? 2 : 1)
      p.tone(17, 25, 'accent', 2)
      for (let y = 25; y <= 34; y++) {
        p.tone(13, y, 'top', 0)
        p.tone(18, y, 'top', 2)
      }
      p.span(23, 12, 13, 'top', 0)
      p.span(23, 18, 19, 'top', 1)
      p.span(31, 11, 12, 'top', 2)
      p.span(31, 19, 20, 'top', 3)
      p.span(33, 7, 9, 'top', 3)
      p.span(33, 22, 24, 'top', 3)
      break
    }
    case 'blazer': {
      torso(p)
      sleeves(p, 33)
      shadeTop(p, 33)
      const v: [number, number, number][] = [[24, 13, 18], [25, 14, 17], [26, 14, 17], [27, 15, 16], [28, 15, 16]]
      for (const [y, a0, b0] of v) p.span(y, a0, b0, 'accent')
      p.tone(17, 25, 'accent', 2)
      for (const [x, y] of [[12, 24], [13, 25], [13, 26], [14, 27], [14, 28], [15, 29]]) p.tone(x, y, 'top', 0)
      for (const [x, y] of [[19, 24], [18, 25], [18, 26], [17, 27], [17, 28], [16, 29]]) p.tone(x, y, 'top', 2)
      p.tone(15, 31, 'top', 3)
      p.tone(15, 33, 'top', 3)
      p.set(19, 27, 'accent', 0)
      p.span(33, 7, 9, 'accent', 1)
      p.span(33, 22, 24, 'accent', 2)
      break
    }
    case 'shirt': {
      torso(p)
      sleeves(p, 30)
      shadeTop(p, 30)
      p.span(30, 7, 9, 'top', 0)
      p.span(30, 22, 24, 'top', 2)
      for (const [x, y] of [[12, 24], [13, 24], [13, 25]]) p.set(x, y, 'top', 0)
      for (const [x, y] of [[18, 24], [19, 24], [18, 25]]) p.set(x, y, 'top', 0)
      p.span(24, 14, 17, 'skin', 2)
      for (let y = 25; y <= 34; y++) p.tone(15, y, 'top', 2)
      for (const y of [26, 29, 32]) p.set(16, y, 'accent', 1)
      p.span(27, 11, 12, 'top', 2)
      p.tone(11, 28, 'top', 2)
      p.tone(12, 28, 'top', 2)
      break
    }
    case 'jersey': {
      p.span(24, 11, 13, 'top')
      p.span(24, 18, 20, 'top')
      p.span(25, 11, 14, 'top')
      p.span(25, 17, 20, 'top')
      for (let y = 26; y <= 34; y++) p.span(y, 10, 21, 'top')
      shadeTop(p, 24)
      for (const [x, y] of [[13, 24], [14, 25], [18, 24], [17, 25], [10, 26], [10, 27], [21, 26], [21, 27]]) p.set(x, y, 'accent', 1)
      p.span(24, 14, 17, 'skin', 2)
      p.span(25, 15, 16, 'skin', 2)
      const seven: [number, number][] = [[14, 28], [15, 28], [16, 28], [17, 28], [17, 29], [16, 30], [16, 31], [15, 32], [15, 33]]
      for (const [x, y] of seven) p.set(x, y, 'accent', 1)
      p.span(34, 10, 21, 'accent', 2)
      break
    }
  }
}

function legs(p: Pix, end: number, m: Material = 'bottom') {
  p.span(35, 11, 20, m)
  p.span(36, 11, 20, m)
  for (let y = 37; y <= end; y++) {
    p.span(y, 11, 14, m)
    p.span(y, 17, 20, m)
  }
  for (let y = 35; y <= end; y++) {
    p.tone(20, y, m, 2)
    if (y >= 37) p.tone(14, y, m, 2)
  }
  p.span(35, 11, 20, m, 2)
  p.span(36, 15, 16, m, 3)
}

function bottom(p: Pix, a: Appearance, bob = false) {
  premiumBottom(p, a, bob)
  switch (a.bottom) {
    case 'jeans':
      legs(p, 43)
      for (let y = 38; y <= 42; y++) p.tone(12, y, 'bottom', 0)
      p.span(43, 11, 14, 'bottom', 0)
      p.span(43, 17, 20, 'bottom', 0)
      p.tone(19, 36, 'bottom', 0)
      break
    case 'slacks':
      legs(p, 43)
      for (let y = 37; y <= 43; y++) {
        p.tone(12, y, 'bottom', 2)
        p.tone(18, y, 'bottom', 2)
      }
      break
    case 'joggers':
      legs(p, 43)
      p.span(42, 11, 14, 'bottom', 3)
      p.span(42, 17, 20, 'bottom', 3)
      p.span(43, 11, 14, 'bottom', 2)
      p.span(43, 17, 20, 'bottom', 2)
      p.tone(12, 37, 'bottom', 0)
      p.tone(12, 38, 'bottom', 0)
      break
    case 'shorts':
      legs(p, 39)
      p.span(39, 11, 14, 'bottom', 2)
      p.span(39, 17, 20, 'bottom', 2)
      break
    case 'athletic':
      legs(p, 40)
      for (let y = 36; y <= 40; y++) {
        p.set(11, y, 'accent', 1)
        p.set(20, y, 'accent', 2)
      }
      p.span(40, 12, 14, 'bottom', 2)
      p.span(40, 17, 19, 'bottom', 2)
      break
    case 'skirt': {
      const flare: Record<number, [number, number][]> = {
        34: [[10, 21]], 35: [[10, 21]], 36: [[10, 21]], 37: [[9, 22]], 38: [[9, 22]], 39: [[8, 23]], 40: [[8, 23]],
      }
      p.rows(flare, 'bottom')
      for (let y = 37; y <= 40; y++) for (const x of [12, 15, 18, 21]) p.tone(x, y, 'bottom', 2)
      for (let y = 34; y <= 40; y++) {
        const right = y >= 39 ? 23 : y >= 37 ? 22 : 21
        p.tone(right, y, 'bottom', 2)
      }
      p.span(40, 8, 23, 'bottom', 2)
      p.tone(10, 35, 'bottom', 0)
      p.tone(9, 37, 'bottom', 0)
      break
    }
  }
}

function shoesLayer(p: Pix, a: Appearance) {
  const base = (sole: Material) => {
    p.span(44, 11, 14, 'shoe')
    p.span(44, 17, 20, 'shoe')
    p.span(45, 10, 14, 'shoe')
    p.span(45, 17, 21, 'shoe')
    p.span(46, 10, 14, sole, sole === 'sole' ? 1 : 3)
    p.span(46, 17, 21, sole, sole === 'sole' ? 1 : 3)
    p.tone(14, 45, 'shoe', 2)
    p.tone(21, 45, 'shoe', 2)
    p.tone(10, 45, 'shoe', 0)
    p.tone(17, 45, 'shoe', 0)
  }
  switch (a.shoes) {
    case 'sneakers':
      base('sole')
      p.tone(12, 44, 'shoe', 0)
      p.tone(19, 44, 'shoe', 0)
      p.tone(21, 46, 'sole', 2)
      p.tone(14, 46, 'sole', 2)
      break
    case 'hightops':
      p.span(42, 11, 14, 'shoe')
      p.span(42, 17, 20, 'shoe')
      p.span(43, 11, 14, 'shoe')
      p.span(43, 17, 20, 'shoe')
      base('sole')
      for (const y of [42, 43, 44]) {
        p.tone(12, y, 'shoe', 0)
        p.tone(19, y, 'shoe', 0)
        p.tone(14, y, 'shoe', 2)
        p.tone(20, y, 'shoe', 2)
      }
      p.span(42, 11, 14, 'accent', 1)
      p.span(42, 17, 20, 'accent', 2)
      break
    case 'boots':
      for (let y = 41; y <= 43; y++) {
        p.span(y, 11, 14, 'shoe')
        p.span(y, 17, 20, 'shoe')
        p.tone(14, y, 'shoe', 2)
        p.tone(20, y, 'shoe', 2)
      }
      base('shoe')
      p.span(41, 11, 14, 'shoe', 0)
      p.span(41, 17, 20, 'shoe', 2)
      break
    case 'loafers':
      base('shoe')
      p.span(44, 11, 14, 'shoe', 2)
      p.span(44, 17, 20, 'shoe', 2)
      p.tone(11, 45, 'shoe', 0)
      p.tone(18, 45, 'shoe', 0)
      break
  }
}

function packBack(p: Pix) {
  p.span(21, 8, 10, 'pack')
  p.span(22, 8, 10, 'pack')
  p.span(23, 8, 9, 'pack')
  p.span(21, 21, 23, 'pack', 2)
  p.span(22, 21, 23, 'pack', 2)
  p.span(23, 22, 23, 'pack', 2)
  for (let y = 25; y <= 33; y++) {
    p.set(5, y, 'pack', 1)
    p.set(6, y, 'pack', y > 30 ? 2 : 1)
    p.set(25, y, 'pack', 2)
    p.set(26, y, 'pack', 3)
  }
  p.tone(8, 21, 'pack', 0)
  p.tone(9, 21, 'pack', 0)
}

function packStraps(p: Pix) {
  for (let y = 24; y <= 31; y++) {
    p.set(11, y, 'pack', 2)
    p.set(20, y, 'pack', 3)
  }
  p.set(11, 29, 'accent', 0)
  p.set(20, 29, 'accent', 2)
}

function hat(p: Pix, a: Appearance) {
  if (a.hat === 'none') return
  const clearAbove = (row: number) => {
    for (let y = 0; y < row; y++) for (let x = 0; x < SPRITE_W; x++) if (p.is(x, y, 'hair')) p.erase(x, y)
  }
  if (a.hat === 'beanie') {
    clearAbove(2)
    p.rows({ 2: [[11, 20]], 3: [[9, 22]], 4: [[8, 23]], 5: [[7, 24]], 6: [[7, 24]], 7: [[7, 24]] }, 'hat')
    autoShade(p, 'hat')
    for (let x = 6; x <= 25; x++) {
      p.set(x, 8, 'hat', x % 2 ? 1 : 2)
      p.set(x, 9, 'hat', x % 2 ? 2 : 3)
    }
    p.span(1, 15, 16, 'accent', 0)
    p.span(2, 15, 16, 'accent', 1)
  } else if (a.hat === 'cap') {
    clearAbove(3)
    p.rows({ 3: [[10, 21]], 4: [[8, 23]], 5: [[7, 24]], 6: [[7, 24]], 7: [[7, 24]] }, 'hat')
    autoShade(p, 'hat')
    p.span(8, 5, 25, 'hat', 1)
    p.span(8, 5, 8, 'hat', 0)
    p.span(9, 6, 24, 'hat', 3)
    p.span(5, 15, 16, 'accent', 0)
    p.span(6, 15, 16, 'accent', 1)
    p.tone(16, 3, 'hat', 2)
  } else if (a.hat === 'headband') {
    for (let x = 6; x <= 25; x++) {
      if (p.get(x, 8) || p.get(x, 9)) {
        p.set(x, 8, 'hat', 0)
        p.set(x, 9, 'hat', x > 18 ? 2 : 1)
      }
    }
  }
}

function eyewear(p: Pix, a: Appearance) {
  const ring = (x: number) => {
    p.span(12, x + 1, x + 2, 'frame')
    p.span(16, x + 1, x + 2, 'frame')
    for (let y = 13; y <= 15; y++) {
      p.set(x, y, 'frame')
      p.set(x + 3, y, 'frame')
    }
  }
  const square = (x: number) => {
    p.span(12, x, x + 3, 'frame')
    p.span(16, x, x + 3, 'frame')
    for (let y = 13; y <= 15; y++) {
      p.set(x, y, 'frame')
      p.set(x + 3, y, 'frame')
    }
  }
  if (a.glasses === 'none') return
  if (a.glasses === 'round') {
    ring(10)
    ring(18)
  } else if (a.glasses === 'square') {
    square(10)
    square(18)
  } else {
    for (const x0 of [10, 18]) {
      p.span(12, x0, x0 + 3, 'frame')
      for (let y = 13; y <= 15; y++) p.span(y, x0, x0 + 3, 'lens', y === 15 ? 2 : 1)
      p.set(x0, 13, 'lens', 0)
      p.set(x0 + 1, 13, 'lens', 0)
    }
  }
  p.span(13, 14, 17, 'frame')
  p.span(13, 8, 9, 'frame')
  p.span(13, 22, 23, 'frame')
}

/** Build one frame of a character. `bob` lowers the upper body a pixel for the idle cycle. */
export function drawCharacter(a: Appearance, { bob = false, blink = false } = {}): Pix {
  const p = new Pix()
  const style = STYLES[a.hair]
  if (a.pack === 'backpack') packBack(p)
  hairLayer(p, style.back, style)
  body(p)
  face(p, a, blink)
  bottom(p, a, bob)
  shoesLayer(p, a)
  top(p, a, bob)
  if (a.pack === 'backpack') packStraps(p)
  if (a.watch === 'watch') {
    p.span(33, 7, 9, 'watch', 2)
    p.set(8, 33, 'watch', 0)
  }
  hairLayer(p, style.front, style)
  hairLayer(p, style.drape, style)
  hairFinish(p, style)
  hat(p, a)
  castShadows(p)
  eyewear(p, a)
  if (bob) {
    for (let y = 34; y >= 0; y--) for (let x = 0; x < SPRITE_W; x++) {
      const c = p.get(x, y)
      if (c) p.cells[(y + 1) * SPRITE_W + x] = c
      else if (y < 34) p.cells[(y + 1) * SPRITE_W + x] = null
      if (y === 0) p.cells[x] = null
    }
  }
  return p
}
