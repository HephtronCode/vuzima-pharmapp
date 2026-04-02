# Common Errors

Last updated: 2026-04-02
Owner: Engineering

## API returns 500 with little detail

Likely cause:

- Unhandled exception in route/service or invalid DB state.

Verify:

- Check API terminal logs.

Fix:

1. Inspect stack trace.
2. Confirm migration level and data assumptions.
3. Retry failing request with minimal payload.

## 404 Route not found

Likely cause:

- Wrong path or HTTP method.

Verify:

- Compare against docs in `docs/04-api`.

Fix:

- Correct endpoint path and method.

## CORS failure in browser

Likely cause:

- `CLIENT_ORIGIN` mismatch.

Verify:

- Check API env and browser origin.

Fix:

- Set `CLIENT_ORIGIN` to active client URL and restart API.
