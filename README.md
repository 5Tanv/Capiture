# Capiture

A financial-literacy life simulation. Live four independent lives, make realistic money decisions, and learn why each choice matters.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/Capiture/
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build at http://localhost:4173/Capiture/
```

## Play it online

The game is published with GitHub Pages at **https://5tanv.github.io/Capiture/**.

`.github/workflows/deploy.yml` builds and deploys automatically on every push to `main`, and can also be run by hand from the Actions tab. The Vite `base` is `/Capiture/` to match the repository name; change it in `vite.config.ts` if the repository is renamed.

Tabs are kept in the URL hash (`/Capiture/#/learn`), so refreshing, the browser's back/forward buttons, and shared links all land on the right screen.

## Project layout

```
src/
  types/game.ts          Account vs. life types (kept strictly separate)
  data/                  Sample account, lives, events, and event history
  state/                 useReducer store + context (GameProvider)
  components/
    hud/                 TopBar (resources), BottomNav
    lobby/               Character select, life card, life log, main button, progress slots
    world/               Pixel-art renderer, sprites, and the four world scenes
    event/               Event panel (choose → outcome → continue)
    ui/                  Icon, ProgressBar
  screens/               Home lobby, Life Road (Life Sim tab), placeholders
  index.css              Design tokens (@theme) and the wood/brass/bevel material system
```

## Ground rules

- **Account vs. lives.** `PlayerAccount` owns XP, level, FiCoins, badges, and cosmetics. Each `LifeSim` owns its cash, debt, assets, stats, and chapter progress. Life actions in `gameReducer` must never touch the account.
- **Pixel art is data.** Characters and icons are string grids in `components/world/sprites.ts`, rendered by `PixelSprite`. Recolor a character by changing its palette.
- **Worlds** are drawn in `components/world/scenes.tsx` on a 320×200 core canvas that extends to x −60…380, so wide screens reveal more scenery instead of cropping.
- **Campaigns.** Each of the four lives plays a 70-event campaign (`src/campaign/content/*-events.json`), 40 events per run across three chapters (15/15/10). `src/campaign/` holds the typed content loader and validator, the role settings, and a pure, tested engine (calendar, integer-cent ledger, fictional portfolio, story callbacks). Run the tests with `node node_modules/vitest/vitest.mjs run`.
- **Learn.** `learn-catalog.json` holds the 80 shared lessons in 19 categories. Story events and the Learn page use the same lessons and one set of player-wide FiCoin receipts (5 per correct first answer, at most 10 per lesson). Auth and a backend come later.

## First-run tutorial

New players get a six-step guided tour (spotlight, arrow, and a short caption): three read-and-tap steps that explain what is the player's (XP, FiCoins) and what is a life's (cash), then three steps where the player plays Jordan's real textbook event. It shows once per browser (`localStorage` key `filife.tutorial`), can be skipped with the link or Esc, and can be replayed from Profile. The steps live in `src/data/tutorial.ts`.

## Redesign (branch `test/redesign`)

An art-direction pass over the prototype. Gameplay, state and the event loop are unchanged. See `ART_DIRECTION.md` for the rules.

- **Character system** (`src/sprites/`): one layered 32×48 pixel sprite, drawn at the same density as the world. It has 12 hairstyles, 10 hair colors, 8 skin tones, 6 eye colors, 7 tops, 6 bottoms, 4 shoes and 16 clothing dyes, plus hats, glasses, a backpack and a watch.
- **Character creator**: opens the first time each life is played and from every "Look" button. Each life saves its own name (1–32 characters) and look; names fill the `{collegeName}`-style tokens in the story. Everything, including each life's run and the player's lesson receipts, is saved in `localStorage` as `filife.save.v3`; older saves are migrated without losing names or FiCoins.
- **Scenes**: reusable locations keyed by `sceneId` (campus, dorm, suburb, city, arena). Events name where they happen, and the stage switches while the event is open.
- **Icons**: a 16×16 family in `src/sprites/icons.ts`.
- **Pages**: Learn (the full lesson catalog with search, filters and quizzes), Shop (a try-on fitting room; buying is not live), Profile (a player card, badges, the lives roster), Life Road (an illustrated trail) and Compete (an honest preview).
- **Art sheet**: open `#/showcase` to see the tokens, surfaces, icons, sprites and scenes side by side.
