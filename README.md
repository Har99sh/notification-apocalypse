# Notification Apocalypse

A short, deterministic browser game about finishing deep work while triaging an increasingly absurd notification flood.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Add `?speed=4` (up to `10`) to accelerate the simulation for testing.

Cloudflare Pages setup, CI/CD operation, custom-domain configuration, and rollback procedures are documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run generate
npm run check:build
npm run test:e2e
```

## Controls

- Tap or click **Ignore**, **Snooze**, or **Open**.
- On touch screens, swipe left to ignore, down to snooze, or right to open.
- On a keyboard, use `1`, `2`, and `3`. Press `Escape` to close an open detail.
- The game pauses automatically when its tab is hidden.

## Architecture

The Pinia game store is the single simulation authority. It advances from elapsed time rather than interval counts, owns scoring and consequences, and consumes a seeded notification schedule. Notification content and correctness metadata live in a dedicated typed data module. Vue components render state and dispatch player intent without implementing game rules. Settings and personal bests use one versioned local-storage record; no other data leaves the browser.
