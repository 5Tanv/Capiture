---
name: Capiture
description: A financial-literacy life sim dressed as a premium indie game lobby, carved walnut and brass over a pine-green quilted ground.
colors:
  ink: "#2a1a12"
  ink-soft: "#4a3226"
  walnut-900: "#3a2214"
  walnut-800: "#4a2c1a"
  walnut-700: "#5b3520"
  walnut-600: "#6b4026"
  walnut-400: "#8c5a34"
  brass-300: "#fff1b0"
  brass-400: "#ffe27a"
  brass-500: "#f7c948"
  brass-600: "#e39b1b"
  brass-700: "#c27a0e"
  brass-900: "#7a4a10"
  cash-300: "#a8ecb8"
  cash-500: "#3fbf6a"
  cash-700: "#1f7a3e"
  xp-300: "#bdeefc"
  xp-500: "#2bb3e6"
  xp-700: "#16769c"
  ember-500: "#e0603a"
  ember-700: "#b8472a"
  happiness-pink: "#ef7fa0"
  sky-300: "#a6e3f3"
  pine-950: "#10291f"
  pine-900: "#163728"
  pine-800: "#1d4a37"
  pine-700: "#24604a"
  parch-100: "#fbf3e1"
  parch-200: "#f6e7c8"
  parch-300: "#ead3a6"
  parch-500: "#c9b48a"
typography:
  display:
    fontFamily: "'Lilita One', 'Trebuchet MS', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.025em"
  headline:
    fontFamily: "'Lilita One', 'Trebuchet MS', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  title:
    fontFamily: "'Lilita One', 'Trebuchet MS', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "'Nunito', 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.625
  body-sm:
    fontFamily: "'Nunito', 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.375
  label:
    fontFamily: "'Nunito', 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1.25
  signage:
    fontFamily: "'Pixelify Sans', monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1
rounded:
  sign: "6px"
  ctl: "10px"
  inset: "12px"
  panel: "16px"
  stage: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  panel: "14px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brass-500}"
    textColor: "{colors.parch-100}"
    typography: "{typography.display}"
    rounded: "{rounded.panel}"
    padding: "12px 24px"
    height: "84px"
  button-wood:
    backgroundColor: "{colors.walnut-400}"
    textColor: "{colors.parch-100}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.ctl}"
    padding: "0 20px"
    height: "44px"
  button-cash:
    backgroundColor: "{colors.cash-500}"
    textColor: "{colors.parch-100}"
    rounded: "{rounded.ctl}"
  button-xp:
    backgroundColor: "{colors.xp-500}"
    textColor: "{colors.parch-100}"
    rounded: "{rounded.ctl}"
  button-choice:
    backgroundColor: "{colors.parch-100}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.ctl}"
    padding: "12px 14px"
  panel-wood:
    backgroundColor: "{colors.walnut-700}"
    textColor: "{colors.parch-100}"
    rounded: "{rounded.panel}"
    padding: "14px"
  panel-parch:
    backgroundColor: "{colors.parch-100}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.inset}"
    padding: "12px 14px"
  hud-strip:
    backgroundColor: "{colors.walnut-800}"
    textColor: "{colors.parch-100}"
    height: "72px"
  pill-ficoins:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.parch-100}"
    rounded: "{rounded.pill}"
    height: "32px"
  pill-life-cash:
    backgroundColor: "{colors.cash-700}"
    textColor: "{colors.parch-100}"
    rounded: "{rounded.ctl}"
    height: "36px"
  progress-track:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "16px"
  chip-delta:
    backgroundColor: "{colors.cash-500}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: Capiture

## Overview

**Creative North Star: "The Carved Lobby"**

Capiture looks like a premium indie game, not an edtech dashboard. Every piece of interface is a physical object in the same world as the pixel diorama: carved walnut panels drawn with a pixel plank texture, brass rails and corner brackets drawn at the world's own pixel scale, a dark ink outline around everything, and chunky bevel-and-lip buttons that press down. The lobby sits on a deep pine-green quilted lattice with a warm pool of light at its centre. The UI and the diorama share one material, so nothing reads as a web app floating over a game.

The interface is dense and confident, like a mobile game lobby. Colour carries meaning before decoration: each economy and each stat has its own hue, and the two economies (the account's knowledge and the life's money) never share one. Display type is white with a thick ink outline, like painted signage. Reading text sits on parchment insets set into the wood. Pixel-art characters and scenes are SVG rects drawn with crisp edges, so they stay sharp at any size.

