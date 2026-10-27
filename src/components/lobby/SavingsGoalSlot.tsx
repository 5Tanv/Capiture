import type { ReactNode } from 'react'
import { formatNumber } from '../../lib/format'
import { goalStatus } from '../../lib/shopStore'
import { useShopView } from '../../lib/useShop'
import { Thumb } from '../../screens/ShopScreen'
import { useGameDispatch } from '../../state/GameProvider'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import { ActivityCard } from './ActivityCard'

/** Home card for the FiCoin savings goal. Reads the live catalog and real balance; never spends. */
export function SavingsGoalSlot() {
  const { account, shop, owned, look } = useShopView()
  const dispatch = useGameDispatch()
  const status = goalStatus(shop.goalId, owned, account.fiCoins)
  const coins = account.fiCoins
  const open = (itemId: string | null) => () => dispatch({ type: 'openShopItem', itemId })
  // Collected or retired goals end here: clear it and go pick the next one.
  const chooseNext = () => {
    dispatch({ type: 'shopGoal', itemId: null })
    dispatch({ type: 'openShopItem', itemId: null })
  }

  switch (status.kind) {
    case 'none':
      return (
        <ActivityCard accent="gold" ribbon="Savings goal" art={<Icon name="bag" className="h-full w-full" />} title="Choose your next reward"
          action="Pick a goal" label="Choose your next reward. Pick a savings goal in the shop" onClick={open(null)}>
          Save FiCoins toward a cosmetic
        </ActivityCard>
      )
    case 'unavailable':
      return (
        <ActivityCard accent="red" ribbon="Goal unavailable"
          art={status.item ? <Framed dim><Thumb item={status.item} look={look} /></Framed> : <Icon name="lock" className="h-full w-full" />}
          title={status.item?.name ?? 'Item retired'} action="Choose another"
          label={`${status.item?.name ?? 'Your goal item'} is no longer sold. Choose another goal`} onClick={chooseNext}>
          No longer in the shop
        </ActivityCard>
      )
    case 'collected':
      return (
        <ActivityCard accent="gold" ribbon="Goal collected!" done art={<Framed><Thumb item={status.item} look={look} /></Framed>}
          title={status.item.name} action="Choose next goal"
          label={`Goal collected: you own ${status.item.name}. Choose next goal`} onClick={chooseNext}>
          It&rsquo;s in your collection
        </ActivityCard>
      )
    case 'reached':
    case 'saving': {
      const { item } = status
      const reached = status.kind === 'reached'
      return (
        <ActivityCard accent="gold" ribbon={reached ? 'Goal reached!' : 'Savings goal'} art={<Framed><Thumb item={item} look={look} /></Framed>}
          title={item.name} action={reached ? 'View in Shop' : 'Open in Shop'} strongAction={reached}
          label={
            reached
              ? `Goal reached: ${item.name}. You have ${formatNumber(coins)} of ${formatNumber(item.price)} FiCoins. View in Shop`
              : `Savings goal ${item.name}: ${formatNumber(coins)} of ${formatNumber(item.price)} FiCoins, ${formatNumber(status.remaining)} to go. Open in Shop`
          }
          onClick={open(item.id)}>
          <ProgressBar value={Math.min(coins, item.price)} max={item.price} fill={reached ? 'bg-cash-500' : 'bg-brass-400'} className="h-2.5 w-[80%]"
            label={`${item.name} savings progress`} />
          <span className="flex items-center gap-1 tabular-nums">
            {formatNumber(coins)} / {formatNumber(item.price)}
            <Icon name="coin" className="h-3.5 w-3.5" label="FiCoins" />
          </span>
          {!reached && <span className="text-brass-400">{formatNumber(status.remaining)} to go</span>}
        </ActivityCard>
      )
    }
  }
}

/** A small window onto the item's real shop thumbnail. */
function Framed({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return (
    <span className={`block h-full w-full overflow-hidden rounded-[7px] border-2 border-ink ${dim ? 'opacity-60 grayscale' : ''}`}>{children}</span>
  )
}
