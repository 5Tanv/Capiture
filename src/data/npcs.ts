import { accountPreset, type Appearance } from '../sprites/catalog'
import type { SceneId } from '../types/game'

/**
 * Supporting characters. A scene never draws one on its own: an event names the
 * NPCs that belong in its moment (data/eventScenes.ts), and each NPC lists the scenes
 * where it genuinely belongs. Every look here is authored, never randomized.
 */
export type NpcId = 'teammate' | 'cafe-buyer' | 'alex' | 'sam' | 'morgan' | 'rivera'

export interface Npc {
  id: NpcId
  name: string
  /** Narrative role, shown on the small tag beside them. */
  role: string
  /** Scenes this character can appear in. Anywhere else, they are not drawn. */
  scenes: SceneId[]
  appearance: Appearance
}

const base: Appearance = { ...accountPreset, hat: 'none', glasses: 'none', pack: 'none', watch: 'none' }

export const npcs: Record<NpcId, Npc> = {
  // A fellow rookie in the same colors, there for "your teammates are already talking about cars".
  teammate: {
    id: 'teammate',
    name: 'Jaylen',
    role: 'Teammate',
    scenes: ['arena'],
    appearance: {
      ...base,
      skin: 'brown', eyes: 'round', eyeColor: 'umber', detail: 'none',
      hair: 'buzz', hairColor: 'black',
      top: 'jersey', topColor: 'navy', topAccent: 'mustard',
      bottom: 'athletic', bottomColor: 'navy', shoes: 'hightops', shoeColor: 'cream',
    },
  },
  // The café chain's buyer, in person to talk about the 400-mug order.
  'cafe-buyer': {
    id: 'cafe-buyer',
    name: 'Mr. Okafor',
    role: 'Café buyer',
    scenes: ['city'],
    appearance: {
      ...base,
      skin: 'deep', eyes: 'sleepy', eyeColor: 'umber', detail: 'none',
      hair: 'crop', hairColor: 'black',
      top: 'jacket', topColor: 'forest', topAccent: 'cream',
      bottom: 'slacks', bottomColor: 'khaki', shoes: 'loafers', shoeColor: 'cocoa',
    },
  },
  // The college campaign's people. Each one is only drawn when an event names them.
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'Roommate',
    scenes: ['dorm', 'campus'],
    appearance: {
      ...base,
      skin: 'olive', eyes: 'wide', eyeColor: 'hazel', detail: 'none',
      hair: 'curls', hairColor: 'black',
      top: 'tee', topColor: 'mustard', topAccent: 'cream',
      bottom: 'joggers', bottomColor: 'charcoal', shoes: 'sneakers', shoeColor: 'white',
    },
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    role: 'Friend',
    scenes: ['campus', 'dorm'],
    appearance: {
      ...base,
      skin: 'deep', eyes: 'happy', eyeColor: 'umber', detail: 'none',
      hair: 'braids', hairColor: 'espresso',
      top: 'sweater', topColor: 'plum', topAccent: 'cream',
      bottom: 'jeans', bottomColor: 'denim', shoes: 'boots', shoeColor: 'cocoa',
    },
  },
  morgan: {
    id: 'morgan',
    name: 'Morgan',
    role: 'Supervisor',
    scenes: ['campus'],
    appearance: {
      ...base,
      skin: 'fair', eyes: 'sleepy', eyeColor: 'gray', detail: 'none',
      hair: 'ponytail', hairColor: 'honey',
      top: 'shirt', topColor: 'teal', topAccent: 'white',
      bottom: 'slacks', bottomColor: 'navy', shoes: 'loafers', shoeColor: 'charcoal',
      watch: 'watch',
    },
  },
  rivera: {
    id: 'rivera',
    name: 'Prof. Rivera',
    role: 'Mentor',
    scenes: ['campus'],
    appearance: {
      ...base,
      skin: 'tan', eyes: 'round', eyeColor: 'umber', detail: 'none',
      hair: 'sidepart', hairColor: 'silver',
      top: 'blazer', topColor: 'cocoa', topAccent: 'cream',
      bottom: 'slacks', bottomColor: 'khaki', shoes: 'loafers', shoeColor: 'cocoa',
      glasses: 'square',
    },
  },
}