Rejected outright: purple or blue gradients, glassmorphism, generic dashboards of stacked white cards and stat tiles, and emoji used as artwork.

**Key Characteristics:**
- Carved walnut and brass UI with a 3px ink outline, sharing the diorama's pixel material.
- Pine-green quilted lattice ground under everything.
- Colour reserved by meaning: gold for the primary action and FiCoins, banknote green for life money, sky-teal for XP and learning, ember for debt and stress, pink for happiness.
- Lilita One with an ink outline for display and numbers, Nunito for prose, Pixelify Sans only for signage inside the world.
- Bevel-and-lip buttons that collapse when pressed; slow stepped loops in the world; nothing moves under reduced motion.

## Colors

A warm wood-and-brass material palette on a cool pine ground, with saturated hues used for meaning.

### Primary
- **Lobby Brass** (brass-500, with brass-400 to brass-600 as the face gradient and brass-900 as the lip): the face of the one primary action (NEXT EVENT, CONTINUE) and the FiCoins currency. The same brass also fills the chapter progress bar and the chapter number plaque, because chapter progress is what the primary action advances.
- **Brass Highlight** (brass-300): focus rings, selection, the bright line in the brass rails, and small labels on wood (link text, FiCoins label).

### Secondary
- **Banknote Green** (cash-500; cash-700 for figures on parchment; cash-300 for labels on dark): the life's own money. The "<Name>'s cash" pill, cash figures, positive money deltas, and the life's credit bar. Also used for the mastery bar and the green "earn more" plus button.
- **Sky Teal** (xp-500; xp-700 for depth; xp-300 for links on wood): knowledge. The XP bar and level badge, the daily-challenge ribbon, and "Learn about..." links.

### Tertiary
- **Ember** (ember-500; ember-700 for figures on parchment): debt, stress, cost chips that add debt, the streak ribbon, and the NEW tag on unplayed lives.
- **Happiness Pink** (happiness-pink): the happiness stat bar only.
- **Sky** (sky-300): the backdrop behind the account avatar.

### Neutral
- **Ink** (ink): every outline, every text outline, bar tracks, and dark text on parchment. It is the line that holds the world together.
- **Soft Ink** (ink-soft): secondary text and labels on parchment.
- **Walnut** (walnut-900 to walnut-400): panel bodies, HUD strips, the default wooden button (walnut-400 to walnut-600 face, walnut-900 lip), and the active nav tab.
- **Pine** (pine-950 to pine-700): the quilted ground (pine-800 to pine-950 vertical gradient), the trade-off box inside events, and the modal backdrop (pine-950 at 72%).
- **Parchment** (parch-100 to parch-500): reading insets, choice buttons, and light body text on wood (parch-100 to parch-300).

### Named Rules
**The Two Economies Rule.** FiCoins (the account) are gold and sit in an ink pill with a coin. Life money is green and sits in a pill carrying the character's portrait and the label "<Name>'s cash". Never put life money in gold or FiCoins in green, and never show the two in one control.

**The Gold Path Rule.** Gold as a button face belongs only to the primary action of a view; secondary actions use the walnut, green, teal, or parchment faces. Gold as a fill otherwise marks FiCoins and the chapter progress the primary action drives. Brass as metal trim (rails, corner brackets, hairlines, portrait frames, ribbons) is the world's material, not a signal, and is free to appear.

**The Meaning-First Colour Rule.** Green is money the life owns, teal is learning, ember is debt or strain, pink is happiness. A stat bar or chip takes the colour of what it measures, never a decorative one.

## Typography

**Display Font:** Lilita One (with Trebuchet MS, sans-serif)
**Body Font:** Nunito at 600, 700, and 800 (with Segoe UI, sans-serif)
**Signage Font:** Pixelify Sans at 500 (with monospace)

**Character:** Lilita One is a rounded, heavy game face that reads as painted signage once it gets its ink outline. Nunito is friendly and very legible at small sizes for the teen audience. Pixelify Sans belongs to the diorama, not the interface.

