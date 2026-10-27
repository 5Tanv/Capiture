import { useGame } from '../../state/GameProvider'
import type { LifeId, WorldId } from '../../types/game'
import { CharacterPortrait } from '../sprite/CharacterSprite'

/** Each world's sky, behind its character's portrait. */
export const worldTint: Record<WorldId, string> = {
  campus: '#8fd6ee',
  suburb: '#ffd9a8',
  city: '#f4b072',
  arena: '#4f78b0',
}

/** Head-and-shoulders crop of a life's own character, on their world's color. */
export function Portrait({ lifeId, worldId, className = '' }: { lifeId: LifeId; worldId: WorldId; className?: string }) {
  const { lives } = useGame()
  const life = lives[lifeId]
  return (
    <span className={`block overflow-hidden ${className}`} style={{ background: worldTint[worldId] }}>
      <CharacterPortrait appearance={life.appearance} className="h-full w-full" />
    </span>
  )
}

/** The player's own avatar: the account, not any life. */
export function AccountPortrait({ className = '' }: { className?: string }) {
  const { account } = useGame()
  return (
    <span className={`block overflow-hidden bg-[#8ec9e0] ${className}`}>
      <CharacterPortrait appearance={account.appearance} className="h-full w-full" />
    </span>
  )
}
