import { dyes, eyeColors, hairColors, skinTones, type Appearance } from './catalog'
import { hexToRgb, outlineOf, ramp, type Ramp } from './color'
import { drawCharacter, SPRITE_H, SPRITE_W, type Material, type Pix } from './draw'

const fixed: Partial<Record<Material, Ramp>> = {
  eyeW: ['#ffffff', '#fbf6ee', '#e6dccb', '#c9bba3'],
  mouth: ['#ef9a86', '#c8604f', '#94403a', '#622824'],
  blush: ['#ffb0a0', '#f08f86', '#d06a66', '#a84e4e'],
  watch: ['#f7d36a', '#4a4656', '#2e2b38', '#1c1a24'],
  frame: ['#5a5466', '#2e2a38', '#1e1b26', '#141219'],
  lens: ['#8fd3e6', '#2e4a5a', '#1f3340', '#14222b'],
  gold: ['#fff0a0', '#f3c64f', '#c68b27', '#7d5217'],
  spark: ['#ffffff', '#fff6c8', '#ffe58a', '#e8b94a'],
}

const dyeRamp = (id: string) => ramp(dyes.find((d) => d.id === id)?.base ?? dyes[0].base)

export function palette(a: Appearance): Record<Material, Ramp> {
  const hair = hairColors.find((h) => h.id === a.hairColor)?.ramp ?? hairColors[0].ramp
  return {
    ...(fixed as Record<Material, Ramp>),
    skin: skinTones.find((s) => s.id === a.skin)?.ramp ?? skinTones[0].ramp,
    hair,
    brow: [hair[3], hair[3], hair[3], hair[3]],
    eye: eyeColors.find((e) => e.id === a.eyeColor)?.ramp ?? eyeColors[0].ramp,
    top: dyeRamp(a.topColor),
    accent: dyeRamp(a.topAccent),
    bottom: dyeRamp(a.bottomColor),
    shoe: dyeRamp(a.shoeColor),
    sole: ['#ffffff', '#f2eee6', '#cfc8ba', '#a39b8c'],
    hat: dyeRamp(a.hatColor),
    pack: dyeRamp(a.packColor),
  }
}

/** Resolve cells to colors and wrap the silhouette in a colored (not black) outline. */
export function toRGBA(p: Pix, pal: Record<Material, Ramp>): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(SPRITE_W * SPRITE_H * 4))
  const put = (x: number, y: number, hex: string) => {
    const [r, g, b] = hexToRgb(hex)
    const i = (y * SPRITE_W + x) * 4
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
    out[i + 3] = 255
  }
  p.each((x, y, c) => put(x, y, pal[c.m][c.t]))
  // Outline: an empty pixel touching the sprite takes the darkest neighbor's outline.
  for (let y = 0; y < SPRITE_H; y++) for (let x = 0; x < SPRITE_W; x++) {
    if (p.get(x, y)) continue
    let best: string | null = null
    let bestLum = Infinity
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const n = p.get(x + dx, y + dy)
      if (!n) continue
      const o = outlineOf(pal[n.m])
      const [r, g, b] = hexToRgb(o)
      const lum = r * 0.3 + g * 0.59 + b * 0.11
      if (lum < bestLum) {
        bestLum = lum
        best = o
      }
    }
    if (best) put(x, y, best)
  }
  return out
}

export type Frame = 'idle' | 'bob' | 'blink'

const cache = new Map<string, string>()

/** A data-URL PNG of one frame, cached by look. */
export function spriteUrl(a: Appearance, frame: Frame = 'idle'): string {
  const key = `${frame}|${JSON.stringify(a)}`
  const hit = cache.get(key)
  if (hit) return hit
  const pix = drawCharacter(a, { bob: frame === 'bob', blink: frame === 'blink' })
  const data = toRGBA(pix, palette(a))
  const canvas = document.createElement('canvas')
  canvas.width = SPRITE_W
  canvas.height = SPRITE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.putImageData(new ImageData(data, SPRITE_W, SPRITE_H), 0, 0)
  const url = canvas.toDataURL('image/png')
  if (cache.size > 400) cache.clear()
  cache.set(key, url)
  return url
}

export { SPRITE_W, SPRITE_H }
