# Capiture Art Direction

One cozy, 16-bit-inspired world with four lives inside it. Every screen should look like the same artist drew it. These rules are what keep it that way.

## 1. What changed from the prototype (audit)

| Problem in the prototype | Rule that fixes it |
|---|---|
| Walnut wood on nearly every surface, so nothing had priority | Six surfaces, each with one job (§4). Wood frames only the world and the event. |
| Characters were 16×24 sprites drawn at 2×, inside scenes drawn at 1× | One pixel grid: characters are 32×48 at 1×, the same density as the scenes (§3). |
| Four unrelated hand-drawn character grids | One layered sprite system with recolorable parts (§3). |
| Icons from 7 to 14 px with mixed outlines | One 16 px icon grid: same outline, same light, same three tones (§6). |
| Learn, Shop and Compete were a single small panel on empty green | Each page has its own layout pattern (§8). |
| Scenes were tied to the life, never to the event | Events name a `sceneId`, and scenes are reusable locations (§7). |

## 2. Palette

All colors live as tokens in `src/index.css` (`@theme`). Components never use raw hex values except inside pixel art.

| Role | Token | Value | Use |
|---|---|---|---|
| Forest (ground) | `pine-800` / `pine-900` / `pine-950` | `#263D35` / `#1d3029` / `#14231e` | App background and HUD |
| Sage | `sage-500` / `sage-300` | `#63866F` / `#a9c1ab` | Secondary text on dark, quiet accents |
| Warm gold | `brass-400` / `brass-500` / `brass-600` | `#f4d58d` / `#EBCB8B`→`#e8b452` / `#c98f2e` | Primary action, FiCoins, rewards |
| Cream | `parch-100` / `parch-200` | `#fbf5e6` / `#F1E6CC` | Reading surfaces |
| Wood | `walnut-400` … `walnut-900` | `#9A6545` … `#3a2418` | The world frame, the nav and the event frame only |
| Ink | `ink` | `#241a16` | Outlines and body text on cream |

### Financial meaning (never themed)

These colors keep their meaning in every life. Life themes may not reuse them as decoration.

| Meaning | Token | Value |
|---|---|---|
| Money up, healthy | `cash-500` | `#4bb36b` |
| Loss, debt, warning | `ember-500` | `#d65a3f` |
| Learning, knowledge XP | `xp-500` | `#3f9fd6` |
| FiCoins, rewards | `brass-500` | `#e8b452` |

## 3. Pixel grid and characters

- **World pixel:** 1 unit in the scene SVG (`viewBox -100 0 520 200`; the core composition is 320×200). Everything in the world uses this unit.
- **Character sprite:** 32×48 at 1:1 with world pixels. Proportions: head 18×16 (about ⅓ of the height), torso 12 wide, 2 px gap between the legs.
- **Portrait:** a 26×26 crop of the same sprite (head and shoulders), scaled by integers only. It is not a separate drawing, so a portrait can never disagree with the world sprite.
- **Layers, back to front:** backpack · back hair · body · face · bottoms · shoes · top · straps and watch · front hair · drape strands · hat · glasses.
- **Recoloring:** every part is drawn in tones (0 light · 1 base · 2 shade · 3 deep), never in colors. Skin, hair and eyes use hand-tuned ramps; clothing dyes generate a hue-shifted ramp (shadows cool toward violet, highlights warm toward yellow).
- **Outline:** 1 px, outside only, *colored*: each outline pixel takes the darkest neighboring material's deep tone pushed toward ink. No pure black.
- **Light:** from the top-left. Right edges and undersides take the shade tone, top-left rims take the light tone, and skin under hair or a brim is shaded.
- **Animation:** a two-frame idle (the upper body drops 1 px), plus a blink every 5 s. Both are off under reduced motion.
- **Rendering:** sprites are composited to PNG data URLs (`src/sprites/render.ts`) and drawn with `image-rendering: pixelated`. They are cached per look.

## 4. Surfaces (decoration means priority)