### Hierarchy
- **Display** (Lilita One, 2.25rem desktop / 1.7rem phone, line-height 1, slight tracking): the primary action label. White with a 2px ink outline and a 4px ink drop.
- **Headline** (Lilita One, 1.5rem, line-height 1): event titles on the brass ribbon, the Capiture wordmark (1.75rem). Same thick outline.
- **Title** (Lilita One, 1.25rem): character names, money figures on parchment, chapter titles, choice labels (17px). On wood it takes the thin outline (1.5px); on parchment it is plain ink or the colour of its economy.
- **Body** (Nunito 600, 16px, line-height 1.625): event prompts and the trade-off text. Smaller body (14px, 600, line-height 1.375) for situations and log entries.
- **Label** (Nunito 800, 11 to 13px): stat names, sub-lines, chips. Uppercase with slight tracking only for the small figure labels (Cash, Debt, Assets, "<Name>'s cash").
- **Signage** (Pixelify Sans 500, 11 to 16px): the chapter sign, the world label, and text drawn inside scenes.

### Named Rules
**The Painted Sign Rule.** White Lilita One text on wood or colour always carries the ink outline (2px for display, 1.5px for small). Without it, the face is not used on dark or coloured grounds.

**The Signage Stays In-World Rule.** Pixelify Sans appears only on signs that belong to the diorama (chapter sign, world label, scene text). Interface labels, buttons, and prose never use it.

**The Tabular Figures Rule.** Every number that can change (cash, debt, XP, FiCoins, counters) uses tabular figures so rolling counts do not jitter.

## Layout

Desktop first at 1440x900 with no page scroll; phones at 390 portrait are fully supported. The content column is capped at 1600px. The persistent HUD is a walnut strip at the top (64px, 72px on large screens) and a fixed walnut nav at the bottom (68px, 76px on large screens) that respects the safe-area inset.

The lobby is three columns on large screens: a lives rail (8.5rem, 10rem at xl), the stage column, and the life record (19 to 24rem). Below 1024px it collapses to one column and the lives rail becomes a horizontally scrolling, snapping strip. Short desktop windows (height up to 820px) compress padding, gaps, portraits, and the primary button rather than scrolling.

The diorama is drawn on a 320x200 core canvas extended to x -100 to 420, so stages up to 2.6:1 reveal more world instead of cropping it. The stage is sized with container queries to fit that ratio.

Spacing runs on a 4px base: 8px inside clusters, 12 to 16px between items, 14px inside panels, 20 to 24px between columns.

## Elevation & Depth

Depth is physical and layered, built the way game UI is: inset highlights and shades make bevels, a solid ink lip under each button gives it thickness, and a soft dark drop shadow lifts panels off the ground. Surfaces are never flat and never translucent glass.

### Shadow Vocabulary
- **Panel lift** (`inset 0 2px 0 rgb(255 214 160 / 0.3), inset 0 -5px 0 rgb(0 0 0 / 0.32), 0 10px 22px -6px rgb(0 0 0 / 0.55)`): walnut panels: a light top bevel, a darker bottom bevel, and a soft drop.
- **Button lip** (`inset 0 3px 0 <highlight>, inset 0 -4px 0 rgb(0 0 0 / 0.18), 0 <lip> 0 <lip colour>, 0 calc(<lip> + 6px) 14px -4px rgb(0 0 0 / 0.5)`): the solid lip is 5px by default, 7px on the primary, 3 to 4px on small controls.
- **Brass rail** (`inset 0 -3px 0 brass-600, inset 0 -4px 0 brass-300, 0 6px 16px -6px rgb(0 0 0 / 0.7)`): the inner edge of the top HUD (mirrored on the bottom nav).
- **Parchment inset** (`inset 0 -3px 0 parch-300, inset 0 2px 0 #fff`): reading surfaces set into wood.
- **Bar track** (`inset 0 2px 3px rgb(0 0 0 / 0.5)`): sunken progress tracks.
- **Selected glow** (`0 0 0 3px ink, 0 0 0 6px rgb(247 201 72 / 0.9), 0 0 18px 6px rgb(247 201 72 / 0.35)`): the active life medallion, pulsing slowly.

### Named Rules
**The Lip Is The Press Rule.** A dimensional button shows its lip at rest and loses it on press (moves down by lip minus 1px). If a control does not press, it does not get a lip.

## Shapes

Rounded but not soft, always outlined. Controls are gently rounded (10px), panels more so (16px), parchment insets in between (12px), the diorama frame most of all (24px), and bars, currency pills, and chips are full pills (999px). Small signs and portrait frames use 6 to 8px. Every interactive or structural shape takes a 3px ink border (2px on small parts and parchment). Portraits of lives are circles in the lives rail and rounded squares elsewhere. The road pennant is a clipped banner shape (square top, notched point at the bottom).

## Components

