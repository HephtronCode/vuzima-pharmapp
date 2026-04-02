# Data Model

Last updated: 2026-04-02
Owner: Backend Engineering

## Core entities

- `users`: login identities, role (`admin`/`staff`), `is_active` status.
- `suppliers`: supplier metadata and lead time.
- `drugs`: master product catalog with pricing and reorder level.
- `inventory_items`: batch-level stock and expiry.
- `stock_movements`: immutable movement log.

## Expiry and reorder

- `expiry_alerts`: open/acknowledged alert records.
- `drug_reorder_settings`: safety stock and lead-time overrides.

## Analytics and reporting

- `consumption_snapshots`: daily computed consumption metrics.
- `report_exports`: queued/generated report jobs and file paths.

## Audit and reconciliation

- `stock_audits`: audit header and lifecycle state.
- `stock_audit_lines`: counted vs system quantities.
- `reconciliation_approvals`: admin decision records.

## Forecasting

- `forecast_runs`: run metadata and status.
- `forecast_outputs`: per-drug forecast and anomaly signals.

## Migration reference

See `apps/api/src/db/migrations/` and `docs/02-setup/database-migrations-seeding.md`.
