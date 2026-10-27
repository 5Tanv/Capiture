import { memo } from 'react'
import type { Appearance } from '../../sprites/catalog'
import { SPRITE_H, SPRITE_W, spriteUrl } from '../../sprites/render'

interface CharacterSpriteProps {
  appearance: Appearance
  className?: string
  /** Two-frame idle bob plus an occasional blink. Off for thumbnails. */
  animate?: boolean
  label?: string
}

/** A full-body character, scaled crisply (nearest neighbor) to whatever size CSS gives it. */
export const CharacterSprite = memo(function CharacterSprite({ appearance, className = '', animate = true, label }: CharacterSpriteProps) {
  const idle = spriteUrl(appearance, 'idle')
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ aspectRatio: `${SPRITE_W} / ${SPRITE_H}` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <img src={idle} alt="" draggable={false} className="pixel-sprite absolute inset-0 h-full w-full" />
      {animate && (
        <>
          <img src={spriteUrl(appearance, 'bob')} alt="" draggable={false} className="pixel-sprite sprite-bob absolute inset-0 h-full w-full" />
          <img src={spriteUrl(appearance, 'blink')} alt="" draggable={false} className="pixel-sprite sprite-blink absolute inset-0 h-full w-full" />
        </>
      )}
    </span>
  )
})

/** The character inside a world SVG, at 1:1 world pixels. (x, y) is where the feet touch the ground. */
export const SvgCharacter = memo(function SvgCharacter({
  appearance,
  x,
  y,
  animate = true,
  flip = false,
}: {
  appearance: Appearance
  x: number
  y: number
  animate?: boolean
  flip?: boolean
}) {
  const left = x - SPRITE_W / 2
  const top = y - SPRITE_H + 1
  const t = flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined
  const img = (frame: 'idle' | 'bob' | 'blink', className?: string) => (
    <image
      href={spriteUrl(appearance, frame)}
      x={left}
      y={top}
      width={SPRITE_W}
      height={SPRITE_H}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  )
  return (
    <g transform={t}>
      {img('idle')}
      {animate && img('bob', 'sprite-bob')}
      {animate && img('blink', 'sprite-blink')}
    </g>
  )
})

/** Head-and-shoulders crop of the same sprite, for lists, HUD chips and dialogue. */
export const CharacterPortrait = memo(function CharacterPortrait({
  appearance,
  className = '',
  label,
}: {
  appearance: Appearance
  className?: string
  label?: string
}) {
  // crop: x 3–28, y 2–27 of the 32×48 sprite
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <img
        src={spriteUrl(appearance, 'idle')}
        alt=""
        draggable={false}
        className="pixel-sprite absolute max-w-none"
        style={{ width: `${(SPRITE_W / 26) * 100}%`, left: `${(-3 / 26) * 100}%`, top: `${(-2 / 26) * 100}%` }}
      />
    </span>
  )
})
