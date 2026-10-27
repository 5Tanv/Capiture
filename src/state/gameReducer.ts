import { lessonsById } from '../campaign/content'
import * as engine from '../campaign/engine'
import { acknowledgeLesson, answerLesson, mergeMastery, totalCoins, type Mastery } from '../campaign/mastery'
import { ROLES, roleOfLife } from '../campaign/roles'
import { createRun, type CampaignRun } from '../campaign/run'
import type { AssetId } from '../campaign/types'
import { sampleAccount } from '../data/account'
import { shopItems, type Slot } from '../data/shop'
import type { RoadEvent } from '../data/chapters'
import { lifeOrder, sampleLives } from '../data/lives'
import { ONBOARDING_FINAL, onboardingSteps } from '../data/onboarding'
import { TUTORIAL_FINAL, TUTORIAL_XP, tourSteps } from '../data/tutorial'
import { cleanName } from '../lib/saveStore'
import { lifeUnlocked } from '../lib/unlock'
import { applyEquip, applyGoal, applyUnequipAll, emptyShop, mergeShop, ownedIds, sameShop, spentCoins, type ShopState } from '../lib/shopStore'
import { guardClothing, lifePresets, accountPreset, type Appearance } from '../sprites/catalog'
import type { LifeId, LifeSim, PlayerAccount, TabId } from '../types/game'
import { lifeView, runHistory } from './lifeView'

export interface TutorialState {
  /** Index into the tour steps; TUTORIAL_FINAL is the closing card, null means no tour. */
  step: number | null
  /** The player earned the finish XP (not on a practice replay). */
  rewarded: boolean
}

export interface OnboardingState {
  /** Index into the welcome tour's steps; null means no welcome tour. */
  step: number | null
}

/** Who the character creator is editing: one life's character, or the account avatar. */
export type CreatorTarget = LifeId | 'account'

export interface CreatorState {
  target: CreatorTarget
  /** First time this life is played: the creator introduces the character. */
  firstTime: boolean
}

export interface GameState {
  /** The player's universal account. Life actions never modify it; FiCoins come from lesson receipts. */
  account: PlayerAccount
  /** Independent lives, each presented from its own campaign run. */
  lives: Record<LifeId, LifeSim>
  history: Record<LifeId, RoadEvent[]>
  lifeOrder: LifeId[]
  activeLifeId: LifeId
  tab: TabId
  eventOpen: boolean
  tutorial: TutorialState
  onboarding: OnboardingState
  creator: CreatorState | null
  /** Each life's campaign run: its money, calendar and story. */
  runs: Record<LifeId, CampaignRun>
  /** FiCoins earned before lesson receipts existed; the balance is this plus receipt coins. */
  coinBase: number
  /** Player-wide lesson mastery and first-answer receipts, shared by Learn and every life. */
  mastery: Mastery
  /** A lesson to open when the Learn tab is shown (lessonId@version). */
  learnFocus: string | null
  /** Cosmetics bought with FiCoins, what is equipped, and the purchase receipts. The balance is earned minus these. */
  shop: ShopState
  /** A shop item to open when the Shop tab is shown. */
  shopFocus: string | null
  /** A life that just unlocked, waiting for the player to go to it. */
  unlockPrompt: LifeId | null
}

/** One step of the active life's campaign. Each maps to a pure engine function. */
export type CampaignOp =
  | { op: 'progress' }
  | { op: 'answer'; questionId: string; option: number; now: number }
  | { op: 'acknowledge'; questionId: string }
  | { op: 'choose'; choiceId: string }
  | { op: 'continue' }
  | { op: 'shortfall'; action: { kind: 'transfer' } | { kind: 'owner' } | { kind: 'sell'; asset: AssetId } | { kind: 'decline' } }
  | { op: 'deadline'; action?: 'resolve' | 'extend' }
  | { op: 'draft'; action: 'revise' | 'keep' }
  | { op: 'item'; itemId: string; action: 'return' | 'renew' }
  | { op: 'recover' }
  | { op: 'checkin' }
  | { op: 'feeFree' }
  | { op: 'summerRole'; role: string }
  | { op: 'summarySeen'; chapter: number }

