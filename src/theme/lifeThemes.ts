import type { CSSProperties } from 'react'
import type { LifeId } from '../types/game'

/**
 * Each life's atmosphere, in one place. Only decoration changes: surfaces,
 * light, texture and scenery. The financial colors (cash green, debt red, info
 * blue, reward gold) are fixed tokens and never come from here, and the top HUD
 * and bottom nav don't read these variables at all.
 *
 * `themeVars` turns a theme into CSS variables on the document root. index.css
 * reads them with fallbacks to the original forest look.
 */
interface Pair {
  a: string
  b: string
}

export interface LifeTheme {
  accent: string
  accent2: string
  deep: string
  /** Ambient light the page takes on while this life is active. */
  tint: string
  /** Short mood line used in the creator and on the life card. */
  mood: string
  /** The sign style for in-world labels. */
  sign: { bg: string; fg: string }

  /** The page behind everything: three stops top to bottom, two lights from above, a tile and one big piece of art. */
  page: { stops: [string, string, string]; glow: string; glow2: string; tile: string; art: string; artSize: string; artPos: string }
  /** Secondary reading color on dark surfaces. */
  muted: { soft: string; strong: string }
  /** The lives rail / selector surface. */
  rail: Pair & { edge: string; trim: string }
  /** Compact stat panels and the log. */
  panel: Pair & { edge: string; hi: string }
  /** The tray that holds reward cards, and the cards in it. */
  well: { bg: string; dot: string }
  slot: Pair & { edge: string }
  /** Reading paper, tinted to the life. */
  paper: Pair & { edge: string; hi: string }
  /** The frame around the scene. */
  frame: Pair & { hi: string; line: string }
  /** The block the scene sits on. */
  base: { cap: string; mid: string; deep: string; deeper: string; fleck: string }
}

/** Inline SVG as a data URI, for tiles and large backdrop art. */
const svg = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${body}</svg>`)}")`

const dots = (c: string, o: number, size = 24) =>
  svg(
    size,
    size,
    `<rect x='0' y='0' width='1' height='1' fill='${c}' fill-opacity='${o}'/><rect x='${size / 2}' y='${size / 2}' width='1' height='1' fill='${c}' fill-opacity='${o}'/>`,
  )

// ------------------------------------------------------- page art

/** A harbor skyline behind the page, in shadow with a few lit windows. */
const skyline = (() => {
  const towers = [
    [30, 70, 60], [110, 40, 90], [170, 90, 50], [240, 30, 110], [310, 80, 60], [380, 50, 80], [450, 100, 40], [520, 36, 104],
    [590, 70, 70], [660, 24, 120], [730, 84, 56], [800, 44, 96], [870, 96, 44], [940, 34, 108], [1010, 70, 70], [1080, 50, 90],
  ]
  const body = towers
    .map(([x, y, h]) => {
      const top = y + 120 - h
      const win = Array.from({ length: Math.floor(h / 16) }, (_, r) =>
        (r + x / 10) % 3 === 0 ? '' : `<rect x='${x + 10 + ((r * 7) % 3) * 14}' y='${top + 8 + r * 16}' width='5' height='6' fill='#c9a24a' fill-opacity='.4'/>`,
      ).join('')
      return `<rect x='${x}' y='${top}' width='56' height='${h + 120}' fill='#0b1620' fill-opacity='.55'/>${win}`
    })
    .join('')
  return svg(1200, 260, body)
})()

/** Half-court lines, drawn big and faint so the page reads as a floor seen from the rafters. */
const halfCourt = svg(
  1200,
  640,
  `<g fill='none' stroke='#8fb0e0' stroke-opacity='.16' stroke-width='3'>
    <circle cx='600' cy='20' r='130'/>
    <rect x='480' y='20' width='240' height='260'/>
    <circle cx='600' cy='280' r='90' stroke-dasharray='14 12'/>
    <path d='M170 20V210a430 430 0 0 0 860 0V20'/>
  </g>
  <rect x='480' y='20' width='240' height='260' fill='#e0702e' fill-opacity='.06'/>`,
)

// ------------------------------------------------------- scenery sprites

// ------------------------------------------------------- the four lives

