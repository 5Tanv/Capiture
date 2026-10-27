// The universal Capiture account and the four life simulations are deliberately
// separate types. Nothing a life earns can flow into the account's FiCoins.

import type { Appearance } from '../sprites/catalog'

export type TabId = 'home' | 'life' | 'learn' | 'compete' | 'shop' | 'profile' | 'showcase'

export type LifeId = 'freshman' | 'professional' | 'entrepreneur' | 'athlete'

export type WorldId = 'campus' | 'suburb' | 'city' | 'arena'

export interface Badge {
  id: string
  name: string
  description: string
}

/** Owned by the player. Earned through learning, practice, and competition. */
export interface PlayerAccount {
  username: string
  title: string
  knowledgeLevel: number
  xp: number
  xpToNext: number
  fiCoins: number
  streakDays: number
  lessonsCompleted: number
  dailyChallenge: { topic: string; answered: number; total: number; rewardCoins: number }
  nextCosmetic: { name: string; unlockLevel: number }
  mastery: { topic: string; percent: number }
  badges: Badge[]
  accessories: string[]
  /** The player's own avatar, separate from every life's character. */
  appearance: Appearance
}

export interface LifeStats {
  /** 0–100 */
  happiness: number
  /** 0–100 */
  stress: number
  /** 300–850, or null before any credit history exists */
  credit: number | null
  /** 0–100. Each campaign life's third stat (Academic Standing, Job Performance, ...). */
  third?: { label: string; short: string; value: number }
}

export interface Chapter {
  number: number
  title: string
  /** Events completed in this chapter. 0 means the chapter has not started. */
  eventIndex: number
  eventTotal: number
}

/** Owned by one simulated life. Money here is the character's, never the player's. */
export interface LifeSim {
  id: LifeId
  name: string
  archetype: string
  age: number
  worldId: WorldId
  worldLabel: string
  cash: number
  debt: number
  assets: number
  stats: LifeStats
  chapter: Chapter
  situation: string
  unlocks: string[]
  /** This life's character. Each life keeps its own look and name. */
  appearance: Appearance
  /** The player has made this character their own (shown the creator once). */
  customized: boolean
}

/** Reusable locations. Events point at one; the stage draws it. */
export type SceneId = 'campus' | 'dorm' | 'suburb' | 'city' | 'arena'