export type GameAction =
  | { type: 'selectLife'; lifeId: LifeId }
  | { type: 'setTab'; tab: TabId }
  | { type: 'openEvent' }
  | { type: 'closeEvent' }
  | { type: 'tutorialStart' }
  | { type: 'tutorialNext' }
  | { type: 'tutorialSkip' }
  | { type: 'setUsername'; name: string }
  | { type: 'onboardingStart' }
  | { type: 'onboardingGo'; to: number }
  | { type: 'onboardingSkip' }
  | { type: 'onboardingFinish'; adventure: boolean }
  | { type: 'openCreator'; target: CreatorTarget; firstTime?: boolean }
  | { type: 'closeCreator' }
  | { type: 'saveCharacter'; target: CreatorTarget; name?: string; appearance: Appearance }
  | { type: 'campaign'; step: CampaignOp }
  | { type: 'learnAnswer'; lessonId: string; questionId: string; option: number; now: number }
  | { type: 'learnAcknowledge'; lessonId: string; questionId: string }
  | { type: 'openLesson'; lessonKey: string }
  | { type: 'syncStorage'; mastery: Mastery; runs: Partial<Record<LifeId, CampaignRun>>; shop?: ShopState }
  | { type: 'shopEquip'; slot: Slot; itemId: string | null }
  | { type: 'shopUnequipAll' }
  | { type: 'shopGoal'; itemId: string | null }
  | { type: 'openShopItem'; itemId: string | null }
  | { type: 'shopFocusDone' }
  | { type: 'dismissUnlock' }
  | { type: 'goToUnlocked' }
  | { type: 'grantCoins'; amount: number }

const placeholderRuns = Object.fromEntries(lifeOrder.map((id) => [id, createRun(roleOfLife[id], 1)])) as Record<LifeId, CampaignRun>

export const initialState: GameState = {
  account: sampleAccount,
  lives: sampleLives,
  history: { freshman: [], professional: [], entrepreneur: [], athlete: [] },
  lifeOrder,
  activeLifeId: 'freshman',
  tab: 'home',
  eventOpen: false,
  tutorial: { step: null, rewarded: false },
  onboarding: { step: null },
  creator: null,
  // Replaced at startup by the saved runs, or new runs with fresh seeds.
  runs: placeholderRuns,
  coinBase: sampleAccount.fiCoins,
  mastery: {},
  learnFocus: null,
  shop: emptyShop,
  shopFocus: null,
  unlockPrompt: null,
}

/** Present every run through its life, and keep the FiCoin balance equal to its receipts. */
export function syncLives(state: GameState): GameState {
  const lives = { ...state.lives }
  const history = { ...state.history }
  for (const id of lifeOrder) {
    lives[id] = lifeView(state.lives[id], state.runs[id])
    history[id] = runHistory(state.runs[id])
  }
  // Earned FiCoins (lessons) minus what cosmetic purchases cost. Life money never enters this.
  const fiCoins = totalCoins({ coinBase: state.coinBase, mastery: state.mastery }) - spentCoins(state.shop)
  return { ...state, lives, history, account: fiCoins === state.account.fiCoins ? state.account : { ...state.account, fiCoins } }
}

function runStep(ctx: engine.Ctx, s: CampaignOp): engine.Ctx {
  switch (s.op) {
    case 'progress':
      return engine.progress(ctx)
    case 'answer':
      return engine.answerQuestion(ctx, s.questionId, s.option, s.now)
    case 'acknowledge':
      return engine.acknowledgeQuestion(ctx, s.questionId)
    case 'choose':
      return engine.chooseOption(ctx, s.choiceId)
    case 'continue':
      return engine.continueRun(ctx)
    case 'shortfall':
      return engine.resolveShortfall(ctx, s.action)
    case 'deadline':
      return engine.resolveDeadline(ctx, s.action)
    case 'draft':
      return engine.resolveDraft(ctx, s.action)
    case 'item':
      return engine.resolveItem(ctx, s.itemId, s.action)
    case 'recover':
      return engine.takeRecovery(ctx)
    case 'checkin':
      return engine.takeCheckIn(ctx)
    case 'feeFree':
      return engine.switchToFeeFree(ctx)
    case 'summerRole':
      return engine.switchSummerRole(ctx, s.role)
    case 'summarySeen':
      return engine.markSummarySeen(ctx, s.chapter)
  }
}

function applyCampaign(state: GameState, step: CampaignOp): GameState {
  const id = state.activeLifeId
  const run = state.runs[id]
  const ctx: engine.Ctx = { run, player: { coinBase: state.coinBase, mastery: state.mastery } }
  if (!lifeUnlocked(state.runs, lifeOrder, id)) return state
  const next = runStep(ctx, step)
  if (next === ctx) return state
  const runs = next.run === run ? state.runs : { ...state.runs, [id]: { ...next.run, rev: run.rev + 1 } }
  // Finishing chapter 1 opens the next life; offer to take the player there.
  const opened = lifeOrder.find((l) => !lifeUnlocked(state.runs, lifeOrder, l) && lifeUnlocked(runs, lifeOrder, l))
  return syncLives({ ...state, runs, mastery: next.player.mastery, unlockPrompt: opened ?? state.unlockPrompt })
}

