# Roles and Permissions

Last updated: 2026-04-02
Owner: Engineering

## Roles

- `admin`: full operational access including configuration, forecasting, reports, and staff management.
- `staff`: day-to-day operations access for inventory, alerts, analytics visibility, and audits.

## API route-level access

- Public:
  - `POST /api/auth/login`
  - `GET /api/health`
  - `GET /api/mock/dashboard`
- Admin only:
  - `/api/drugs`
  - `/api/dashboard`
  - `/api/forecast`
  - `/api/reports`
  - `/api/jobs`
  - `/api/users`
- Admin + staff:
  - `/api/inventory`
  - `/api/alerts`
  - `/api/reorder`
  - `/api/analytics`
  - `/api/audits`
  - `/api/suppliers`

## Account status

- Staff accounts can be set to `is_active = false` by admin.
- Disabled staff cannot log in and receive `403 Account disabled. Contact admin.`
- Admin can re-enable disabled staff accounts from the UI.

## UI behavior summary

- Admin sees tabs: Dashboard, Inventory, Alerts, Stock Audits, Reports, Staff.
- Staff does not see Reports or Staff tabs.
