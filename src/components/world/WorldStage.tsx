import { useMemo } from 'react'
import { lifeThemes } from '../../theme/lifeThemes'
import type { LifeSim, SceneId } from '../../types/game'
import { SvgCharacter } from '../sprite/CharacterSprite'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import type { NpcId } from '../../data/npcs'
import { PixelGroup } from './PixelSprite'
import { SceneNpcs } from './SceneNpcs'
import { scenes } from './scenes'
import { ballSprite } from './sprites'

interface WorldStageProps {
  life: LifeSim
  /** Which location to draw. Defaults to the life's home. */
  sceneId?: SceneId
  /** Supporting characters the current event brings in. Omitted: only the player is drawn. */
  npcs?: NpcId[]
  /** Changes every time the character should react (e.g. after a choice). */
  reactKey: number
  onOpenRoad: () => void
}

export function WorldStage({ life, sceneId = life.worldId, npcs, reactKey, onOpenRoad }: WorldStageProps) {
  const scene = useMemo(() => scenes[sceneId](), [sceneId])
  const { x, y } = scene.standAt
  const { chapter } = life
  const theme = lifeThemes[life.id]
  const away = sceneId !== life.worldId
  const label = away ? scene.label : life.worldLabel

  return (
    // .stage sizes the frame from its own width (see index.css); overlays are placed
    // against the frame, which is exactly the scene's box, and adapt to its width.
    <section aria-label={`${life.name}'s world`} className="stage flex flex-col items-stretch">
      {/* The diorama: a framed piece of world sitting on its own block of soil. */}
      <div className="stage-frame relative" data-tour="stage">
        <div className="panel-wood frame-life h-full rounded-[24px] p-[7px]">
          <div className="relative h-full overflow-hidden rounded-[16px] border-[3px] border-ink">
            <svg
              key={sceneId}
              viewBox="-100 0 520 200"
              preserveAspectRatio={scene.align === 'max' ? 'xMaxYMax slice' : 'xMidYMax slice'}
              shapeRendering="crispEdges"
              className="anim-fade block h-full w-full"
              role="img"
              aria-label={`${label}, with ${life.name}`}
            >
              {scene.backdrop}
              <rect x={x - 12} y={y - 1} width={24} height={3} fill={scene.groundShadow} opacity={0.85} />
              <SceneNpcs scene={scene} sceneId={sceneId} ids={npcs} />
              <g key={reactKey} className={reactKey ? 'anim-hop' : undefined} style={{ transformBox: 'fill-box' }}>
                <SvgCharacter appearance={life.appearance} x={x} y={y} />
                {life.id === 'athlete' && <PixelGroup sprite={ballSprite} x={x + 9} y={y - 15} />}
              </g>
              {scene.foreground}
            </svg>

            {/* chapter sign, in the life's colors; compact on small stages */}
            <div className="pointer-events-none absolute top-2 left-2 max-w-[calc(100%-1rem)] @md:top-3 @md:left-3 @xl:top-4 @xl:left-4 @xl:max-w-[55%]">
              <p
                className="flex items-center gap-1.5 rounded-[8px] border-[3px] border-ink py-0.5 pr-2 pl-0.5 shadow-[inset_0_2px_0_rgb(255_255_255/0.2),0_6px_12px_-4px_rgb(0_0_0/0.6)] @md:gap-2 @md:py-1 @md:pl-1 @xl:pr-3"
                style={{ background: theme.sign.bg }}
              >
                <span
                  className="font-pixel grid h-5 min-w-5 shrink-0 place-items-center rounded-[5px] border-2 border-ink px-1 text-[12px] leading-none text-ink @md:h-6 @md:min-w-6 @md:text-[13px] @xl:h-7 @xl:min-w-7 @xl:text-sm"
                  style={{ background: theme.accent2 }}
                  aria-label={`Chapter ${chapter.number}`}
                >
                  {chapter.number}
                </span>
                <span className="font-pixel min-w-0 text-[12px] leading-tight @md:text-[13px] @xl:text-base" style={{ color: theme.sign.fg }}>
                  {chapter.title}
                </span>
              </p>
            </div>
            {/* location tag: in the sky on wide stages, under the frame on narrow ones */}
            <p className="font-pixel pointer-events-none absolute right-4 bottom-4 hidden max-w-[40%] items-center gap-1.5 rounded-[6px] border-2 border-ink bg-ink/75 px-2 py-1 text-xs leading-tight text-parch-200 @xl:flex">
              <LocationTag away={away} label={label} accent={theme.accent2} />
            </p>
          </div>
        </div>
      </div>

      {/* soil block under the diorama */}
      <svg viewBox="0 0 320 14" preserveAspectRatio="none" shapeRendering="crispEdges" className="-mt-[3px] block h-4 w-full px-3 sm:h-5" aria-hidden>
        <rect x={0} y={0} width={320} height={4} fill="#241a16" />
        <rect x={2} y={0} width={316} height={3} fill={theme.base.cap} />
        <rect x={2} y={3} width={316} height={5} fill={theme.base.mid} />
        <rect x={6} y={8} width={308} height={3} fill={theme.base.deep} />
        <rect x={14} y={11} width={292} height={3} fill={theme.base.deeper} />
        {[30, 92, 150, 210, 266].map((sx) => (
          <rect key={sx} x={sx} y={5} width={6} height={2} fill={theme.base.fleck} />
        ))}
      </svg>

      <p className="font-pixel mt-1 flex items-center justify-center gap-1.5 px-3 text-center text-[12px] leading-tight text-parch-300 @xl:hidden">
        <LocationTag away={away} label={label} accent={theme.accent2} />
      </p>

      {/* chapter road, like a trophy road: opens the life's event path */}
      <button
        type="button"
        onClick={onOpenRoad}
        className="group mx-auto mt-1 @xl:mt-2 flex w-[min(100%,30rem)] items-center gap-2 rounded-full px-2 py-1 text-left transition-colors hover:bg-black/20"
        aria-label={`Event ${chapter.eventIndex} of ${chapter.eventTotal}. Open the life road`}
      >
        <Icon name="hourglass" className="h-6 w-6 shrink-0" />
        <ProgressBar value={chapter.eventIndex} max={chapter.eventTotal} fill="bg-brass-500" className="h-4 flex-1" label="Chapter progress">
          <span className="txt-game-sm text-[11px] leading-none">
            {chapter.eventIndex} / {chapter.eventTotal}
          </span>
        </ProgressBar>
        <span className="txt-game-sm flex shrink-0 items-center gap-1 text-xs text-brass-300 group-hover:text-brass-400">
          Life Road
          <Icon name="arrow" className="h-3 w-2.5" />
        </span>
      </button>
    </section>
  )
}

function LocationTag({ away, label, accent }: { away: boolean; label: string; accent: string }) {
  return (
    <>
      {away && (
        <span className="shrink-0 rounded-[3px] px-1 py-px text-[10px] text-ink" style={{ background: accent }}>
          EVENT
        </span>
      )}
      {label}
    </>
  )
}
