# Backend Architecture

Last updated: 2026-04-02
Owner: Backend Engineering

## App entry

- Express app setup: `apps/api/src/app.ts`
- Server bootstrap: `apps/api/src/server.ts`

## Middleware chain

- `helmet`
- `cors`
- `express.json`
- `morgan`
- route handlers
- 404 handler
- 500 handler

## Auth and authorization

- JWT signing/verification: `apps/api/src/auth/jwt.ts`
- Middleware: `apps/api/src/middleware/auth.ts`
  - `requireAuth`
  - `requireRole([...])`

## Route modules

- `auth`, `health`, `mock`, `suppliers`, `drugs`, `inventory`, `dashboard`
- `alerts`, `reorder`, `analytics`, `reports`, `audits`, `forecast`, `jobs`, `users`

## Service modules

- `alertEngine.ts`
- `analyticsService.ts`
- `forecastService.ts`
- `reportService.ts`
- `notificationService.ts`

## DB layer

- PG pool client: `apps/api/src/db/client.ts`
- Migration runner: `apps/api/src/db/migrate.ts`
- Seed script: `apps/api/src/db/seed.ts`
