# Retainer Health Tracker API

Express 5 + TypeScript API for tracking client retainers and weekly check-ins.

The API stores retainers and check-ins in SQLite through Prisma. Retainer health is not persisted; it is computed from check-in history whenever retainer data is returned.

## Architecture

- `src/index.ts`: starts the HTTP server.
- `src/app.ts`: configures Express middleware, root route, `/api/v1` mount, and error handling.
- `src/api`: route modules using `express.Router()`.
- `src/services`: small business/database functions used by routes.
- `src/domain`: framework-independent domain logic, including `computeRetainerHealth`.
- `src/db.ts`: shared Prisma client.
- `src/env.ts`: Zod-validated environment variables.
- `prisma/schema.prisma`: SQLite schema for `Retainer` and `CheckIn`.
- `prisma/seed.ts`: deterministic demo data seed script.
- `test`: Vitest and Supertest coverage.

## Setup

Install dependencies from the repository root or from `api/`:

```sh
pnpm install
```

Create local environment config:

```sh
cp api/.env.sample api/.env
```

Generate Prisma client and run migrations:

```sh
cd api
pnpm run db:generate
pnpm run db:migrate
```

Optional demo data:

```sh
pnpm run db:seed
```

Start the API:

```sh
pnpm run dev
```

Default local API URL:

```txt
http://localhost:3000/api/v1
```

## Docker

From the repository root:

```sh
docker compose up --build
```

The API is exposed on `http://localhost:3000` by default. Override the host port with `API_PORT`:

```sh
API_PORT=4000 docker compose up
```

Prisma migrations run when the container starts. SQLite data is stored in the `api-sqlite-data` Docker volume.

Seed demo data after the API container is running:

```sh
docker compose exec api pnpm run db:seed
```

## Environment variables