export const lifeThemes: Record<LifeId, LifeTheme> = {
  // Dusty teal, sage, cream and terracotta: a warm campus afternoon.
  freshman: {
    accent: '#c8693f',
    accent2: '#8fae9a',
    deep: '#3f7f84',
    tint: '#8cc9c4',
    mood: 'Youthful, a little chaotic, hopeful',
    sign: { bg: '#2c5a5c', fg: '#f4ead2' },
    page: {
      stops: ['#27494a', '#1f3d3e', '#162c2d'],
      glow: '#cfe3c4',
      glow2: '#e7a07a',
      tile: dots('#f4ead2', 0.06),
      art: 'none',
      artSize: 'auto',
      artPos: 'center',
    },
    muted: { soft: '#b9cdbd', strong: '#7fa08c' },
    rail: { a: '#2f5b5a', b: '#234645', edge: '#c8693f', trim: '#8fae9a' },
    panel: { a: 'rgb(38 78 76 / 0.82)', b: 'rgb(26 56 55 / 0.88)', edge: '#c8693f', hi: 'rgb(244 234 210 / 0.12)' },
    well: { bg: '#1b3837', dot: 'rgb(244 234 210 / 0.05)' },
    slot: { a: '#3b6a66', b: '#2c5350', edge: '#8fae9a' },
    paper: { a: '#f8f0dc', b: '#eadcbc', edge: '#d9c79f', hi: '#fffaf0' },
    frame: { a: '#b8603f', b: '#8a432b', hi: 'rgb(255 205 170 / 0.35)', line: 'rgb(244 234 210 / 0.5)' },
    base: { cap: '#7ab36a', mid: '#a8553a', deep: '#7e3f2a', deeper: '#5a2c1e', fleck: '#e7c79a' },
  },

  // Muted plum, peach, warm beige and dusty rose: a cozy lit window at dusk.
  professional: {
    accent: '#e3a07e',
    accent2: '#c98896',
    deep: '#5a3a56',
    tint: '#f2b896',
    mood: 'Grounded, warm, lived-in',
    sign: { bg: '#5a3a56', fg: '#fbefe0' },
    page: {
      stops: ['#3a2640', '#2d1d35', '#201526'],
      glow: '#f2b896',
      glow2: '#c98896',
      tile: dots('#f6dcc4', 0.06),
      art: 'none',
      artSize: 'auto',
      artPos: 'center',
    },
    muted: { soft: '#d3bccb', strong: '#a98aa0' },
    rail: { a: '#4a3052', b: '#382541', edge: '#c98896', trim: '#f2b896' },
    panel: { a: 'rgb(74 48 82 / 0.82)', b: 'rgb(50 32 58 / 0.9)', edge: '#c98896', hi: 'rgb(251 239 224 / 0.12)' },
    well: { bg: '#2a1b31', dot: 'rgb(251 239 224 / 0.05)' },
    slot: { a: '#5d4166', b: '#47304f', edge: '#c98896' },
    paper: { a: '#f7eee0', b: '#eadcc6', edge: '#d9c4a8', hi: '#fffaf2' },
    frame: { a: '#8a566a', b: '#64384a', hi: 'rgb(255 214 190 / 0.35)', line: 'rgb(251 239 224 / 0.5)' },
    base: { cap: '#8fbf7a', mid: '#8a5a4a', deep: '#6a4236', deeper: '#4a2c26', fleck: '#e8c9a6' },
  },

  // Slate navy, teal-blue, brass and warm gray: a studio lit late over the harbor.
  entrepreneur: {
    accent: '#2f86a0',
    accent2: '#c9a24a',
    deep: '#24345a',
    tint: '#f2a65a',
    mood: 'Ambitious, modern, hustling',
    sign: { bg: '#24345a', fg: '#f4d58d' },
    page: {
      stops: ['#233a47', '#192b36', '#101c25'],
      glow: '#3a93a8',
      glow2: '#c9a24a',
      tile: dots('#c4d4dc', 0.06),
      art: skyline,
      artSize: 'min(1700px, 150vw) auto',
      artPos: 'center bottom',
    },
    muted: { soft: '#c0ccd2', strong: '#8fa2ad' },
    rail: { a: '#2f4a58', b: '#213744', edge: '#c9a24a', trim: '#3a93a8' },
    panel: { a: 'rgb(42 70 84 / 0.82)', b: 'rgb(24 42 54 / 0.9)', edge: '#c9a24a', hi: 'rgb(220 232 238 / 0.12)' },
    well: { bg: '#0f1b24', dot: 'rgb(196 212 220 / 0.05)' },
    slot: { a: '#3b5666', b: '#2b4351', edge: '#8d867c' },
    paper: { a: '#f2efe9', b: '#e2ded4', edge: '#cbc5b8', hi: '#fffefb' },
    frame: { a: '#5b7787', b: '#3a5262', hi: 'rgb(214 230 238 / 0.32)', line: 'rgb(201 162 74 / 0.7)' },
    base: { cap: '#8d867c', mid: '#3a5262', deep: '#27394a', deeper: '#18232e', fleck: '#c9a24a' },
  },

  // Midnight navy, steel blue, burnt orange and athletic gold: a rookie night under arena lights.
  athlete: {
    accent: '#e0702e',
    accent2: '#e8b64a',
    deep: '#3f5f8f',
    tint: '#5d86c9',
    mood: 'Bold, energetic, aspirational',
    sign: { bg: '#162447', fg: '#f2c55c' },
    page: {
      stops: ['#17254a', '#0f1b3a', '#0a1228'],
      glow: '#5d86c9',
      glow2: '#e0702e',
      tile: dots('#9db8e0', 0.07),
      art: halfCourt,
      artSize: 'min(1500px, 125vw) auto',
      artPos: 'center bottom',
    },
    muted: { soft: '#b7c6e0', strong: '#8199c2' },
    rail: { a: '#1f3a6a', b: '#14274d', edge: '#e0702e', trim: '#e8b64a' },
    panel: { a: 'rgb(30 52 92 / 0.78)', b: 'rgb(16 30 60 / 0.9)', edge: '#e0702e', hi: 'rgb(180 204 244 / 0.14)' },
    well: { bg: '#0c1730', dot: 'rgb(157 184 224 / 0.06)' },
    slot: { a: '#2a4a82', b: '#1b335f', edge: '#4a6fa5' },
    paper: { a: '#eef2f9', b: '#d9e2f0', edge: '#b8c7de', hi: '#ffffff' },
    frame: { a: '#4f78b4', b: '#2a4a82', hi: 'rgb(190 215 250 / 0.4)', line: 'rgb(232 182 74 / 0.75)' },
    base: { cap: '#e0702e', mid: '#2a4a82', deep: '#162a52', deeper: '#0c1730', fleck: '#e8b64a' },
  },
}

