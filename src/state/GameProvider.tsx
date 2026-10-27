import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import type { RoleNames } from '../campaign/names'
import { roleOfLife } from '../campaign/roles'
import { createRun, type CampaignRun } from '../campaign/run'
import { newSeed } from '../campaign/selection'
import { lifeOrder } from '../data/lives'
import { loadSaved, readStoredProgress, writeSaved } from '../lib/saveStore'
import { tabFromHash } from '../lib/tabHash'
import { markOnboardingSeen, markTutorialSeen, onboardingSeen, tutorialSeen } from '../lib/tutorialStore'
import type { LifeId } from '../types/game'
import { gameReducer, initialState, syncLives, type GameAction, type GameState } from './gameReducer'

const GameStateContext = createContext<GameState | null>(null)
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  // Start on the tab named in the URL, so a refresh keeps the player where they were.
  // First-time players always begin on Home with the tour.
  // A new player meets their first character in the creator, then takes the tour.
  const [state, dispatch] = useReducer(gameReducer, initialState, (s) => {
    const seen = tutorialSeen()
    // Players who finished the old tour before the welcome tour existed count as onboarded.
    const onboarded = seen || onboardingSeen()
    const { lives, account, coinBase, mastery, runs, shop } = loadSaved(s.lives, s.account)
    const creator = lives.freshman.customized || !onboarded ? null : { target: 'freshman' as const, firstTime: true }
    // Each run is created once with its own seed and then always loaded, never rerolled.
    const allRuns = Object.fromEntries(lifeOrder.map((id) => [id, runs[id] ?? createRun(roleOfLife[id], newSeed())])) as Record<LifeId, CampaignRun>
    return syncLives({
      ...s,
      lives,
      account,
      coinBase,
      mastery,
      shop,
      runs: allRuns,
      creator,
      tab: seen ? tabFromHash(window.location.hash) : 'home',
      tutorial: { step: onboarded && !seen ? 0 : null, rewarded: false },
      onboarding: { step: onboarded ? null : 0 },
    })
  })
  useEffect(() => {
    if (state.onboarding.step === null) markOnboardingSeen()
    if (state.onboarding.step === null && state.tutorial.step === null) markTutorialSeen()
  }, [state.onboarding.step, state.tutorial.step])
  useEffect(() => {
    writeSaved(state.lives, state.account, state.coinBase, state.mastery, state.runs, state.shop)
  }, [state.lives, state.account, state.coinBase, state.mastery, state.runs, state.shop])
  // Another open tab saved: merge its receipts and adopt any run it has advanced further.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'filife.save.v3') return
      const stored = readStoredProgress()
      if (stored) dispatch({ type: 'syncStorage', mastery: stored.mastery, runs: stored.runs, shop: stored.shop })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  )
}

export function useGame() {
  const state = useContext(GameStateContext)
  if (!state) throw new Error('useGame must be used inside <GameProvider>')
  return state
}

export function useGameDispatch() {
  const dispatch = useContext(GameDispatchContext)
  if (!dispatch) throw new Error('useGameDispatch must be used inside <GameProvider>')
  return dispatch
}

export function useActiveLife() {
  const state = useGame()
  return state.lives[state.activeLifeId]
}

/** The active life's campaign run and the player's learning progress. */
export function useCampaign() {
  const state = useGame()
  return { run: state.runs[state.activeLifeId], mastery: state.mastery }
}

/** Every protagonist's current display name, for the {xxxName} tokens. */
export function useRoleNames(): RoleNames {
  const { lives } = useGame()
  return useMemo(
    () => ({ college: lives.freshman.name, adult: lives.professional.name, business: lives.entrepreneur.name, athlete: lives.athlete.name }),
    [lives.freshman.name, lives.professional.name, lives.entrepreneur.name, lives.athlete.name],
  )
}
