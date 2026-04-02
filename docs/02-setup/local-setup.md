# Local Setup

Last updated: 2026-04-02
Owner: Engineering

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (for Postgres and Redis)

## 1) Install dependencies

```bash
pnpm install
```

## 2) Start infrastructure

```bash
docker compose up -d db cache
```

## 3) Run migrations and seed

```bash
pnpm --filter @vuzima/api db:migrate
pnpm --filter @vuzima/api db:seed
```

## 4) Start API and client

Terminal 1:

```bash
pnpm --filter @vuzima/api dev
```

Terminal 2:

```bash
pnpm --filter @vuzima/client dev
```

## 5) Login credentials

- Admin: `admin@vuzimapharmago.app` / `AdminPass123!`
- Staff: `staff@vuzimapharmago.app` / `StaffPass123!`

## Optional: run via docker-compose app services

The compose file includes `api`, `client`, and `worker` services. For day-to-day local development, running API/client directly from host terminals is usually faster and easier to debug.
