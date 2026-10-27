// The first-run tour. Steps 1 to 3 are read-and-tap; steps 4 to 6 make the player
// do the real action, which is what keeps the tour from being clicked through.

export type TourSide = 'top' | 'bottom' | 'left' | 'right'

/** `{name}` in a title or text becomes the tour life's first name. */
export interface TourStep {
  /** `data-tour` ids to light up. The first one is where the card and arrow point. */
  targets: string[]
  title: string
  text: string
  /** 'next' advances on the card's button; 'do' waits for the player to act on the real UI. */
  mode: 'next' | 'do'
  /** Shown on 'do' steps in place of the Next button. */
  hint?: string
  side: TourSide
}

export const tourSteps: TourStep[] = [
  {
    targets: ['stage'],
    title: 'Meet {name}',
    text: 'This is {name}’s life. Every choice here is practice for real money decisions.',
    mode: 'next',
    side: 'bottom',
  },
  {
    targets: ['xp', 'coins'],
    title: 'This part is yours',
    text: 'XP and FiCoins belong to you. They stay with you across every life.',
    mode: 'next',
    side: 'bottom',
  },
  {
    targets: ['life-cash', 'lives'],
    title: 'Each life is separate',
    text: 'Cash belongs to {name} only. Every life has its own money.',
    mode: 'next',
    side: 'bottom',
  },
  {
    targets: ['next-event'],
    title: 'Your turn',
    text: 'Tap the glowing button to face a money decision.',
    mode: 'do',
    hint: 'Tap the glowing button',
    side: 'top',
  },
  {
    targets: ['choices'],
    title: 'Learn, then choose',
    text: 'Read the short lesson and answer two questions: each right first answer earns 5 FiCoins. Then pick a choice. There’s no perfect answer, only trade-offs.',
    mode: 'do',
    hint: 'Answer, then confirm a choice',
    side: 'right',
  },
  {
    targets: ['tradeoff', 'continue'],
    title: 'See the trade-off',
    text: 'Here’s what it cost and why. Press Continue to move {name}’s story on.',
    mode: 'do',
    hint: 'Press Continue',
    side: 'right',
  },
]

/** One past the last real step: the "you did it" card. */
export const TUTORIAL_FINAL = tourSteps.length

/** Knowledge XP for finishing the tour. It goes to the account, never to a life. */
export const TUTORIAL_XP = 25
