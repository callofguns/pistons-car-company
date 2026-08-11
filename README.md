# Pistons: Car Company Inc. (Web)

A 2D business tycoon / car company simulator, built as a static React + TypeScript web app. Start a car manufacturer with $250,000, design vehicles, run production, and sell into a live market — all in the browser, no backend required.

Ported from an earlier Unity prototype; the simulation logic in `src/core/` is a direct, file-for-file port of that prototype's engine-agnostic Core layer.

## Stack

- **React 18 + TypeScript + Vite**
- **Zustand** for state (the store is the same "mutate + notify" pattern the Unity version used, just framework-native)
- **CSS Modules** — flat, minimal styling by design; no art yet, the current focus is correct layout and working buttons
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
├── screens/    # the 13 game screens
└── styles/     # shared CSS tokens (palette, spacing)
```

## Notes on this pass

- **HUD:** the top bar shows reputation/population/day/date, matching the reference layout — cash and research-point pills are intentionally left out for now (see the project's web-pivot plan). Both values are fully simulated in `src/core/economy.ts` and `src/core/research.ts`, just not surfaced in the persistent bar yet.
- **Visuals** are flat placeholders on purpose — the priority right now is correct layout and working navigation, not art.
- **"Game Bank"** is reinterpreted as an in-fiction investor cash advance rather than the reference's real-money IAP storefront.
- **Saves** are a single autosave slot in `localStorage`, written on month rollover and on tab close/hide.

## Deployment

Pushing to `main` builds and deploys to GitHub Pages automatically via `.github/workflows/deploy.yml`.

**Live site: https://callofguns.github.io/pistons-car-company/**
