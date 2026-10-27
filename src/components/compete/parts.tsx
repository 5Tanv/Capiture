import type { ReactNode } from 'react'
import type { Rival } from '../../lib/league'
import { AccountPortrait } from '../lobby/Portrait'
import { CharacterPortrait } from '../sprite/CharacterSprite'

export function YouPortrait({ className = 'h-14 w-14' }: { className?: string }) {
  return <AccountPortrait className={`shrink-0 border-2 border-ink ${className}`} />
}

export function RivalPortrait({ rival, className = 'h-14 w-14' }: { rival: Rival; className?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden border-2 border-ink bg-[#8ec9e0] ${className}`}>
      <CharacterPortrait appearance={rival.appearance} className="h-full w-full" />
    </span>
  )
}

/** The rival is played by the game; say so wherever they appear. `className` sets the display too. */
export function RivalTag({ className = 'inline-block' }: { className?: string }) {
  return (
    <span className={`bg-[var(--ar-teal-deep)] px-1.5 py-0.5 font-pixel text-[11px] leading-none tracking-wide text-[#d9fbf7] ${className}`}>
      COMPUTER RIVAL
    </span>
  )
}

export function YouTag({ className = 'inline-block' }: { className?: string }) {
  return (
    <span className={`bg-brass-500 px-1.5 py-0.5 font-pixel text-[11px] leading-none tracking-wide text-ink ${className}`}>YOU</span>
  )
}

/** One side of a scoreboard: portrait, name, and a score line. */
export function Fighter({ portrait, name, tag, score, flip }: { portrait: ReactNode; name: string; tag: ReactNode; score: ReactNode; flip?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-2 text-center sm:gap-3 ${flip ? 'sm:flex-row-reverse sm:text-right' : 'sm:flex-row sm:text-left'}`}>
      {portrait}
      <div className="w-full min-w-0 sm:w-auto">
        <p className="txt-game-sm truncate text-[16px] leading-tight sm:text-[19px]" title={name}>
          {name}
        </p>
        <div className={`mt-1 flex flex-wrap items-center justify-center gap-2 ${flip ? 'sm:justify-end' : 'sm:justify-start'}`}>
          {tag}
          {score}
        </div>
      </div>
    </div>
  )
}
