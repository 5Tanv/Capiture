import type { EventDef } from '../campaign/types'
import type { SceneId } from '../types/game'
import type { NpcId } from './npcs'

// Where each campaign event is drawn. The college story has recurring people who
// step into the scene when it names them; the other lives' scenes are about the
// protagonist alone, so no one is added who isn't in the story.

const NPC_NAMES: [NpcId, RegExp][] = [
  ['alex', /\bAlex\b/],
  ['sam', /\bSam\b/],
  ['morgan', /\bMorgan\b/],
  ['rivera', /\bRivera\b/],
]

const HOME_SCENE: Record<EventDef['role'], SceneId> = { college: 'campus', adult: 'suburb', business: 'city', athlete: 'arena' }

export function eventScene(ev: EventDef): { sceneId: SceneId; npcs: NpcId[] } {
  if (ev.role !== 'college') return { sceneId: HOME_SCENE[ev.role], npcs: [] }
  const text = ev.scenario
  const sceneId: SceneId = /\b(dorm|room|roommate|apartment|laundry|bags)\b/i.test(text) ? 'dorm' : 'campus'
  const named = NPC_NAMES.map(([id, re]) => ({ id, at: text.search(re) }))
    .filter((n) => n.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((n) => n.id)
  return { sceneId, npcs: named.slice(0, 1) }
}
