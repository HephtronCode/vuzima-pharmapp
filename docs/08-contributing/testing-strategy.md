# Testing Strategy

Last updated: 2026-04-02
Owner: Engineering

## Current baseline

- Static/type checks via lint/build scripts.
- Manual feature smoke tests in local environment.

## Required checks before merge

```bash
pnpm --filter @vuzima/client lint
pnpm --filter @vuzima/client build
pnpm --filter @vuzima/api lint
pnpm --filter @vuzima/api build
```

## Manual smoke coverage

- Auth login for admin and staff.
- Role-gated tab visibility.
- Inventory add/movement/csv import.
- Alerts acknowledge.
- Audit lifecycle.
- Report queue/process.
- Staff management actions.

## Future improvements

- Add API integration tests for critical routes.
- Add frontend component tests for form validation and modal flows.
