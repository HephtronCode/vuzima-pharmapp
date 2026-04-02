# API: Stock Audits

Last updated: 2026-04-02
Owner: Backend Engineering

Base path: `/api/audits`

Auth: required (`admin` or `staff`), with admin-only reconcile action.

## GET /

- List audits with status and aggregated variance.

## POST /

- Create draft audit.

## GET /:id

- Returns audit header + lines.

## POST /:id/lines

- Upsert audit line for inventory item in draft state.
- Stores system quantity, counted quantity, and difference.

## POST /:id/submit

- Transitions audit from `draft` to `submitted`.
- Requires at least one line.

## POST /:id/reconcile

Admin only.

```json
{
  "status": "approved",
  "comments": "Ready"
}
```

- `approved`: inventory quantities are reconciled to counted values.
- `rejected`: audit returns to draft.
