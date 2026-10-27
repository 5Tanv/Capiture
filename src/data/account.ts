import { accountPreset } from '../sprites/catalog'
import type { PlayerAccount } from '../types/game'

// Sample account for the homepage demo.
export const sampleAccount: PlayerAccount = {
  username: 'Capiture',
  title: 'Budget Apprentice',
  knowledgeLevel: 1,
  xp: 0,
  xpToNext: 500,
  fiCoins: 250,
  streakDays: 6,
  lessonsCompleted: 18,
  dailyChallenge: { topic: 'Budgeting Basics', answered: 3, total: 5, rewardCoins: 25 },
  nextCosmetic: { name: 'Graduation Cap', unlockLevel: 8 },
  mastery: { topic: 'Budgeting', percent: 42 },
  badges: [
    { id: 'first-budget', name: 'First Budget', description: 'Built a monthly budget from scratch.' },
    { id: 'interest', name: 'Interest Explorer', description: 'Finished the compound interest unit.' },
    { id: 'week', name: 'Week of Learning', description: 'Kept a 7-day learning streak.' },
  ],
  accessories: ['Round Glasses', 'Teal Cap'],
  appearance: accountPreset,
}
