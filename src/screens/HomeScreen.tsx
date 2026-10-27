import { CharacterSelect } from '../components/lobby/CharacterSelect'
import { LifeCard } from '../components/lobby/LifeCard'
import { LifeLog } from '../components/lobby/LifeLog'
import { NextEventButton } from '../components/lobby/NextEventButton'
import { ProgressSlots } from '../components/lobby/ProgressSlots'
import { WorldStage } from '../components/world/WorldStage'
import { currentEventDef } from '../campaign/engine'
import { getEvent } from '../campaign/content'
import { eventScene } from '../data/eventScenes'
import { lifeUnlocked, unlockedBy } from '../lib/unlock'
import { useActiveLife, useCampaign, useGame, useGameDispatch } from '../state/GameProvider'

/**
 * The lobby: pick a life, see their world, play the next event.
 *
 * Priority, in reading order at every size: the world, the primary action, the
 * life's money and stats, then account progress and the log. The page scrolls
 * normally; nothing below the action may squeeze the world.
 *   < lg   one column, compact life switcher under the action
 *   lg     world column + record column (≥ 630px for the world at 1024)
 *   xl     adds the tall lives rail once the world column can spare it
 */
export function HomeScreen({ reactKey }: { reactKey: number }) {
  const life = useActiveLife()
  const { history, eventOpen, runs, lifeOrder, lives } = useGame()
  const prevId = lifeUnlocked(runs, lifeOrder, life.id) ? null : unlockedBy(lifeOrder, life.id)
  const { run } = useCampaign()
  // While an event is open, the world shows where it happens.
  const next = run.current ? getEvent(run.current.eventId) : currentEventDef(run)
  const where = next ? eventScene(next) : { sceneId: life.worldId, npcs: [] }
  const sceneId = eventOpen ? where.sceneId : life.worldId
  const npcIds = eventOpen ? where.npcs : undefined
  const dispatch = useGameDispatch()
  const play = () => dispatch({ type: 'openEvent' })
  const openRoad = () => dispatch({ type: 'setTab', tab: 'life' })

  return (
    <div className="mx-auto grid w-full max-w-[1480px] grid-cols-[minmax(0,1fr)] items-start gap-5 px-4 pt-4 pb-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 lg:px-6 lg:pt-5 short:pt-3 xl:grid-cols-[9.5rem_minmax(0,1fr)_22rem] 2xl:grid-cols-[10rem_minmax(0,1fr)_24rem]">
      {/* Lives rail (wide desktop) */}
      <aside className="surface-rail hidden flex-col items-center gap-3 self-start py-4 pr-2 pl-5 xl:flex" aria-label="Your lives">
        <h2 className="txt-game-sm text-[15px]">Your Lives</h2>
        <CharacterSelect layout="rail" />
      </aside>

      {/* Stage, action, progression */}
      <div className="flex min-w-0 flex-col gap-4 short:gap-3">
        <WorldStage life={life} sceneId={sceneId} npcs={npcIds} reactKey={reactKey} onOpenRoad={openRoad} />
        <NextEventButton
          life={life}
          onPlay={play}
          onOpenRoad={openRoad}
          nextTitle={next?.title}
          resuming={Boolean(run.current || run.pause)}
          campaignDone={run.finished}
          lockedBy={prevId ? lives[prevId].archetype : undefined}
        />
        <div className="xl:hidden">
          <h2 className="sr-only">Your lives</h2>
          <CharacterSelect layout="strip" />
        </div>
        <ProgressSlots className="mt-3 hidden lg:block" />
      </div>

      {/* Life record: stats first; on small screens account progress follows, then the log */}
      <div className="flex min-w-0 flex-col gap-4 md:grid md:grid-cols-2 md:items-start lg:flex lg:items-stretch">
        <LifeCard life={life} />
        <ProgressSlots className="mt-2 md:order-last md:col-span-2 lg:hidden" />
        <LifeLog events={history[life.id]} onOpenRoad={openRoad} />
      </div>
    </div>
  )
}
