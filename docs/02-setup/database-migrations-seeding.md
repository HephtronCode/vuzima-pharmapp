# Database Migrations and Seeding

Last updated: 2026-04-02
Owner: Engineering

## Commands

```bash
pnpm --filter @vuzima/api db:migrate
pnpm --filter @vuzima/api db:seed
```

## How migration works

- Migration SQL files live in `apps/api/src/db/migrations/*.sql`.
- Applied migrations are tracked in `schema_migrations`.
- Files are applied once, in lexical order.

## Current migration list

1. `001_init.sql`
2. `002_phase2_alerts_reorder.sql`
3. `003_constraints_and_uniques.sql`
4. `004_phase3_analytics_reports.sql`
5. `005_phase4_stock_audits.sql`
6. `006_phase5_forecaster.sql`
7. `007_phase6_users_admin_controls.sql`

## Seed behavior

- Inserts baseline users (admin/staff), suppliers, drugs, inventory.
- Computes initial analytics snapshots.
- Runs initial forecast model.

## Safety notes

- Seeding uses upsert/do-nothing patterns for baseline data.
- Do not rely on seed credentials in production.
