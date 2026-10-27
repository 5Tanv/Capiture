import { useEffect } from 'react'
import { DuelDialog } from '../components/compete/DuelDialog'
import { RivalPortrait, RivalTag, YouPortrait, YouTag } from '../components/compete/parts'
import { useDuel } from '../components/compete/useDuel'
import { Icon } from '../components/ui/Icon'
import { currentLeague, daysUntilReset, DUEL_QUESTIONS, DUEL_SECONDS, leagueStore, XP_PER_CORRECT } from '../lib/league'
import { useGame } from '../state/GameProvider'

/** The knowledge arena lobby: start a duel, see the weekly league. Duels run in an overlay. */
export function CompeteScreen() {
  const { account } = useGame()
  useEffect(() => {
    currentLeague()
  }, [])
  const league = leagueStore.use()
  const ctl = useDuel()
  const rows = [
    { key: 'me', name: account.username, xp: league.myXp, you: true },
    { key: 'rival', name: league.rival.name, xp: league.rivalXp, you: false },
  ].sort((a, b) => b.xp - a.xp || Number(b.you) - Number(a.you))
  const myRank = rows.findIndex((r) => r.you) + 1
  const last = league.duels[league.duels.length - 1]
  const reset = daysUntilReset()

  return (
    <div className="arena mx-auto flex w-full max-w-[1000px] flex-col gap-8 px-4 pt-6 pb-10 lg:px-6">
      <header className="arena-frame flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Icon name="bolt" className="h-12 w-12 shrink-0" />
          <div className="min-w-0">
            <p className="font-pixel text-[12px] tracking-wide text-brass-400">THE KNOWLEDGE ARENA</p>
            <h1 className="txt-game text-[32px] leading-none">Compete</h1>
          </div>
        </div>
        <dl className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <Stat icon="trophy" label="Your rank" value={`#${myRank} of ${rows.length}`} />
          <Stat icon="xp" label="This week" value={`${league.myXp.toLocaleString()} XP`} />
          <Stat icon="hourglass" label="Resets in" value={`${reset} ${reset === 1 ? 'day' : 'days'}`} />
        </dl>
      </header>

      <section aria-labelledby="duel-h" className="arena-frame arena-frame-gold relative overflow-hidden p-5 sm:p-8">
        <Icon name="star" className="pointer-events-none absolute top-4 right-5 h-5 w-5 opacity-50" />
        <Icon name="star" className="pointer-events-none absolute right-12 bottom-5 h-4 w-4 opacity-30" />
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-4">
            <h2 id="duel-h" className="txt-game text-[30px] leading-none">
              Start a duel
            </h2>
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <YouPortrait className="h-14 w-14 sm:h-16 sm:w-16" />
              <span className="txt-game text-[22px] text-brass-400" aria-label="versus">
                VS
              </span>
              <RivalPortrait rival={league.rival} className="h-14 w-14 sm:h-16 sm:w-16" />
              <div className="min-w-0">
                <p className="txt-game-sm truncate text-[19px]" title={league.rival.name}>
                  {league.rival.name}
                </p>
                <RivalTag className="mt-1 inline-block" />
              </div>
            </div>
            <p className="text-[15px] leading-relaxed font-semibold text-[var(--ar-mute)]">
              This week&rsquo;s opponent is played by the game. Beat their score with what you know: only knowledge counts here, never how rich a life is.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ul className="grid gap-2 text-[15px] font-bold">
              <li className="flex items-center gap-3">
                <Icon name="target" className="h-6 w-6 shrink-0" />
                {DUEL_QUESTIONS} questions from different topics
              </li>
              <li className="flex items-center gap-3">
                <Icon name="hourglass" className="h-6 w-6 shrink-0" />
                {DUEL_SECONDS} seconds, starting when you&rsquo;re ready
              </li>
              <li className="flex items-center gap-3">
                <Icon name="xp" className="h-6 w-6 shrink-0" />+{XP_PER_CORRECT} league XP per right answer
              </li>
            </ul>
            <button type="button" onClick={ctl.open} className="btn-3d btn-gold btn-shine min-h-16 gap-3 px-8" data-start-duel>
              <Icon name="bolt" className="h-7 w-7" />
              <span className="txt-game text-[24px] leading-none">START DUEL</span>
            </button>
            {last && (
              <p className="text-center text-[14px] font-bold text-[var(--ar-mute)]" data-last-duel>
                Last duel: you {last.mine} right, {league.rival.name} {last.theirs} right.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="league-h" className="arena-frame flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-3">
            <Icon name="trophy" className="h-9 w-9" />
            <h2 id="league-h" className="txt-game-sm text-[24px] leading-none">
              Weekly League
            </h2>
          </div>
          <p className="text-[13px] font-bold text-[var(--ar-mute)]">
            Week of {new Date(`${league.week}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · resets Monday · XP comes only from duels
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const other = rows[1 - i]
            const gap = r.xp - other.xp
            const standing = gap > 0 ? `Leads by ${gap.toLocaleString()} XP` : gap < 0 ? `${(-gap).toLocaleString()} XP behind` : 'Level on XP'
            return (
              <li
                key={r.key}
                className={`grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-3 sm:gap-4 sm:px-4 ${r.you ? 'bg-brass-500/15 shadow-[0_0_0_3px_var(--color-brass-500)]' : 'arena-well'}`}
                aria-current={r.you ? 'true' : undefined}
                data-league-row={r.key}
              >
                <span className={`grid h-9 w-9 place-items-center font-display text-[20px] sm:h-10 sm:w-10 sm:text-[22px] ${i === 0 ? 'bg-brass-500 text-ink' : 'bg-[var(--ar-high)]'}`} aria-label={`Rank ${i + 1}`}>
                  {i + 1}
                </span>
                {r.you ? <YouPortrait className="h-11 w-11 sm:h-12 sm:w-12" /> : <RivalPortrait rival={league.rival} className="h-11 w-11 sm:h-12 sm:w-12" />}
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-2">
                    <span className="txt-game-sm truncate text-[16px] sm:text-[18px]" title={r.name}>
                      {r.name}
                    </span>
                    {r.you ? <YouTag className="inline-block shrink-0" /> : <RivalTag className="hidden shrink-0 sm:inline-block" />}
                  </p>
                  <p className="mt-0.5 text-[13px] font-bold text-[var(--ar-mute)]">
                    {!r.you && <span className="sm:hidden">Computer rival · </span>}
                    {standing}
                  </p>
                </div>
                <p className="text-right">
                  <span className="font-display text-[20px] leading-none tabular-nums sm:text-[24px]">{r.xp.toLocaleString()}</span>
                  <span className="ml-1 text-[12px] sm:text-[13px] font-bold text-[var(--ar-teal)]">XP</span>
                </p>
              </li>
            )
          })}
        </ol>
        <p className="text-[13px] font-semibold text-[var(--ar-mute)]">
          This week&rsquo;s league is you against one computer rival. Every duel adds {XP_PER_CORRECT} XP per right answer to each side.
        </p>
      </section>

      <DuelDialog ctl={ctl} />
    </div>
  )
}

function Stat({ icon, label, value }: { icon: 'trophy' | 'xp' | 'hourglass'; label: string; value: string }) {
  return (
    <div className="arena-well flex min-w-0 items-center gap-2 px-3 py-2">
      <Icon name={icon} className="hidden h-6 w-6 shrink-0 sm:block" />
      <div>
        <dt className="text-[11px] leading-none font-extrabold tracking-wide text-[var(--ar-mute)] uppercase">{label}</dt>
        <dd className="mt-1 text-[15px] leading-none font-extrabold tabular-nums">{value}</dd>
      </div>
    </div>
  )
}
