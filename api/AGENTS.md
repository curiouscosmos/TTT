# API Agent Notes

This package is an Express 5 API with TypeScript.

## Structure

- `src/index.ts`: server startup only. Do not import this from tests.
- `src/app.ts`: Express app setup, middleware, root route, `/api/v1` mount, and error middleware.
- `src/api`: route modules built with `express.Router()`.
- `src/interfaces`: shared request/response types.
- `src/env.ts`: Zod environment parsing. Read `process.env` here, not elsewhere.
- `test`: Vitest + Supertest API tests.

## Rules

- Keep route files small; put reusable behavior in the smallest existing place that fits.
- Import `src/app.ts` in tests so tests do not start a listener.
- Use `.js` extensions in TypeScript relative imports.
- Use kebab-case filenames.
- Do not add folders, wrappers, or abstractions until a real file needs them.

## Checks

- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run lint` only when applying lint/format fixes is intended; it runs ESLint with `--fix`.
