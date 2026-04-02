# CSV Import Guide

Last updated: 2026-04-02
Owner: Product Operations

## Where to import

- Open `Inventory` tab.
- Use `Import Inventory CSV` section.

## Recommended workflow

1. Click `Download CSV Template`.
2. Keep header exactly as generated.
3. Fill one row per inventory batch.
4. Upload and confirm success toast.

## Required format

Header:

```csv
drug_id,batch_number,expiry_date,quantity_on_hand
```

Rules:

- `drug_id`: positive integer
- `batch_number`: optional string
- `expiry_date`: valid date (`YYYY-MM-DD`)
- `quantity_on_hand`: non-negative integer

## Common validation errors

- Missing required columns
- Invalid `drug_id`
- Invalid `expiry_date`
- Negative `quantity_on_hand`

See `docs/07-troubleshooting/csv-import-issues.md` for fixes.
