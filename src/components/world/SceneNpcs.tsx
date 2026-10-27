import { npcs, type NpcId } from '../../data/npcs'
import type { SceneId } from '../../types/game'
import { SvgCharacter } from '../sprite/CharacterSprite'
import type { SceneLayout } from './scenes'

/**
 * The supporting characters an event brings into a scene, each on the next free mark.
 * An NPC that doesn't belong to this scene, or a scene with no mark left, draws nothing,
 * so the player stands alone unless the event data says otherwise.
 */
export function SceneNpcs({ scene, sceneId, ids }: { scene: SceneLayout; sceneId: SceneId; ids?: NpcId[] }) {
  if (!ids?.length) return null
  const here = ids.map((id) => npcs[id]).filter((n) => n.scenes.includes(sceneId))
  return (
    <>
      {here.slice(0, scene.npcSpots.length).map((n, i) => {
        const { x, y, flip } = scene.npcSpots[i]
        return (
          <g key={n.id}>
            <SvgCharacter appearance={n.appearance} x={x} y={y} flip={flip} />
            <text x={x} y={y + 9} textAnchor="middle" className="font-pixel" fontSize="5.5" fill="#f1e6cc" stroke="#241a16" strokeWidth="1.6" paintOrder="stroke">
              {n.role.toUpperCase()}
            </text>
          </g>
        )
      })}
    </>
  )
}