/** Knowledge XP is the account's: it can level the player up, and never touches a life. */
function grantXp(account: PlayerAccount, amount: number): PlayerAccount {
  let { xp, knowledgeLevel } = account
  xp += amount
  while (xp >= account.xpToNext) {
    xp -= account.xpToNext
    knowledgeLevel += 1
  }
  return { ...account, xp, knowledgeLevel }
}

/** Move the welcome tour to a step, on the page that step is about. */
const onboardingTo = (state: GameState, to: number): GameState => {
  const step = onboardingSteps[Math.max(0, Math.min(ONBOARDING_FINAL, to))]
  return { ...state, eventOpen: false, tab: step.tab, onboarding: { step: onboardingSteps.indexOf(step) } }
}

const finishTutorial = (state: GameState, rewarded: boolean): GameState => ({
  ...state,
  account: rewarded ? grantXp(state.account, TUTORIAL_XP) : state.account,
  tutorial: { step: TUTORIAL_FINAL, rewarded },
})

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'selectLife':
      return { ...state, activeLifeId: action.lifeId }
    case 'setTab': {
      const moved = { ...state, tab: action.tab, eventOpen: false, learnFocus: action.tab === 'learn' ? state.learnFocus : null }
      // Opening the shop is what the "Visit the Shop" step asks for.
      return state.onboarding.step !== null && onboardingSteps[state.onboarding.step].id === 'shop-nav' && action.tab === 'shop'
        ? onboardingTo(moved, state.onboarding.step + 1)
        : moved
    }
    case 'openEvent': {
      if (!lifeUnlocked(state.runs, lifeOrder, state.activeLifeId)) return state
      // A life's first event begins by making the character the player's own.
      if (!state.lives[state.activeLifeId].customized) {
        return { ...state, creator: { target: state.activeLifeId, firstTime: true } }
      }
      const { step } = state.tutorial
      const opened: GameState = { ...state, eventOpen: true, tutorial: step === 3 ? { ...state.tutorial, step: 4 } : state.tutorial }
      // Open the next story position, processing the calendar up to its date.
      return applyCampaign(opened, { op: 'progress' })
    }
    case 'closeEvent': {
      const { step } = state.tutorial
      const closed = { ...state, eventOpen: false }
      // Backing out of the choice returns to "tap the button"; closing an outcome mid-tour ends it.
      if (step === 4) return { ...closed, tutorial: { ...state.tutorial, step: 3 } }
      if (step === 5) return finishTutorial(closed, false)
      return closed
    }
    case 'tutorialStart':
      return {
        ...state,
        tab: 'home',
        eventOpen: false,
        activeLifeId: 'freshman',
        tutorial: { step: 0, rewarded: false },
      }
    case 'tutorialNext': {
      const { step } = state.tutorial
      if (step === null) return state
      if (step === TUTORIAL_FINAL) return { ...state, tutorial: { ...state.tutorial, step: null } }
      if (tourSteps[step].mode !== 'next') return state
      return { ...state, tutorial: { ...state.tutorial, step: step + 1 } }
    }
    case 'tutorialSkip':
      return { ...state, tutorial: { ...state.tutorial, step: null } }
    case 'setUsername':
      return { ...state, account: { ...state.account, username: cleanName(action.name, state.account.username) } }
    case 'onboardingStart':
      return onboardingTo({ ...state, creator: null, tutorial: { step: null, rewarded: false } }, 0)
    case 'onboardingGo': {
      const { step } = state.onboarding
      if (step === null) return state
      return onboardingTo(state, action.to)
    }
    case 'onboardingSkip':
      return { ...state, onboarding: { step: null } }
    case 'onboardingFinish':
      return action.adventure
        ? { ...state, eventOpen: false, tab: 'home', activeLifeId: 'freshman', onboarding: { step: null }, tutorial: { step: 0, rewarded: false } }
        : { ...state, onboarding: { step: null } }
    case 'openCreator':
      return { ...state, eventOpen: false, creator: { target: action.target, firstTime: Boolean(action.firstTime) } }
    case 'closeCreator':
      return { ...state, creator: null }
    case 'saveCharacter': {
      const at = state.onboarding.step === null ? null : onboardingSteps[state.onboarding.step].id
      // Shop-only clothing can't be worn unless bought, whatever the editor sent.
      const bought = new Set(state.shop.owned)
      if (action.target === 'account') {
        const saved = { ...state, creator: null, account: { ...state.account, username: cleanName(action.name ?? state.account.username, state.account.username), appearance: guardClothing(action.appearance, bought, accountPreset) } }
        // A saved avatar is what the avatar step waits for.
        return at === 'avatar' ? onboardingTo(saved, state.onboarding.step! + 1) : saved
      }
      // A rename changes only the display name: no balances, rewards, flags or progress.
      const life = state.lives[action.target]
      const name = cleanName(action.name ?? life.name, ROLES[roleOfLife[life.id]].defaultName)
      const saved = {
        ...state,
        creator: null,
        lives: { ...state.lives, [life.id]: { ...life, name, appearance: guardClothing(action.appearance, bought, lifePresets[life.id]), customized: true } },
      }
      // Any saved life satisfies the name-and-look step; the tour never asks for all four.
      return at === 'name-look' ? onboardingTo(saved, state.onboarding.step! + 1) : saved
    }
    case 'campaign': {
      const next = applyCampaign(state, action.step)
      if (next === state) return state
      if (action.step.op === 'choose') return next.tutorial.step === 4 ? { ...next, tutorial: { ...next.tutorial, step: 5 } } : next
      if (action.step.op === 'continue') {
        const closed = { ...next, eventOpen: false }
        return state.tutorial.step === 5 ? finishTutorial(closed, true) : closed
      }
      return next
    }
    case 'learnAnswer': {
      const lesson = lessonsById[action.lessonId]
      if (!lesson) return state
      const player = answerLesson({ coinBase: state.coinBase, mastery: state.mastery }, lesson, action.questionId, action.option, action.now, 'learn')
      return player.mastery === state.mastery ? state : syncLives({ ...state, mastery: player.mastery })
    }
    case 'learnAcknowledge': {
      const lesson = lessonsById[action.lessonId]
      if (!lesson) return state
      const player = acknowledgeLesson({ coinBase: state.coinBase, mastery: state.mastery }, lesson, action.questionId, 'learn')
      return player.mastery === state.mastery ? state : syncLives({ ...state, mastery: player.mastery })
    }
    case 'openLesson':
      return { ...state, tab: 'learn', eventOpen: false, learnFocus: action.lessonKey }
    case 'syncStorage': {
      // Another tab saved: take the union of receipts and any run it advanced further.
      const runs = { ...state.runs }
      let changed = false
      for (const id of lifeOrder) {
        const other = action.runs[id]
        if (other && other.runId === runs[id].runId && other.rev > runs[id].rev) {
          runs[id] = other
          changed = true
        }
      }
      const mastery = mergeMastery(state.mastery, action.mastery)
      const shop = action.shop ? mergeShop(state.shop, action.shop) : state.shop
      if (!changed && sameShop(shop, state.shop) && JSON.stringify(mastery) === JSON.stringify(state.mastery)) return state
      return syncLives({ ...state, runs, mastery, shop })
    }
    case 'shopEquip': {
      const owned = ownedIds(state.shop, state.account.accessories, shopItems)
      const shop = applyEquip(state.shop, owned, action.slot, action.itemId)
      return shop === state.shop ? state : { ...state, shop }
    }
    case 'dismissUnlock':
      return state.unlockPrompt ? { ...state, unlockPrompt: null } : state
    case 'goToUnlocked':
      return state.unlockPrompt ? { ...state, activeLifeId: state.unlockPrompt, unlockPrompt: null, tab: 'home', eventOpen: false } : state
    case 'grantCoins':
      return Number.isInteger(action.amount) && action.amount > 0 ? syncLives({ ...state, coinBase: state.coinBase + action.amount }) : state
    case 'shopGoal': {
      const owned = ownedIds(state.shop, state.account.accessories, shopItems)
      const shop = applyGoal(state.shop, owned, action.itemId)
      return shop === state.shop ? state : { ...state, shop }
    }
    case 'openShopItem':
      return { ...gameReducer(state, { type: 'setTab', tab: 'shop' }), shopFocus: action.itemId }
    case 'shopFocusDone':
      return state.shopFocus === null ? state : { ...state, shopFocus: null }
    case 'shopUnequipAll': {
      const shop = applyUnequipAll(state.shop)
      return shop === state.shop ? state : { ...state, shop }
    }
  }
}