| Surface | Class | Looks like | Used for |
|---|---|---|---|
| Game frame | `panel-wood` | Walnut planks, brass corners | The world stage, the event, the character creator stage |
| Reading | `surface-reading` | Cream paper, ink border, soft lip | Lessons, scenarios, a life's record |
| HUD | `surface-hud` | Translucent forest glass, 2 px ink | Top bar counters, compact stats |
| Collection | `surface-collection` | Dark felt tray with slot cells | Badges, wardrobe, shop shelves |
| Event | `panel-wood` + `surface-reading` | Wood frame holding paper | Scenario and choices |
| Utility | `surface-utility` | Almost nothing: a faint tint | Secondary lists, helper text |

Rule: one framed (wood) object per view, two at most.

## 5. Type

| Role | Face | Notes |
|---|---|---|
| Display: numbers, buttons, headings | Lilita One | White with an ink outline (`txt-game`) on dark; ink on cream |
| Body and lessons | Nunito 600–800 | Never a pixel font for reading text |
| In-world signage only | Pixelify Sans | Chapter signs and location labels |

Scale: 12 / 13 / 14 / 15 / 17 / 20 / 24 / 32 / 40 px. Body copy is at least 14 px, and at least 15 px on reading surfaces.

## 6. Icons

16×16 grid, a 1 px colored ink outline, three tones per material, and light from the top-left, the same as the sprites. Icons that carry a meaning (cash, debt, XP, FiCoins) use the financial colors above and are always paired with a text label or tooltip. The source is `src/sprites/icons.ts`.

## 7. Scenes

- A scene is a reusable **location** (`src/components/world/scenes.tsx`), not an event illustration. Each scene returns backdrop and foreground layers and a stand point for the character.
- Events reference a location with `sceneId`. The stage shows the life's home location in the lobby and switches to the event's location while the event is open.
- Composition: sky or back wall → far layer → architecture → ground plane → props → character → foreground props.
- Motion: clouds, leaves, lights and NPC idles only. Transform and opacity, under 2 px of travel, and disabled under reduced motion.

## 8. Life themes

`src/theme/lifeThemes.ts` gives each life an accent, a secondary accent, a deep tone and an ambient tint. The theme sets CSS variables on the app shell (`--life-accent` …), and components read those variables. The UI structure never changes between lives.

| Life | Mood | Accent / secondary / deep |
|---|---|---|
| College Freshman | Youthful, hopeful | Terracotta `#d0673f` / sage `#7c9f7e` / denim `#3d5a8a` |
| Working Professional | Warm, grounded | Peach `#e3a07e` / dusty rose `#c27c8a` / sage `#5f7b62` |
| Entrepreneur | Ambitious, modern | Teal `#2f8a86` / brass `#c9a24a` / navy `#24345a` |
| Pro Athlete | Bold, energetic | Burnt orange `#e0702e` / gold `#e8b64a` / slate `#3b4f7a` |

## 9. Motion

| Token | Duration | Use |
|---|---|---|
| press | 120 ms | Button lip collapse |
| pop | 320 ms | Selection, equip, reward chips |
| rise | 260 ms | Panels entering |
| count | 700–900 ms | Money and XP count-ups |
| idle | 1.3 s step | Character bob |

All motion respects `prefers-reduced-motion`.

## 10. Layout and accessibility

- **Spacing scale:** 4, 8, 12, 16, 24 and 32 px.
- **Radii:** 10 (controls), 16 (panels) and 999 (pills).
- **Breakpoints:** 390 (phone), 768 (tablet), 1024 (laptop) and 1440 (desktop). Below 1024, secondary stats collapse, and the world plus the main action come first.
- **Touch targets:** at least 44 px.
- **Focus:** a visible 3 px gold ring.
- **Contrast:** text meets WCAG AA against its surface.
- **Pixel art:** always scaled by integer factors where possible, and never smoothed.

## 11. Known art gaps (honest list)

- Characters are front-facing only. There are no walk cycles or side views yet.
- NPCs reuse the player sprite system with random looks. They have no unique silhouettes yet.
- The scenes are hand-built SVG pixel geometry. A professional pixel artist should do a polish pass on lighting, tile textures and props.
