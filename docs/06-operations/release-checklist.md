# Release Checklist

Last updated: 2026-04-02
Owner: Engineering

## Pre-release checks

- `pnpm --filter @vuzima/client lint`
- `pnpm --filter @vuzima/client build`
- `pnpm --filter @vuzima/api lint`
- `pnpm --filter @vuzima/api build`
- `pnpm --filter @vuzima/api db:migrate` (target env)

## Functional smoke tests

- Admin login and Dashboard load.
- Staff login and restricted tab visibility.
- Inventory create and movement posting.
- Alert acknowledgement.
- Audit create/submit/reconcile.
- Report queue/process/list.
- Staff account create/reset/disable/enable.

## Documentation gate

- API changes reflected in `docs/04-api`.
- Setup and troubleshooting updated if behavior changed.
