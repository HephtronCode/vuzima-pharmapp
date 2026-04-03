# Vuzima Pharma Go Documentation

Last updated: 2026-04-02
Owner: Engineering

## What to read first

- Product and scope: `docs/01-product/overview.md`
- Local setup: `docs/02-setup/local-setup.md`
- Architecture: `docs/03-architecture/system-architecture.md`
- API reference: `docs/04-api/`
- User workflows: `docs/05-user-guides/`
- Operations and runbook: `docs/06-operations/runbook.md`
- Troubleshooting: `docs/07-troubleshooting/troubleshooting-index.md`

## Documentation map

- `01-product`: business context, roles, feature map
- `02-setup`: dev setup, env vars, DB migration/seed
- `03-architecture`: frontend/backend/data architecture
- `04-api`: route-level behavior and payloads
- `05-user-guides`: admin/staff actions and CSV import
- `06-operations`: day-2 ops, release checks, security
- `07-troubleshooting`: known failures and fixes
- `08-contributing`: coding and testing conventions

## Source of truth

- Runtime behavior is defined by code in `apps/api` and `apps/client`.
- Product context and phased planning lives in `PRD_TECHNICAL_DOCS/`.
- This `docs/` tree is the operator and developer handbook.

## Update rule

For any feature change:

1. Update at least one relevant file under `docs/`.
2. If API changes, update the matching file in `docs/04-api/`.
3. If schema changes, update `docs/03-architecture/data-model.md` and DB troubleshooting docs.

## Render Full-Stack Deploy

This repo includes `render.yaml` for blueprint-based setup.

### Services

- `vuzima-api` (Web Service)
- `vuzima-client` (Static Site)
- `vuzima-postgres` (Managed Postgres)
- `vuzima-redis` (Managed Redis)

### Post-deploy one-time commands

Run these from Render shell/one-off job on the API service:

```bash
pnpm --filter @vuzima/api db:migrate
pnpm --filter @vuzima/api db:seed
```

### Required Render env vars to set manually

- On API service:
  - `CLIENT_ORIGIN=https://<your-render-client-domain>`
- On static client service:
  - `VITE_API_BASE_URL=https://<your-render-api-domain>`

### GitHub Actions in this repo

- `.github/workflows/ci.yml` - lint/build on push and PR
- `.github/workflows/deploy-render.yml` - trigger Render deploy hooks on `main`
- `.github/workflows/keepalive.yml` - optional scheduled API health ping (disabled unless repo var enabled)
