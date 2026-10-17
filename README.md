# Pistons: Car Company Inc.

A 2D business tycoon / car company simulator, built as a static React + TypeScript web app. Start a car manufacturer with $250,000, design vehicles, run production, and sell into a live market — all in the browser, no backend required.

Ported from an earlier Unity prototype; the simulation logic in `src/core/` is a direct, file-for-file port of that prototype's engine-agnostic Core layer.

## Stack

- **React 18 + TypeScript + Vite**
- **Zustand** for state (the store is the same "mutate + notify" pattern the Unity version used, just framework-native)
- **CSS Modules** for styling, **Lucide** for icons, **Rubik** as the one typeface (self-hosted)
- **Hand-written SVG art** in `src/art/` — the isometric offices (one per HQ level), the car side views and the factory backdrop are all drawn in code, no image files
- **Vitest** for unit tests
- **Browser `localStorage`** for saves — no backend, deployable as a static site

## Getting started

```
npm install
npm run dev       # start the dev server
npm run test      # run the test suite
npm run typecheck # tsc --noEmit
npm run build     # production build to dist/
```

## Project layout

```
src/
├── core/       # pure simulation logic - time, economy, vehicles, production, market,
│                 research, staff, marketing, racing, company, save. Zero React dependency.
├── data/       # authored content (body styles, research tree, market segments, promotion
│                 tiers, rumor templates) as plain TS literals
├── store/      # Zustand store wrapping core/, plus the screen router and simulation loop
├── components/ # reusable widgets (StatRow, CarCarousel, ResearchNodeCard, TopHud, ...)
├── art/        # vector drawings: isometric offices, car side views, factory backdrop
├── screens/    # the game screens
└── styles/     # shared CSS tokens (palette, spacing)
```

## Notes on this pass

- **HUD:** the top bar matches the reference layout — reputation, reach, day, a big year medallion (with the pause/play/fast controls under it), month, cash and research points, plus the gold shop (Finance) and garage (main menu) buttons. Every sub-screen gets a back arrow.
- **Look:** a navy "boardroom blueprint" theme (tokens in `src/styles/tokens.css`), designed for a landscape phone first.
- **Language:** English only.
- **"Game Bank"** is reinterpreted as an in-fiction investor cash advance rather than the reference's real-money IAP storefront.
- **Saves** live in three `localStorage` slots, written on month rollover and on tab close/hide.

## Deployment

Pushing to `main` builds and deploys to GitHub Pages automatically via `.github/workflows/deploy.yml`.

**Live site: https://callofguns.github.io/pistons-car-company/**
