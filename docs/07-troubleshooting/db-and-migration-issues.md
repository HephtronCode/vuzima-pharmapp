# DB and Migration Issues

Last updated: 2026-04-02
Owner: Backend Engineering

## Symptom: ECONNREFUSED 127.0.0.1:5432

Likely cause:

- Postgres not running.

Verify:

```bash
docker compose ps
```

Fix:

```bash
docker compose up -d db cache
pnpm --filter @vuzima/api db:migrate
pnpm --filter @vuzima/api db:seed
```

## Symptom: Migration failed

Likely cause:

- SQL syntax issue, lock contention, or prior partial state.

Verify:

- Check migration logs and `schema_migrations` records.

Fix:

1. Resolve SQL issue.
2. Re-run migration command.
3. If local only, reset DB and rerun migrate/seed.

## Symptom: Column is missing (for example `is_active`)

Likely cause:

- Migration `007_phase6_users_admin_controls.sql` not applied.

Fix:

```bash
pnpm --filter @vuzima/api db:migrate
```
