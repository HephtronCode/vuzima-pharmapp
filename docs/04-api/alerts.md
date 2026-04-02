# API: Alerts and Reorder

Last updated: 2026-04-02
Owner: Backend Engineering

Auth: required (`admin` or `staff`)

## Alerts (`/api/alerts`)

### GET /expiry

- Returns open expiry alerts joined with inventory and drug information.

### POST /acknowledge

```json
{
  "alert_id": 12
}
```

- Marks alert as acknowledged by current user.

## Reorder (`/api/reorder`)

### GET /suggestions

- Returns reorder calculations including:
  - current stock
  - reorder point
  - suggested order qty
  - below-reorder flag
