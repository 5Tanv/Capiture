import { useGame, useGameDispatch } from '../../state/GameProvider'
import type { TabId } from '../../types/game'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import { DAILY_COINS, useDaily } from '../../lib/daily'
import { ActivityCard } from './ActivityCard'
import { SavingsGoalSlot } from './SavingsGoalSlot'

const art = 'h-full w-full'

/** Account progression, kept visually below the life: learning, streak, savings goal, mastery. */
export function ProgressSlots({ className = '' }: { className?: string }) {
  const { account } = useGame()
  const dispatch = useGameDispatch()
  const go = (tab: TabId) => () => dispatch({ type: 'setTab', tab })
  const { mastery } = account
  const daily = useDaily()
  const dailyDone = daily.total > 0 && daily.answered >= daily.total
  const mastered = mastery.percent >= 100

  return (
    // The query container lets the row pick 4, 2 or 1 columns from the space it actually has.
    <section aria-label="Learning progress" className={`activity-tray @container p-3 ${className}`}>
      <div className="grid grid-cols-1 gap-3.5 @min-[18rem]:grid-cols-2 @min-[38rem]:grid-cols-4">
        <ActivityCard
          accent="blue"
          ribbon={`${daily.answered}/${daily.total} answered`}
          art={<Icon name="target" className={art} />}
          title="Daily Challenge"
          action={dailyDone ? 'Review answers' : daily.answered > 0 ? 'Continue challenge' : 'Open challenge'}
          done={dailyDone}
          onClick={go('learn')}
        >
          {dailyDone ? (
            `${daily.correct} correct today`
          ) : (
            <>
              <span>{daily.total} questions</span>
              <span className="flex items-center gap-1">
                +{DAILY_COINS}
                <Icon name="coin" className="h-3.5 w-3.5" label="FiCoins" />
                each
              </span>
            </>
          )}
        </ActivityCard>
        <ActivityCard
          accent="orange"
          ribbon={`${daily.streak}-day streak`}
          art={<Icon name="flame" className={art} />}
          title="Keep It Lit"
          action="View streak"
          done={daily.litToday}
          onClick={go('learn')}
        >
          {daily.litToday ? 'Lit today' : 'Open the app to light it'}
        </ActivityCard>
        <SavingsGoalSlot />
        <ActivityCard
          accent="emerald"
          ribbon={`${mastery.percent}% mastered`}
          art={<Icon name="shield" className={art} />}
          title={mastery.topic}
          action={mastered ? 'Review topic' : 'Continue learning'}
          done={mastered}
          onClick={go('learn')}
        >
          <ProgressBar value={mastery.percent} max={100} fill="bg-cash-500" className="h-2.5 w-[80%]" label={`${mastery.topic} mastery`} />
          Topic mastery
        </ActivityCard>
      </div>
    </section>
  )
}