/**
 * Account screens (Profile, Shop, Compete) belong to the player, not to any life,
 * so they wear this neutral gray instead of a life's colors.
 */
export const neutralTheme: LifeTheme = {
  accent: '#9aa3ad',
  accent2: '#c4cad1',
  deep: '#4a525c',
  tint: '#aeb6bf',
  mood: 'Neutral',
  sign: { bg: '#3a414a', fg: '#e8ebef' },
  page: {
    stops: ['#2e343b', '#252a30', '#1a1e23'],
    glow: '#aeb6bf',
    glow2: '#8a929c',
    tile: dots('#e8ebef', 0.05),
    art: 'none',
    artSize: 'auto',
    artPos: 'center',
  },
  muted: { soft: '#c0c6cd', strong: '#8d95a0' },
  rail: { a: '#3a414a', b: '#2b3037', edge: '#9aa3ad', trim: '#c4cad1' },
  panel: { a: 'rgb(58 65 74 / 0.82)', b: 'rgb(38 43 50 / 0.9)', edge: '#9aa3ad', hi: 'rgb(232 235 239 / 0.12)' },
  well: { bg: '#1c2024', dot: 'rgb(232 235 239 / 0.05)' },
  slot: { a: '#48505a', b: '#363c44', edge: '#8d95a0' },
  paper: { a: '#f3f4f6', b: '#e3e5e9', edge: '#cdd1d7', hi: '#ffffff' },
  frame: { a: '#5a626c', b: '#3e454d', hi: 'rgb(232 235 239 / 0.3)', line: 'rgb(196 202 209 / 0.6)' },
  base: { cap: '#9aa3ad', mid: '#3e454d', deep: '#2e343b', deeper: '#1f2429', fleck: '#c4cad1' },
}

/** CSS variables for a life (or the neutral account look), set on the document root so any component can read them. */
export function themeVars(id: LifeId | 'neutral'): CSSProperties {
  const t = id === 'neutral' ? neutralTheme : lifeThemes[id]
  const v: Record<string, string> = {
    '--life-accent': t.accent,
    '--life-accent-2': t.accent2,
    '--life-deep': t.deep,
    '--life-tint': t.tint,

    '--th-bg-a': t.page.stops[0],
    '--th-bg-b': t.page.stops[1],
    '--th-bg-c': t.page.stops[2],
    '--th-glow': t.page.glow,
    '--th-glow-2': t.page.glow2,
    '--th-tile': t.page.tile,
    '--th-art': t.page.art,
    '--th-art-size': t.page.artSize,
    '--th-art-pos': t.page.artPos,

    '--th-rail-a': t.rail.a,
    '--th-rail-b': t.rail.b,
    '--th-rail-edge': t.rail.edge,
    '--th-rail-trim': t.rail.trim,

    '--th-panel-a': t.panel.a,
    '--th-panel-b': t.panel.b,
    '--th-panel-edge': t.panel.edge,
    '--th-panel-hi': t.panel.hi,

    '--th-well': t.well.bg,
    '--th-well-dot': t.well.dot,
    '--th-slot-a': t.slot.a,
    '--th-slot-b': t.slot.b,
    '--th-slot-edge': t.slot.edge,

    '--th-paper-a': t.paper.a,
    '--th-paper-b': t.paper.b,
    '--th-paper-edge': t.paper.edge,
    '--th-paper-hi': t.paper.hi,

    '--th-frame-a': t.frame.a,
    '--th-frame-b': t.frame.b,
    '--th-frame-hi': t.frame.hi,
    '--th-frame-line': t.frame.line,

    // Secondary text on dark surfaces. HUD and nav never use these tokens.
    '--color-sage-300': t.muted.soft,
    '--color-sage-500': t.muted.strong,
  }
  return v as CSSProperties
}
