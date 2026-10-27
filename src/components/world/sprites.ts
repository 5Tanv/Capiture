import { iconDefs } from '../../sprites/icons'
import type { SpriteDef } from './PixelSprite'

const INK = '#2a1a12'

export const ballSprite: SpriteDef = {
  grid: ['..oooo..', '.obbdbo.', 'obbbdbbo', 'oddddddo', 'obbbdbbo', '.obbdbo.', '..oooo..'],
  palette: { o: INK, b: '#e8742a', d: '#8a3a14' },
}

// Icons: the 16×16 family lives in src/sprites/icons.ts. The play arrow stays a
// narrow glyph because buttons size it as one.
export const icons = {
  ...iconDefs,
  /** Kept for callers that ask for the graduation cap by its old name. */
  cap: iconDefs.school,
  arrow: {
    grid: ['oo......', 'owo.....', 'owwo....', 'owwwo...', 'owwwwo..', 'owwwo...', 'owwo....', 'owo.....', 'oo......'],
    palette: { o: INK, w: '#ffffff' },
  },
} satisfies Record<string, SpriteDef>

export type IconName = keyof typeof icons
