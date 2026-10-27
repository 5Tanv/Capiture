import { useMemo } from 'react'
import type { NpcId } from '../../data/npcs'
import type { LifeSim, SceneId } from '../../types/game'
import { SvgCharacter } from '../sprite/CharacterSprite'
import { SceneNpcs } from '../world/SceneNpcs'
import { scenes } from '../world/scenes'

/** A letterbox view of where the event happens: the same scene the stage draws. */
export function SceneWindow({ life, sceneId, npcs }: { life: LifeSim; sceneId: SceneId; npcs?: NpcId[] }) {
  const scene = useMemo(() => scenes[sceneId](), [sceneId])
  const { x, y } = scene.standAt
  // 5:1 strip of world, matched to the box so nothing crops unexpectedly. A scene can
  // ask for a taller strip to keep something like a hoop in view; past 104 tall the
  // world runs out of width, so the strip gets a little deeper than 5:1 instead.
  const h = scene.windowTop === undefined ? 64 : y + 8 - scene.windowTop
  const w = Math.min(520, h * 5)
  return (
    <figure className="relative -mx-1 shrink-0 overflow-hidden rounded-[12px] border-[3px] border-ink">
      <svg
        viewBox={`${Math.max(-100, Math.min(420 - w, x - w / 2))} ${y - h + 8} ${w} ${h}`}
        preserveAspectRatio="xMidYMax slice"
        shapeRendering="crispEdges"
        className="block w-full"
        style={{ aspectRatio: `${w} / ${h}` }}
        role="img"
        aria-label={`${scene.label}, where this happens`}
      >
        {scene.backdrop}
        <rect x={x - 12} y={y - 1} width={24} height={3} fill={scene.groundShadow} opacity={0.85} />
        <SceneNpcs scene={scene} sceneId={sceneId} ids={npcs} />
        <SvgCharacter appearance={life.appearance} x={x} y={y} />
        {scene.foreground}
      </svg>
      <figcaption className="font-pixel absolute bottom-1.5 left-1.5 rounded-[5px] border-2 border-ink bg-ink/80 px-1.5 py-0.5 text-[11px] leading-none text-parch-200">
        {scene.label}
      </figcaption>
    </figure>
  )
}
