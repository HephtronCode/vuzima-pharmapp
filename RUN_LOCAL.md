# Run Vuzima Pharma Go Locally (Live Mode)

This project requires PostgreSQL before the API can authenticate users.

## 1) Start infrastructure

```bash
docker compose up -d db cache
```

## 2) Apply database migrations and seed sample data

```bash
pnpm --filter @vuzima/api db:migrate
pnpm --filter @vuzima/api db:seed
```

## 3) Start API and client

Single terminal (recommended):

```bash
pnpm dev:servers
```

Or run separately:

Terminal 1:

```bash
pnpm --filter @vuzima/api dev
```

Terminal 2:

```bash
pnpm --filter @vuzima/client dev
```

## 4) Login credentials

- Admin: `admin@vuzimapharmago.app` / `AdminPass123!`
- Staff: `staff@vuzimapharmago.app` / `StaffPass123!`

## 5) If login fails with ECONNREFUSED

- Verify Postgres is running: `docker compose ps`
- Ensure port `5432` is free and mapped.
- Re-run migration + seed commands.
