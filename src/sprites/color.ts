// Color math for pixel ramps. Shadows cool toward blue-violet, highlights warm
// toward yellow: the hue-shifted ramps that keep pixel art from looking muddy.

type HSL = [number, number, number]

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  return [h, s * 100, l * 100]
}

function hslToHex([h, s, l]: HSL) {
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

function toward(h: number, target: number, amount: number) {
  const d = ((target - h + 540) % 360) - 180
  const step = Math.sign(d) * Math.min(Math.abs(d), amount)
  return (h + step + 360) % 360
}

/** A four-tone ramp: [light, base, shade, deep]. */
export type Ramp = [string, string, string, string]

export function ramp(base: string): Ramp {
  const [h, s, l] = rgbToHsl(...hexToRgb(base))
  // Near-greys get no hue shift, or they turn into tinted mud.
  const grey = s < 8
  return [
    hslToHex([grey ? h : toward(h, 52, 8), s - 4, l + 13]),
    base,
    hslToHex([grey ? h : toward(h, 255, 12), s + 4, l - 14]),
    hslToHex([grey ? h : toward(h, 255, 24), s + 2, l - 27]),
  ]
}

export function mix(a: string, b: string, t = 0.5) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t)
}

/** The colored outline for a ramp: its deepest tone pushed toward the shared ink. */
export const outlineOf = (r: Ramp) => mix(r[3], '#1c1220', 0.55)