| Name | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port used by the API process. |
| `NODE_ENV` | `development` | Runtime mode: `development`, `test`, or `production`. |
| `DATABASE_URL` | `file:./dev.db` | Prisma SQLite database URL. |

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm run dev` | Start the API in watch mode. |
| `pnpm run build` | Compile TypeScript to `dist/`. |
| `pnpm run start` | Start the compiled API. |
| `pnpm run typecheck` | Run TypeScript checks without emitting files. |
| `pnpm run test` | Run Vitest tests. |
| `pnpm run lint` | Run ESLint with fixes enabled. |
| `pnpm run db:generate` | Generate Prisma client. |
| `pnpm run db:migrate` | Run development migrations. |
| `pnpm run db:deploy` | Apply migrations in production/Docker. |
| `pnpm run db:seed` | Replace existing retainer/check-in data with deterministic demo data. |
| `pnpm run db:studio` | Open Prisma Studio. |

## Health rules

`computeRetainerHealth` returns:

```ts
{
  status: "green" | "amber" | "red";
  reason: string;
}
```

Rules:

1. Red if the most recent check-in is red.
2. Red if there has been no check-in during the previous 14 days.
3. Amber if either of the two most recent check-ins is amber, unless a red rule applies.
4. Green otherwise.
5. A retainer with no check-ins is red.

## API routes

All API routes are mounted under `/api/v1`.

Error responses use this shape:

```json
{
  "message": "Retainer not found.",
  "stack": "..."
}
```

In production, `stack` is replaced with a placeholder.

### GET /

Health/basic API root.

Response `200`:

```json
{
  "message": "API - 👋🌎🌍🌏"
}
```

### GET /emojis

Starter utility route.

Response `200`:

```json
["😀", "😳", "🙄"]
```

### GET /retainers

Returns all retainers ordered by `clientName`. Includes the latest check-in date and computed health. This route fetches the latest health-relevant check-ins without N+1 queries.

Response `200`:

```json
[
  {
    "id": "cm123",
    "clientName": "Northstar Health",
    "startDate": "2026-01-15T00:00:00.000Z",
    "status": "active",
    "leadEngineer": "Avery Chen",
    "latestCheckInDate": "2026-08-24T00:00:00.000Z",
    "health": {
      "status": "green",
      "reason": "Recent check-ins are green."
    }
  }
]
```

### GET /retainers/at-risk

Returns only retainers whose computed health is `red` or `amber`.

Ordering:

1. Red before amber.
2. Oldest latest check-in first within the same severity.

Response `200`:

```json
[
  {
    "id": "cm123",
    "clientName": "Northstar Health",
    "leadEngineer": "Avery Chen",
    "latestCheckInDate": "2026-08-01T00:00:00.000Z",
    "health": {
      "status": "red",
      "reason": "No check-in has been recorded in the past 14 days."
    }
  }
]
```

Implementation note: this endpoint computes health in application memory. That is simple and appropriate for a few hundred retainers. If the dataset grows substantially, move the filtering/sorting closer to SQL.

### GET /retainers/:id

Returns one retainer with up to 10 recent check-ins and computed health.

Response `200`:

```json
{
  "id": "cm123",
  "clientName": "Northstar Health",
  "startDate": "2026-01-15T00:00:00.000Z",
  "status": "active",
  "leadEngineer": "Avery Chen",
  "latestCheckInDate": "2026-08-24T00:00:00.000Z",
  "health": {
    "status": "green",
    "reason": "Recent check-ins are green."
  },
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:00:00.000Z",
  "checkIns": [
    {
      "id": "ck123",
      "retainerId": "cm123",
      "date": "2026-08-24T00:00:00.000Z",
      "summary": "Delivery is on track and stakeholders are aligned.",
      "ragStatus": "green",
      "riskNote": null,
      "createdAt": "2026-08-29T12:00:00.000Z"
    }
  ]
}
```

Responses:

- `200`: retainer found.
- `404`: retainer not found.

### POST /retainers

Creates a retainer.

Request:

```json
{
  "clientName": "Northstar Health",
  "startDate": "2026-01-15",
  "status": "active",
  "leadEngineer": "Avery Chen"
}
```

Fields:

- `clientName`: required string.
- `startDate`: required date.
- `status`: optional, `active` or `archived`.
- `leadEngineer`: required string.

Response `201`:

```json
{
  "id": "cm123",
  "clientName": "Northstar Health",
  "startDate": "2026-01-15T00:00:00.000Z",
  "status": "active",
  "leadEngineer": "Avery Chen",
  "latestCheckInDate": null,
  "health": {
    "status": "red",
    "reason": "No check-ins have been recorded yet."
  },
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:00:00.000Z",
  "checkIns": []
}
```

Responses:

- `201`: created.
- `400`: validation failed.

### PATCH /retainers/:id

Updates basic retainer fields. At least one field is required.

Request:

```json
{
  "leadEngineer": "Maya Patel",
  "status": "archived"
}
```

Allowed fields:

- `clientName`
- `startDate`
- `status`
- `leadEngineer`

Response `200` uses the same shape as `GET /retainers/:id`.

Responses:

- `200`: updated.
- `400`: validation failed.
- `404`: retainer not found.

### POST /retainers/:retainerId/check-ins

Creates a weekly check-in for a retainer. Health is not saved; future retainer responses compute health from check-in history.

Request:

```json
{
  "date": "2026-08-24",
  "summary": "Delivery is on track and stakeholders are aligned.",
  "ragStatus": "green",
  "riskNote": "Optional note when there is a risk."
}
```

Fields:

- `date`: required date.
- `summary`: required string.
- `ragStatus`: required, `green`, `amber`, or `red`.
- `riskNote`: optional string.

Response `201`:

```json
{
  "id": "ck123",
  "retainerId": "cm123",
  "date": "2026-08-24T00:00:00.000Z",
  "summary": "Delivery is on track and stakeholders are aligned.",
  "ragStatus": "green",
  "riskNote": "Optional note when there is a risk.",
  "createdAt": "2026-08-29T12:00:00.000Z"
}
```

Responses:

- `201`: created.
- `400`: validation failed.
- `404`: retainer not found.

## Data model

`Retainer`

- `id`
- `clientName`
- `startDate`
- `status`: `active` or `archived`
- `leadEngineer`
- `createdAt`
- `updatedAt`

`CheckIn`

- `id`
- `retainerId`
- `date`
- `summary`
- `ragStatus`: `green`, `amber`, or `red`
- `riskNote`
- `createdAt`

Relationship:

- One retainer has many check-ins.
- Deleting a retainer cascades to its check-ins at the database relation level.
- There is intentionally no delete API.
