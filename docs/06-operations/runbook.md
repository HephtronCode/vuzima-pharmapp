# Operations Runbook

Last updated: 2026-04-02
Owner: Engineering

## Health checks

- API health: `GET /api/health`
- API logs: terminal running `pnpm --filter @vuzima/api dev`
- Client logs: terminal running `pnpm --filter @vuzima/client dev`

## Common restart procedure

1. Stop API and client processes.
2. Ensure DB and cache are running:

```bash
docker compose ps
```

3. Restart API and client dev servers.

## Database reset (local only)

1. Stop services.
2. Remove Postgres volume if a full reset is required.
3. Re-run migrations and seed.

## Access management

- Use admin Staff tab for create/reset/disable/enable.
- Disabled staff cannot authenticate.

## Escalation

- First line: engineering on-call.
- Include failing endpoint, payload, and timestamp when escalating.
