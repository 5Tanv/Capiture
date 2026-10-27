import { ROLES } from '../campaign/roles'
import { lifePresets } from '../sprites/catalog'
import type { LifeId, LifeSim } from '../types/game'

export const lifeOrder: LifeId[] = ['freshman', 'professional', 'entrepreneur', 'athlete']

// The four lives. Names start as neutral role labels until the player chooses
// one. Money, stats and chapter progress are placeholders here: each life's
// campaign run (src/campaign) supplies the real values.
const base = (id: LifeId, role: keyof typeof ROLES, worldId: LifeSim['worldId'], worldLabel: string, age: number, unlocks: string[]): LifeSim => {
  const spec = ROLES[role]
  return {
    id,
    name: spec.defaultName,
    archetype: spec.title,
    age,
    worldId,
    worldLabel,
    cash: (spec.initialAccounts[spec.primaryAccount] ?? 0) / 100,
    debt: 0,
    assets: 0,
    stats: { happiness: spec.initialStats.happiness ?? 0, stress: spec.initialStats.stress ?? 0, credit: null },
    chapter: { number: 1, title: spec.chapters[0], eventIndex: 0, eventTotal: 15 },
    situation: '',
    unlocks,
    appearance: lifePresets[id],
    customized: false,
  }
}

export const sampleLives: Record<LifeId, LifeSim> = {
  freshman: base('freshman', 'college', 'campus', 'Maple Hall · Riverbend State', 18, ['Dorm Room', 'Campus Bike']),
  professional: base('professional', 'adult', 'suburb', 'Linden Street · Oakview', 38, ['Sedan', 'Home Office']),
  entrepreneur: base('entrepreneur', 'business', 'city', 'The Studio · Harbor City', 29, ['Studio Lease', 'Print Shop Contact']),
  athlete: base('athlete', 'athlete', 'arena', 'Summit Arena · Rivertown', 22, []),
}
