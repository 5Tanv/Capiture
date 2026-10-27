# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite + Tailwind CSS (pinned by the team). No router, no UI libraries; fonts self-hosted via @fontsource.

## Users

Teens and students learning personal finance, playing in a browser (desktop first, phones fully supported). Secondary audience: Congressional App Challenge judges evaluating the game on a laptop in a few minutes.

## Product Purpose

Capiture is a financial-literacy life simulation. Players live through four independent lives (a broke college freshman, a working professional earning about $70,000/yr, an entrepreneur, a pro basketball player), making realistic money decisions in narrative events, while a separate account tracks what the player has actually learned. Success: players make better real-world money decisions and want to come back to the next event.

## Positioning

BitLife's life-sim narrative + Duolingo's educational progression + the lobby polish of top mobile games. Every event teaches a real trade-off; no choice is trivially right.

## Capabilities and Constraints

- **Account vs. lives is a hard separation.** The account owns username, avatar, knowledge XP/level, FiCoins (earned only from learning), badges, banners, accessories, educational and competition progress. Each life owns appearance, in-game cash, debt, assets, chapter/event progress, choices, and world unlocks. A life's wealth never converts into FiCoins.
- Current scope: homepage lobby, character switching, one sample event per life, placeholder views for Life Sim, Learn, Compete, Shop, Profile.
- Not yet built: 240-event database, auth, backend, leaderboards, payments, lessons, full customization.
- Rewards must never resemble loot boxes, gambling, or paid randomness.

## Brand Commitments

- Name: Capiture. Currency: FiCoins (educational). Life money is labeled as the character's own cash.
- Pinned art direction (from the team brief): original pixel-art characters and a colorful, nature-inspired world inside polished modern game UI with clean readable typography. Structural inspiration from Clash Royale's lobby and BitLife's life screen; no copied art, branding, or assets. Avoid purple/blue gradients, glassmorphism, generic dashboards, emoji as artwork.

## Evidence on Hand

All numbers, characters, and events are sample/demo data. No real users, testimonials, or metrics exist; do not fabricate any.

## Product Principles

1. Teach through consequence: show the trade-off after every choice, not a right/wrong verdict.
2. Keep the two economies legible: knowledge (FiCoins, XP) and life money must never be confused.
3. Always show what to do next.
4. Feel like a real game first; the lesson rides inside it.

## Accessibility & Inclusion

Readable contrast on all text, full keyboard operation, visible focus, reduced-motion support; target audience includes younger teens.
