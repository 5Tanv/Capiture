import type { CSSProperties } from 'react'
import type { EffectItem, EffectStyle } from '../../data/shop'

// Five restrained stage effects. Each is at most eight decorative particles, sits behind the
// avatar (so it can never cover a face or the title), takes no input, and is paused by the
// parent when the stage is offscreen. With reduced motion the CSS stops every animation and
// the particles stay put as static accents.

type P = { x: number; y: number; d: number; s?: number }

// x, y in % of the stage; d is the animation delay in seconds; s scales the particle.
const FIREFLIES: P[] = [
  { x: 12, y: 58, d: 0 }, { x: 24, y: 76, d: 1.4 }, { x: 84, y: 52, d: 0.7 }, { x: 70, y: 70, d: 2.1 },
  { x: 33, y: 40, d: 2.8 }, { x: 90, y: 78, d: 3.3 }, { x: 8, y: 36, d: 1.9 }, { x: 62, y: 44, d: 0.3 },
]
const COINS: P[] = [
  { x: 10, y: 30, d: 0 }, { x: 24, y: 62, d: 2.2 }, { x: 38, y: 24, d: 4.1 }, { x: 54, y: 70, d: 1.1 },
  { x: 68, y: 26, d: 3.3 }, { x: 80, y: 58, d: 0.6 }, { x: 91, y: 34, d: 2.9 }, { x: 46, y: 44, d: 5 },
]
const HALO: P[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  return { x: 50 + Math.cos(a) * 26, y: 56 + Math.sin(a) * 30, d: i * 0.35 }
})
const MOTES: P[] = [
  { x: 6, y: 12, d: 0 }, { x: 94, y: 14, d: 1.6 }, { x: 5, y: 84, d: 3.2 }, { x: 95, y: 82, d: 0.9 },
]

const px = (n: number) => `max(${n}px, ${(n / 3.2).toFixed(2)}cqw)`

function Dot({ p, color, size = 4, cls }: { p: P; color: string; size?: number; cls: string }) {
  return (
    <span
      className={`fx-p ${cls} absolute block`}
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: px(size * (p.s ?? 1)), height: px(size * (p.s ?? 1)), background: color, animationDelay: `${p.d}s` } as CSSProperties}
    />
  )
}

/** A four-point pixel sparkle made of five squares. */
function Spark({ p, color, cls }: { p: P; color: string; cls: string }) {
  const u = px(3)
  const sq = (x: number, y: number) => <span key={`${x}${y}`} className="absolute block" style={{ left: `calc(${u} * ${x})`, top: `calc(${u} * ${y})`, width: u, height: u, background: color }} />
  return (
    <span className={`fx-p ${cls} absolute block`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${u} * 3)`, height: `calc(${u} * 3)`, animationDelay: `${p.d}s` }}>
      {sq(1, 0)}
      {sq(0, 1)}
      {sq(1, 1)}
      {sq(2, 1)}
      {sq(1, 2)}
    </span>
  )
}

function render(style: EffectStyle, [a, b]: string[]) {
  switch (style) {
    case 'slow_fireflies':
      return FIREFLIES.map((p, i) => <Dot key={i} p={p} color={i % 2 ? b : a} size={4} cls="fx-firefly" />)
    case 'pixel_coin_sparkles':
      return COINS.map((p, i) => (i % 2 ? <Dot key={i} p={p} color={a} size={5} cls="fx-fall fx-coin" /> : <Spark key={i} p={p} color={b} cls="fx-fall" />))
    case 'soft_pixel_halo':
      return (
        <>
          <span className="fx-glow absolute inset-x-[18%] top-[22%] bottom-[8%] rounded-[50%]" style={{ background: `radial-gradient(closest-side, ${b}66, ${a}22 62%, transparent)` }} />
          {HALO.map((p, i) => (
            <Dot key={i} p={p} color={i % 2 ? b : a} size={4} cls="fx-twinkle" />
          ))}
        </>
      )
    case 'orbiting_pixel_stars':
      return (
        <span className="absolute left-1/2 top-[58%] block aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translate(-50%, -50%) scaleY(0.5)' }}>
          <span className="fx-orbit absolute inset-0 block">
            {Array.from({ length: 7 }, (_, i) => {
              const ang = (i / 7) * Math.PI * 2
              return <Dot key={i} p={{ x: 50 + Math.cos(ang) * 48, y: 50 + Math.sin(ang) * 48, d: 0 }} color={i % 2 ? b : a} size={i % 3 === 0 ? 6 : 4} cls="fx-static" />
            })}
          </span>
        </span>
      )
    case 'restrained_royal_glow':
      return (
        <>
          <span className="fx-glow absolute inset-0 block" style={{ boxShadow: `inset 0 0 ${px(46)} ${px(6)} ${a}55, inset 0 0 ${px(90)} 0 ${b}22` }} />
          {MOTES.map((p, i) => (
            <Spark key={i} p={p} color={i % 2 ? b : a} cls="fx-twinkle" />
          ))}
        </>
      )
  }
}

export function EffectLayer({ item, live = true, className = '' }: { item: EffectItem; live?: boolean; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${live ? '' : 'fx-paused'} ${className}`}
      data-effect={item.style}
      data-particles={Math.min(8, item.maxParticles)}
      aria-hidden
    >
      {render(item.style, item.palette)}
    </div>
  )
}
