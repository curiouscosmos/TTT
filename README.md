# Retainer Health Tracker

Express + Expo app for tracking TTT client retainers, weekly check-ins, and derived health. Health is computed by the API from recent check-in history and shown in the mobile app list, detail, and at-risk views.

## Quick Start

Use Node 24 or any Node version supported by the installed pnpm release.

```sh
./setup.sh
```

The setup script creates missing env files, asks whether to run the API in Docker, seeds the API, and starts the iOS Expo app.

Manual Docker setup:

```sh
pnpm install
cp mobile/.env.example mobile/.env
docker compose up --build
docker compose exec api pnpm run db:seed
cd mobile
pnpm run ios
```

The API serves JSON at `http://localhost:3000/api/v1`. The mobile app runs through Expo.
`./setup.sh` creates missing `api/.env` and `mobile/.env` files from their templates.

For a physical device, use your Mac's LAN IP instead of `localhost`:

```sh
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

Put that value in `mobile/.env`, then start the app. Make sure the phone and Mac are on the same network and that the API is reachable at `http://<mac-lan-ip>:3000/api/v1`.

For the full one-command setup:

```sh
./setup.sh
```

## What Is Included

- Retainer list with computed health, latest check-in date, search/filter/sort, and pull-to-refresh.
- Create and edit retainer forms.
- Retainer detail with computed health reason and recent check-ins.
- Add check-in form with date, summary, RAG status, and optional risk note.
- At-risk screen listing red and amber retainers sorted by severity, then staleness.
- SQLite API persistence through Prisma.
- Deterministic seed data for 300 retainers.
- Dockerized API with one `docker compose up --build` entrypoint.

## Commands

```sh
pnpm install

# API without Docker
cd api
cp .env.sample .env
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
pnpm run dev

# API checks
pnpm run typecheck
pnpm run test

# Mobile
cd ../mobile
pnpm run ios
pnpm run lint
pnpm exec tsc --noEmit
```

## Architecture Decisions

- Health is computed server-side in the API. That keeps one source of truth for the rules and lets the rules change without shipping a mobile update.
- The mobile client treats API data as server state owned by TanStack Query. MobX is only used for local list search/filter/sort preferences.
- API boundary types are hand-written in the mobile app. A shared package or OpenAPI codegen would reduce drift, but it is extra machinery for this challenge size.
- SQLite-in-a-file is enough for a few hundred retainers and keeps local setup simple.
- Prisma is used for schema/migrations because it keeps the Express data layer short and typed.
- The API returns `health` and `latestCheckInDate` with retainer summaries so the list and at-risk screens do not duplicate health logic.
- The at-risk endpoint filters and sorts in application memory. That is fine at 300 retainers; SQL filtering would be the next step if this grew.
- Expo Router is used for the stack navigation because the app has a small number of route-backed screens and no auth/tab complexity.
- React Hook Form + Zod own form state and validation on mobile; Zod also validates API request bodies.

## Offline Design Note

If a lead logs a check-in with no usable signal, I would store the draft check-in locally before attempting the network request. The local record would include a client-generated idempotency key, retainer id, date, summary, RAG status, risk note, created timestamp, attempt count, and sync status. The UI would show it immediately as "saved on this device" and mark the retainer health as locally pending rather than pretending the server has accepted it.

On reconnect or app foreground, the app would replay pending check-ins with backoff. The API should accept the idempotency key so a retry cannot create duplicates if the first request reached the server but the response was lost. Server validation errors would mark the item as failed and require user action. Conflicts are low risk for append-only check-ins, but deleted or archived retainers still need handling: the app should keep the local note, show the sync failure, and let the user copy or discard it.

## What I Would Do With Another 4 Hours

- Add one mobile integration test around adding a check-in and invalidating list/detail/at-risk queries.
- Add a small root script set for `check`, `api:*`, and `mobile:*` so reviewers do not need to `cd` around.
- Add OpenAPI or a tiny shared type package only if this became more than a take-home app.
- Manually test the physical-device API URL flow on a phone, because that is where reviewer setup usually breaks.

## Time Log

- ~3h - Modeling/API: Built the Prisma schema, Express routes, validation, health computation, and seed script.
- ~4h - Mobile app: Built the Expo Router screens, API client, forms, list states, and at-risk flow.
- ~30m - Docker/setup: Added API Dockerfile and compose file with SQLite volume.
- ~30m - Tests: Focused on API route behavior and health computation.
- ~1.5h - Docs/review: Wrote setup, tradeoffs, offline note, and submission notes.

## AI Disclosure

I used ChatGPT/Codex while building and reviewing this project. AI helped with first-pass route wiring, README structure, and identifying missing submission requirements.

The health computation, API validation shape, cache invalidation choices, and mobile route behavior were reviewed and adjusted by hand. I rejected heavier suggestions like a shared package/codegen layer, duplicate UI components, and offline sync implementation because the assignment explicitly rewards a small, scoped solution.

Next time I would use Design first approach for mobile, implementing UI components first and not during the development time.

## Proud Of / Would Change

I am proud that the app answers the real Monday-morning question directly: which retainers are red or amber, and why. I would change the API/package naming and root scripts earlier so local commands line up cleanly from the start.

## Tested Platform

Built for iOS via Expo.

## Screen Recording

Link: https://drive.google.com/file/d/13np3lLzFSSDkQgbVYZxIHTndqtEbxFih/view?usp=sharing
