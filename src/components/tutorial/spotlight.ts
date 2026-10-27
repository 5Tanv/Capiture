import type { TourSide } from '../../data/tutorial'

// Shared by the gameplay tour and the welcome tour: measuring lit targets and placing a card beside them.

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const PAD = 6
const MARGIN = 12
/** Room between a lit target and the card for the arrow. */
const ARROW_ROOM = 46

/** The first visible element for each `data-tour` id (the lives picker exists twice, rail and strip). */
export function measure(ids: string[]): Box[] {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const boxes: Box[] = []
  for (const id of ids) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const x = Math.max(0, r.left - PAD)
      const y = Math.max(0, r.top - PAD)
      boxes.push({ x, y, w: Math.min(vw, r.right + PAD) - x, h: Math.min(vh, r.bottom + PAD) - y })
      break
    }
  }
  return boxes
}

export function roundedRect({ x, y, w, h }: Box) {
  const r = Math.min(12, w / 2, h / 2)
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`
}

export interface Placement {
  left: number
  top: number
  /** Where the arrow sits and which way it points; null when the card is docked. */
  arrow: { left: number; top: number; rotate: number } | null
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const opposite: Record<TourSide, TourSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
/** The base arrow points right; rotate it to point from the card toward the target. */
const rotation: Record<TourSide, number> = { bottom: -90, top: 90, right: 180, left: 0 }

export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

export const union = (boxes: Box[]): Box => {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y }
}

/** A card with no target, centered but never pushed above the top edge of a short window. */
export const centeredIn = (view: { w: number; h: number }, card: { w: number; h: number }): Placement => ({
  left: Math.max(MARGIN, (view.w - card.w) / 2),
  top: Math.max(MARGIN, (view.h - card.h) / 2),
  arrow: null,
})

/** Puts the card beside the first target, pointing at it, without ever covering a lit target. */
export function place(boxes: Box[], card: { w: number; h: number }, pref: TourSide): Placement {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const sides: TourSide[] = [pref, opposite[pref], ...(['bottom', 'top', 'right', 'left'] as TourSide[]).filter((s) => s !== pref && s !== opposite[pref])]
  const size = 28

  const beside = (anchor: Box): Placement | null => {
    const cx = anchor.x + anchor.w / 2
    const cy = anchor.y + anchor.h / 2
    for (const side of sides) {
      let left: number
      let top: number
      let fits: boolean
      if (side === 'bottom' || side === 'top') {
        left = clamp(cx - card.w / 2, MARGIN, vw - card.w - MARGIN)
        top = side === 'bottom' ? anchor.y + anchor.h + ARROW_ROOM : anchor.y - ARROW_ROOM - card.h
        fits = top >= MARGIN && top + card.h <= vh - MARGIN
      } else {
        top = clamp(cy - card.h / 2, MARGIN, vh - card.h - MARGIN)
        left = side === 'right' ? anchor.x + anchor.w + ARROW_ROOM : anchor.x - ARROW_ROOM - card.w
        fits = left >= MARGIN && left + card.w <= vw - MARGIN
      }
      if (!fits || boxes.some((b) => overlaps({ x: left, y: top, w: card.w, h: card.h }, b))) continue
      const at =
        side === 'bottom' ? { left: clamp(cx, MARGIN, vw - MARGIN) - size / 2, top: anchor.y + anchor.h + (ARROW_ROOM - size) / 2 }
        : side === 'top' ? { left: clamp(cx, MARGIN, vw - MARGIN) - size / 2, top: anchor.y - (ARROW_ROOM + size) / 2 }
        : side === 'right' ? { left: anchor.x + anchor.w + (ARROW_ROOM - size) / 2, top: clamp(cy, MARGIN, vh - MARGIN) - size / 2 }
        : { left: anchor.x - (ARROW_ROOM + size) / 2, top: clamp(cy, MARGIN, vh - MARGIN) - size / 2 }
      return { left, top, arrow: { ...at, rotate: rotation[side] } }
    }
    return null
  }

  const found = beside(boxes[0]) ?? (boxes.length > 1 ? beside(union(boxes)) : null)
  if (found) return found

  // Nothing fits beside the targets (a tall panel on a phone): dock on the screen edge that is clear of them.
  const left = clamp((vw - card.w) / 2, MARGIN, vw)
  for (const top of [MARGIN, vh - card.h - MARGIN]) {
    if (!boxes.some((b) => overlaps({ x: left, y: top, w: card.w, h: card.h }, b))) return { left, top, arrow: null }
  }
  return { left, top: union(boxes).y > vh / 2 ? MARGIN : vh - card.h - MARGIN, arrow: null }
}

