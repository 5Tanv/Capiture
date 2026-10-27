import { chapterOf, type CampaignRun } from '../campaign/run'
import type { LifeId } from '../types/game'

// Lives open in order: each one unlocks when the life before it has finished chapter 1.

export const chapterOneDone = (run: CampaignRun) => run.finished || chapterOf(run.index) >= 2

export function lifeUnlocked(runs: Record<LifeId, CampaignRun>, order: readonly LifeId[], id: LifeId): boolean {
  const i = order.indexOf(id)
  return i <= 0 || chapterOneDone(runs[order[i - 1]])
}

/** The life whose chapter 1 opens `id`, or null for the first life. */
export const unlockedBy = (order: readonly LifeId[], id: LifeId): LifeId | null => order[order.indexOf(id) - 1] ?? null