### Buttons
Chunky, tactile, and physical: a two-stop vertical face, a 3px ink border, a white top highlight, and a solid lip that collapses on press.
- **Shape:** gently rounded (10px); the primary action uses the panel radius (16px).
- **Primary:** brass face (brass-400 to brass-600), brass-900 lip of 7px, a gloss sweep that crosses it every 3.6 seconds, a Display label with a pill sub-line (ink text on brass-900 at 25%) and a pixel arrow.
- **Hover / Focus:** hover brightens slightly (brightness 1.07). Press moves the face down over 120ms ease-out-quint. Focus is a 3px brass-300 outline with 3px offset. Disabled goes greyscale and darker.
- **Secondary faces:** walnut (default, neutral actions like "Decide later"), green (actions that lead to earning or money), teal (learning actions), parchment (choices in an event, 4px parch-500 lip, ink text).

### Chips
- **Style:** full pill, 2px ink border, Nunito 800 at 12px, tabular figures.
- **State:** colour by meaning: cash-500 with ink for gains, ember-500 with white for losses and added debt, ink with parchment for neutral spend, cash-300 or a pale ember for stat changes.

### Cards / Containers
- **Wood panel:** walnut-700 body with the pixel plank texture, a 3px ink border, a brass hairline 5px inside the edge (brass-500 at 40%), and pixel brass corner brackets. 16px radius, 14px padding.
- **Parchment inset:** parch-100 to parch-200, 2px ink border, 12px radius, ink text. Use it for anything the player has to read inside wood.
- **Pine box:** pine-800 with a 3px ink border, for the trade-off lesson after a choice.
- **Shadow strategy:** see Elevation & Depth.

### Navigation
- **Top HUD:** a walnut strip with a brass rail along its bottom edge. Left: the hexagonal teal level badge overlapping the XP bar. Centre-right: the FiCoins pill (green plus button, ink pill, coin) and the life-cash pill (portrait, "<Name>'s cash", green face). Right: the account avatar in a brass frame.
- **Bottom nav:** a walnut strip with a brass rail on its top edge and six tabs with pixel icons. The active tab rises 12px as a raised walnut tab with a brass line on top and grows wider; on phones only the active tab shows its label.

### Progress Bars
- **Track:** full pill, 2px ink border, black at 45%, sunken inner shadow.
- **Fill:** colour of what it measures, with a white highlight on top and a dark line beneath; fills by width over 700ms ease-out-quint. Count labels inside use the small outlined display face.

### World Stage (signature)
The current life's pixel diorama in a 24px wood frame with a 7px wood border, an inner ink-bordered window, a pixel soil block beneath, and the chapter progress road under that. Characters are 16x24 string grids with palettes, drawn at 2x; the outline colour is always ink. A wooden chapter sign with a brass number plaque hangs top-left; the world label sits in an ink tag. Rendered with crisp edges so pixels never blur.

### Progress Slots
Four wood panels under the primary action, each with a coloured ribbon hanging from the top edge (teal for learning, ember for the streak, gold for an account reward, green for mastery), a pixel icon, and a title. They lift 4px on hover.

## Do's and Don'ts

### Do:
- **Do** outline everything in ink (3px on structures and controls, 2px on small parts), including display text.
- **Do** keep gold button faces for the single primary action of a view and keep FiCoins gold, life money green, XP teal, debt and stress ember, happiness pink.
- **Do** show the life's money with the character's portrait and "<Name>'s cash", and the account's FiCoins with the coin, in separate pills.
- **Do** draw new art, icons, and textures as pixel grids at the world's scale with crisp edges, using ink for outlines.
- **Do** put reading text on parchment insets (ink on parch-100) and keep light text on wood to parch-100 to parch-300.
- **Do** animate UI with transform and opacity over 120 to 220ms using ease-out-quint (cubic-bezier(0.22, 1, 0.36, 1)); progress fills and number roll-ups take 700ms. World loops are slow and stepped (sway 4s, bob 1.1s in 2 steps; clouds 70 to 110s; birds 26s).
- **Do** turn every animation and transition off under prefers-reduced-motion, including number roll-ups.

### Don't:
- **Don't** use purple or blue gradients, glassmorphism, or translucent frosted panels.
- **Don't** build screens from stacked white cards and stat tiles like a generic dashboard.
- **Don't** use emoji as artwork or icons; use the pixel icon set.
- **Don't** use Pixelify Sans for interface text, or Lilita One on a dark ground without its ink outline.
- **Don't** let a life's money appear in gold or near FiCoins, or let learning rewards appear as cash.
- **Don't** blur or smooth pixel art; never draw world art with gradients or anti-aliased curves.
