# API: Inventory

Last updated: 2026-04-02
Owner: Backend Engineering

Base path: `/api/inventory`

Auth: required (`admin` or `staff`)

## GET /

Returns joined inventory rows with drug metadata.

## POST /

Create inventory batch.

```json
{
  "drug_id": 1,
  "batch_number": "PA-909",
  "expiry_date": "2027-10-22",
  "quantity_on_hand": 300
}
```

## POST /movement

Post stock movement with quantity guardrails.

```json
{
  "inventory_item_id": 1,
  "movement_type": "sale",
  "quantity_changed": -10,
  "notes": "Walk-in sale"
}
```

Rules:

- inventory item must exist
- resulting quantity cannot be below zero

## POST /import-csv

Bulk insert inventory rows from parsed CSV payload.

```json
{
  "rows": [
    {
      "drug_id": 1,
      "batch_number": "PA-101",
      "expiry_date": "2027-08-12",
      "quantity_on_hand": 500
    }
  ]
}
```

Rules:

- 1 to 2000 rows per request
- same validation shape as single create
