# Troubleshooting Index

Last updated: 2026-04-02
Owner: Engineering

Use this index to jump to symptom-specific guides.

- General/common failures: `docs/07-troubleshooting/common-errors.md`
- Login and auth: `docs/07-troubleshooting/login-and-auth-issues.md`
- DB and migration: `docs/07-troubleshooting/db-and-migration-issues.md`
- CSV import: `docs/07-troubleshooting/csv-import-issues.md`
- UI/performance: `docs/07-troubleshooting/ui-and-performance-issues.md`

## Fast triage checklist

1. Is Postgres running?
2. Is API reachable on expected port?
3. Is client using correct `VITE_API_BASE_URL`?
4. Is user role/account state expected?
5. Were migrations applied?
