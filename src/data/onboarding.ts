import type { TabId } from '../types/game'
import type { TourSide } from './tutorial'

// The welcome tour: customize the player's avatar and lives, then see the shop.
// Each step names its page, what to light up, and what the player must do.
//   'next'    the card's Next button moves on
//   'do'      the player acts on the real UI; the game state advances the tour
//             (a saved avatar, a saved life, opening the shop), never a click on a button

export interface OnboardingStep {
  id: string
  /** The page to be on. Entering the step navigates there. */
  tab: TabId
  /** `data-tour` ids to light up. The first is where the card points; none means a centered card. */
  targets: string[]
  title: string
  text: string
  mode: 'next' | 'do'
  /** Shown on 'do' steps beside the skip button. */
  hint?: string
  side: TourSide
  /** The step Back returns to. */
  back?: number
  /** Where Skip step leads on a 'do' step, past the confirmation card. */
  skipTo?: number
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    tab: 'home',
    targets: [],
    title: 'Welcome to Capiture!',
    text: 'Before you begin your financial adventure, let’s make this experience yours!',
    mode: 'next',
    side: 'bottom',
  },
  {
    id: 'avatar',
    tab: 'profile',
    targets: ['edit-avatar'],
    title: 'Your profile avatar',
    text: 'First, let’s create your profile avatar! This represents YOU across Capiture. Choose your look and make it your own!',
    mode: 'do',
    hint: 'Tap Edit avatar, then save',
    side: 'right',
    back: 0,
    skipTo: 3,
  },
  {
    id: 'avatar-done',
    tab: 'profile',
    targets: ['avatar-card'],
    title: 'Looking good!',
    text: 'Your profile avatar is separate from the characters you’ll play in your different financial lives.',
    mode: 'next',
    side: 'right',
    back: 1,
  },
  {
    id: 'lives',
    tab: 'profile',
    targets: ['lives-section'],
    title: 'Four financial lives',
    text: 'In Capiture, you can live four different financial adventures: a College Freshman, a Working Adult, a Business Owner and a Professional Basketball Player. Each has their own name, appearance, money, stats and story.',
    mode: 'next',
    side: 'top',
    back: 1,
  },
  {
    id: 'name-look',
    tab: 'profile',
    targets: ['name-look-freshman'],
    title: 'Name & look',
    text: 'Want to make these characters your own? Tap Name & look to choose their names and customize their appearances. Start with the College Freshman. The others can wait: you can change any of them whenever you like.',
    mode: 'do',
    hint: 'Tap Name & look, then save',
    side: 'top',
    back: 3,
    skipTo: 6,
  },
  {
    id: 'name-look-done',
    tab: 'profile',
    targets: ['lives-section'],
    title: 'Awesome!',
    text: 'Your character is ready for their financial adventure. Remember, each life has its own story and financial challenges!',
    mode: 'next',
    side: 'top',
    back: 4,
  },
  {
    id: 'shop-nav',
    tab: 'profile',
    targets: ['nav-shop'],
    title: 'Visit the Shop',
    text: 'Want to make your profile even cooler? Visit the Shop to discover more customization options!',
    mode: 'do',
    hint: 'Tap Shop',
    side: 'top',
    back: 4,
    skipTo: 7,
  },
  {
    id: 'shop-coins',
    tab: 'shop',
    targets: ['shop-coins'],
    title: 'FiCoins',
    text: 'Earn FiCoins by learning about finance, completing lessons, and progressing through Capiture. Then spend them on profile customization items. They’re separate from the cash each life earns.',
    mode: 'next',
    side: 'right',
    back: 6,
  },
  {
    id: 'shop-items',
    tab: 'shop',
    targets: ['shop-shelf'],
    title: 'What’s on the shelves',
    text: 'Browse backgrounds, pets, titles, frames, effects, outfits and more. Try any item on for free, then buy it with FiCoins when you’re ready. Items you own can be equipped any time.',
    mode: 'next',
    side: 'top',
    back: 7,
  },
  {
    id: 'badges',
    tab: 'profile',
    targets: ['badges', 'collection'],
    title: 'Badges & collection',
    text: 'As you learn, you’ll earn badges to celebrate your achievements. You can also collect and equip customization items to show off your progress!',
    mode: 'next',
    side: 'left',
    back: 8,
  },
  {
    id: 'finish',
    tab: 'profile',
    targets: [],
    title: 'You’re all set!',
    text: 'Your character is ready, your profile is yours to customize, and there’s a whole world of finance waiting to explore!',
    mode: 'next',
    side: 'bottom',
    back: 9,
  },
]

export const ONBOARDING_FINAL = onboardingSteps.length - 1

export const stepIndex = (id: string) => onboardingSteps.findIndex((s) => s.id === id)
