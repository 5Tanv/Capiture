import { useState } from 'react'
import { formatMoney, formatMoneyExact, formatMoneyShort } from '../../lib/format'
import { useCountUp } from '../../lib/useCountUp'
import { useGameDispatch } from '../../state/GameProvider'
import type { LifeSim } from '../../types/game'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import type { IconName } from '../world/sprites'
import { Portrait } from './Portrait'

function Money({ icon, label, value, tone, exact }: { icon: IconName; label: string; value: number; tone: string; exact?: boolean }) {
  const shown = useCountUp(value)
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-1 py-1.5">
      <span className="flex items-center gap-1 text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
        <Icon name={icon} className="h-4 w-4" />
        {label}
      </span>
      <span className={`font-display text-xl leading-tight tabular-nums ${tone}`}>{exact && Math.abs(shown) < 10000 ? formatMoneyExact(shown) : exact ? formatMoneyShort(shown) : formatMoney(shown)}</span>
    </div>
  )
}

function Meter({ label, full, value, max, display, fill }: { label: string; full?: string; value: number; max: number; display: string; fill: string }) {
  return (
    <div className="grid grid-cols-[4.75rem_1fr_2.75rem] items-center gap-2">
      <span className="text-[13px] font-bold text-ink-soft" title={full}>{label}</span>
      <ProgressBar value={value} max={max} fill={fill} className="h-3" label={full ?? label} />
      <span className="text-right text-[13px] font-extrabold tabular-nums">{display}</span>
    </div>
  )
}

/** The life's own record: who they are, their money, and their situation. */
export function LifeCard({ life }: { life: LifeSim }) {
  const dispatch = useGameDispatch()
  const [open, setOpen] = useState(false)
  const { chapter, stats } = life
  const started = chapter.eventIndex > 0

  return (
    <article className="surface-reading life-stripe flex flex-col overflow-hidden" aria-label={`${life.name}'s life`}>
      <header className="flex items-center gap-3 px-3.5 pt-4 pb-2.5">
        <Portrait lifeId={life.id} worldId={life.worldId} className="h-14 w-14 shrink-0 rounded-[10px] border-2 border-ink" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-[22px] leading-tight text-ink">{life.name}</h2>
          <p className="text-[13px] font-bold text-ink-soft">
            {life.archetype} · Age {life.age}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'openCreator', target: life.id })}
          className="btn-3d btn-parch h-10 shrink-0 gap-1.5 rounded-[10px] px-2.5 text-[13px] font-extrabold [--lip:3px]"
          aria-label={`Edit ${life.name.split(' ')[0]}'s look`}
        >
          <Icon name="hanger" className="h-5 w-5" />
          <span className="hidden sm:inline">Look</span>
        </button>
      </header>

      {/* the life's money: green up, red owed, never FiCoins */}
      <div className="mx-3.5 grid grid-cols-3 divide-x-2 divide-dashed divide-parch-300 rounded-[10px] border-2 border-parch-300 bg-parch-100">
        <Money icon="cash" label={life.id === 'entrepreneur' ? 'Studio' : 'Checking'} value={life.cash} tone="text-cash-700" exact />
        <Money icon="bill" label="Owed" value={life.debt} tone="text-ember-700" exact />
        <Money icon="gem" label="Saved+" value={life.assets} tone="text-ink" exact />
      </div>

      <div className="px-3.5 pt-3 pb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="font-display min-w-0 flex-1 truncate text-[17px] leading-snug text-ink">
            Ch. {chapter.number}: {chapter.title}
          </h3>
          <span className="shrink-0 text-[13px] font-extrabold text-ink-soft tabular-nums">
            {started ? `${chapter.eventIndex} of ${chapter.eventTotal}` : 'Not started'}
          </span>
        </div>
        <ProgressBar value={chapter.eventIndex} max={chapter.eventTotal} fill="bg-brass-500" className="mt-1.5 h-3" label="Chapter progress" />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-3 flex w-full items-center justify-between rounded-[8px] py-1 text-[13px] font-extrabold text-ink-soft lg:hidden"
        >
          Situation and wellbeing
          <Icon name="arrow" className={`h-3.5 w-3 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
        </button>
        <div className={`${open ? 'block' : 'hidden'} lg:block`}>
          <p className="mt-2.5 text-[14px] leading-snug font-semibold text-ink-soft">{life.situation}</p>
          <div className="mt-3 flex flex-col gap-1.5 border-t-2 border-dashed border-parch-300 pt-2.5">
            <Meter label="Happiness" value={stats.happiness} max={100} display={`${stats.happiness}%`} fill="bg-[#e98aa6]" />
            <Meter label="Stress" value={stats.stress} max={100} display={`${stats.stress}%`} fill="bg-[#9a86c4]" />
            {stats.third ? (
              <Meter label={stats.third.short} full={stats.third.label} value={stats.third.value} max={100} display={`${stats.third.value}%`} fill="bg-xp-500" />
            ) : (
              <Meter
                label="Credit"
                value={stats.credit === null ? 0 : stats.credit - 300}
                max={550}
                display={stats.credit === null ? 'None' : String(stats.credit)}
                fill="bg-cash-500"
              />
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
