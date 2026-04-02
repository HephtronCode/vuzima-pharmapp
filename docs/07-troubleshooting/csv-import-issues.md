# CSV Import Issues

Last updated: 2026-04-02
Owner: Product + Engineering

## Symptom: Missing required columns

Likely cause:

- Header does not match expected schema.

Expected header:

```csv
drug_id,batch_number,expiry_date,quantity_on_hand
```

Fix:

- Download template from Inventory tab and retry.

## Symptom: Row N drug_id must be positive integer

Likely cause:

- `drug_id` has non-numeric or invalid value.

Fix:

- Use IDs from drugs list and ensure integer formatting.

## Symptom: Row N expiry_date must be valid date

Likely cause:

- Date not parseable.

Fix:

- Use `YYYY-MM-DD` format.

## Symptom: Row N quantity_on_hand must be non-negative integer

Fix:

- Remove decimals and negative values.
