import type { FrameItem, FrameStyle } from '../../data/shop'

// Six procedural pixel frames. Each is built from small ASCII grids (a corner piece and a tiled
// edge strip) on a 96×72 pixel grid, so they are stepped, hand-made-looking and distinct in
// shape, not just in color. '1', '2', '3' pick the item's palette colors.

const W = 96
const H = 72

interface Design {
  /** Top-left corner piece. Mirrored into the other three. */
  corner: string[]
  /** Top edge strip, tiled; mirrored to the other edges. */
  edge: string[]
  /** Extra pixel art that is not an edge or a corner. */
  extra?: () => { x: number; y: number; rows: string[] }[]
}

const designs: Record<FrameStyle, Design> = {
  stepped_corners: {
    corner: [
      '111111111111',
      '122222222221',
      '12111111111.',
      '121.........',
      '121.1111....',
      '121.12......',
      '121.12......',
      '121.........',
      '121.........',
      '121.........',
      '121.........',
      '11..........',
    ],
    edge: ['111111', '222222'],
  },
  pixel_filigree: {
    corner: [
      '1111111111..',
      '1222222222..',
      '12.111111...',
      '12.1.22222..',
      '12.1.2......',
      '12.1.2.11...',
      '12.1.2.1....',
      '12.1.2......',
      '12.1........',
      '12.1........',
      '1...........',
      '1...........',
    ],
    edge: ['111111111111', '............', '2.2.2.2.2.2.'],
  },
  pixel_leaves: {
    corner: [
      '11111111....',
      '1.2.222.2...',
      '1222222222..',
      '12.2222.22..',
      '1.222222....',
      '122.22......',
      '12.2........',
      '12..........',
      '1...........',
      '1...........',
    ],
    edge: ['11111111', '..2...2.', '.222.222', '..2...2.'],
  },
  stepped_waves: {
    corner: [
      '2222222222..',
      '2111111111..',
      '211222222...',
      '21.11111....',
      '21.1........',
      '21.1........',
      '21.1........',
      '21.1........',
      '21..........',
      '2...........',
    ],
    edge: ['11....11', '.1111111', '2.22.222', '........'],
  },
  pixel_laurel: {
    corner: [
      '1111111111',
      '1222222222',
      '12.1111111',
      '12.12222..',
      '12.12.....',
      '12.12.....',
      '12.12.....',
      '12.12.....',
    ],
    edge: ['111111', '2.2.2.'],
    // Laurel branches climb both sides from the bottom corners, leaving the face and title clear.
    extra: () => {
      const out: { x: number; y: number; rows: string[] }[] = []
      for (let i = 0; i < 6; i++) {
        const y = 62 - i * 6
        out.push({ x: 4, y, rows: ['.22', '222'] }, { x: 4, y: y + 2, rows: ['11.', '.11'] })
        out.push({ x: W - 7, y, rows: ['22.', '222'] }, { x: W - 7, y: y + 2, rows: ['.11', '11.'] })
      }
      return out
    },
  },
  corner_crowns: {
    corner: [
      '1111111111111',
      '1111111111111',
      '11.3...3...3.',
      '11.33.333.33.',
      '11.333333333.',
      '11.3323323.3.',
      '11.333333333.',
      '11..........',
      '11..........',
      '2...........',
    ],
    edge: ['1111', '1111', '2.2.'],
  },
}

type Rect = { x: number; y: number; w: number; h: number; fill: number }

/** Row-run merge so a grid draws as few rects as possible. */
function rectsOf(rows: string[], ox: number, oy: number, map: (x: number, y: number) => [number, number]): Rect[] {
  const out: Rect[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.') {
        x++
        continue
      }
      let n = 1
      while (row[x + n] === ch) n++
      for (let i = 0; i < n; i++) {
        const [px, py] = map(ox + x + i, oy + y)
        out.push({ x: px, y: py, w: 1, h: 1, fill: Number(ch) - 1 })
      }
      x += n
    }
  })
  return out
}

function build(style: FrameStyle): Rect[] {
  const d = designs[style]
  const cw = d.corner[0].length
  const ch = d.corner.length
  const rects: Rect[] = []
  // edges first, corners on top
  const depth = d.edge.length
  const period = d.edge[0].length
  for (let i = cw; i < W - cw; i++) {
    for (let r = 0; r < depth; r++) {
      const c = d.edge[r][(i - cw) % period]
      if (c === '.') continue
      const fill = Number(c) - 1
      rects.push({ x: i, y: r, w: 1, h: 1, fill }, { x: i, y: H - 1 - r, w: 1, h: 1, fill })
    }
  }
  const sideCh = d.edge[0].length
  for (let j = ch; j < H - ch; j++) {
    for (let r = 0; r < depth; r++) {
      const c = d.edge[r][(j - ch) % sideCh]
      if (c === '.') continue
      const fill = Number(c) - 1
      rects.push({ x: r, y: j, w: 1, h: 1, fill }, { x: W - 1 - r, y: j, w: 1, h: 1, fill })
    }
  }
  // corners mirrored into all four, on top of the edges
  d.corner.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x]
      if (c === '.') continue
      const fill = Number(c) - 1
      rects.push(
        { x, y, w: 1, h: 1, fill },
        { x: W - 1 - x, y, w: 1, h: 1, fill },
        { x, y: H - 1 - y, w: 1, h: 1, fill },
        { x: W - 1 - x, y: H - 1 - y, w: 1, h: 1, fill },
      )
    }
  })
  for (const piece of d.extra?.() ?? []) {
    rects.push(...rectsOf(piece.rows, piece.x, piece.y, (x, y) => [x, y]))
  }
  return rects
}

const cache = new Map<FrameStyle, Rect[]>()
const rectsFor = (style: FrameStyle) => {
  let r = cache.get(style)
  if (!r) cache.set(style, (r = build(style)))
  return r
}

/**
 * A decorative pixel frame laid over the whole profile stage. Pure art: it never takes
 * pointer input, and the avatar's face and the title plaque sit clear of its corners.
 */
export function FrameLayer({ item, className = '' }: { item: FrameItem; className?: string }) {
  const rects = rectsFor(item.style)
  const ink = '#1b1210'
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      data-frame={item.style}
      aria-hidden
    >
      {/* a one-cell dark underlay keeps the frame readable over any background */}
      <g fill={ink} opacity={0.55}>
        {rects.map((r, i) => (
          <rect key={`s${i}`} x={r.x + 1} y={r.y + 1} width={r.w} height={r.h} />
        ))}
      </g>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={item.palette[r.fill] ?? item.palette[0]} />
      ))}
    </svg>
  )
}
