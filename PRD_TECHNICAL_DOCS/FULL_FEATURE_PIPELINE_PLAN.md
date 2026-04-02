# Kemia Full Feature Pipeline (Activated)

Version: 1.0
Status: Active
Source Inputs:
- `PRD_TECHNICAL_DOCS/Technical_Documentation.md`
- `PRD_TECHNICAL_DOCS/PRD.md`

## 1) Delivery Intent

Build Kemia as an offline-first, secure pharmacy operations platform for African market conditions, starting with a high-confidence MVP and expanding into predictive and mobile-first operations.

## 2) Product Scope Alignment

### MVP baseline (must ship first)
- Auth + RBAC (admin/staff)
- Drug onboarding and inventory CRUD
- Immutable stock movement ledger
- Dashboard summary (total stock value)
- Dockerized local environment + CI baseline

### Critical PRD scope to include in full pipeline
- Expiry alert engine (90/30/7 day windows)
- Reorder threshold + reorder suggestions (ROP formula)
- Consumption analytics (weekly, monthly, months-of-stock)
- Exportable reports (PDF/Excel/CSV)
- Mobile-first stock audit and discrepancy approval
- AI forecaster v1 (demand forecast + anomaly alerts)

## 3) Architecture Plan (PERN-Citadel)

### Services
- `client` (React + Vite + Tailwind + shadcn/ui)
- `api` (Node + Express + TypeScript)
- `worker` (BullMQ jobs for async tasks)
- `db` (PostgreSQL)
- `cache/queue` (Redis)

### Core technical standards
- Type-safe contracts (Zod/OpenAPI)
- Transaction-safe inventory mutation
- Immutable movement and audit logs
- Caching for dashboard and drug list reads
- Background jobs for alerts, exports, forecasting

## 4) Data Model Plan

### Keep from technical baseline
- `users`, `drugs`, `inventory_items`, `stock_movements`

### Add for full feature pipeline
- `suppliers` (lead_time_days, contact details)
- `drug_reorder_settings` (reorder_level, safety_stock, lead_time_override)
- `expiry_alerts` (inventory_item_id, alert_tier, sent_at, channel)
- `notifications` (user_id, type, payload, status)
- `stock_audits` and `stock_audit_lines` (offline counts + reconciliation)
- `reconciliation_approvals` (admin approval workflow)
- `consumption_snapshots` (daily/weekly metrics cache)
- `forecast_runs` and `forecast_outputs` (AI v1 job outputs)
- `report_exports` (job status, storage path, format)
- `audit_logs` (critical action trail)

## 5) Full Feature Pipeline Phases

## Phase 0 - Foundation (Week 1)
Goals:
- Monorepo scaffolding and Docker Compose
- DB migration tooling and seed strategy
- API app skeleton, auth middleware, error handling
- CI setup (lint, unit tests, typecheck)
Exit criteria:
- `docker compose up` boots all services
- CI passes on sample PR

## Phase 1 - MVP Core Inventory (Weeks 2-4)
Goals:
- Auth login and role guards
- Drug CRUD + inventory list views
- Stock movement transaction endpoint
- Dashboard total stock value endpoint and UI
Exit criteria:
- Admin/staff flows usable end-to-end
- Inventory quantity integrity validated by tests

## Phase 2 - Safety and Reorder Intelligence (Weeks 5-6)
Goals:
- Expiry tier alerts (90/30/7)
- Low-stock alerts + reorder suggestion engine (ROP)
- Notification center (in-app first, email/SMS adapters optional)
Exit criteria:
- Scheduled jobs create correct alerts
- Reorder suggestions visible per drug

## Phase 3 - Analytics and Reporting (Week 7)
Goals:
- AMC, weekly consumption, months-of-stock calculations
- Dashboard cards for fast/slow moving and expiring value
- Report export jobs (CSV first, PDF/Excel next)
Exit criteria:
- Exports generated asynchronously and downloadable

## Phase 4 - Mobile-First Stock Audit (Weeks 8-9)
Goals:
- PWA shell, offline inventory cache, queued submissions
- Stock count workflow and discrepancy report
- Admin reconciliation approval before stock update
Exit criteria:
- Offline capture works and sync conflict rules verified

## Phase 5 - AI Forecaster v1 (Week 10)
Goals:
- 30-day forecast for top fast-moving items
- Anomaly detection for spikes/dead stock
- Forecast widgets and alert feed integration
Exit criteria:
- Daily forecast job stable and dashboard insight cards live

## Phase 6 - Hardening and Launch Readiness (Week 11)
Goals:
- Security review (OWASP top 10 checks)
- Performance tuning and observability dashboards
- UAT scripts and release checklist
Exit criteria:
- Go-live checklist signed off

## 6) API Roadmap (contract-first)

### Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Inventory and drugs
- `GET/POST/PUT /api/drugs`
- `GET /api/inventory`
- `POST /api/inventory/movement`

### Alerts, analytics, reporting
- `GET /api/alerts/expiry`
- `GET /api/reorder/suggestions`
- `GET /api/analytics/consumption`
- `POST /api/reports/export`
- `GET /api/reports/:id`

### Audit module
- `POST /api/audits`
- `POST /api/audits/:id/lines`
- `POST /api/audits/:id/submit`
- `POST /api/audits/:id/reconcile`

### Dashboard and AI
- `GET /api/dashboard/summary`
- `GET /api/dashboard/forecast`
- `GET /api/dashboard/anomalies`

## 7) Security and Compliance Baseline

- JWT access + refresh rotation, secure cookie option
- Password hashing with Argon2/Bcrypt, strict rate limits on auth routes
- Row-level authorization in service layer (and DB policies where practical)
- Immutable audit records for stock, price, role, and approval changes
- Encryption in transit (TLS) and at rest for backups/secrets
- NDPR/GDPR-ready data retention and export/delete policy hooks

## 8) Test Strategy

- Unit tests: domain services (ROP, expiry windows, reconciliation)
- Integration tests: API + DB transaction boundaries
- E2E tests: login, stock movement, audit approval, report export
- Offline tests: queue/sync behavior and conflict resolution

## 9) FullFeaturePipeline Activation State

Activated now with this plan.

Immediate execution order:
1. Phase 0 backlog creation and repo scaffolding
2. Schema migration draft for baseline + added tables
3. API contract definitions and mock responses
4. UI route shell and auth wiring
