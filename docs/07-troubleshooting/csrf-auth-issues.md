# CSRF and Auth Issues

Last updated: 2026-04-02
Owner: Engineering

## Symptom: `403 Invalid CSRF token`

Likely causes:

- Missing `x-csrf-token` header on mutating request.
- CSRF token in header does not match `vuzima_csrf_token` cookie.
- Stale token after logout/login cycle.

How to verify:

1. In browser devtools, inspect request headers for `x-csrf-token`.
2. Check cookies include `vuzima_csrf_token` and `vuzima_access_token`.
3. Confirm header token equals the CSRF cookie value.

Fix:

1. Log out and log in again to refresh token pair.
2. Ensure frontend sends `credentials: include` for API calls.
3. Ensure non-GET requests include `x-csrf-token`.

## Symptom: Logged in UI but API requests return `401 Unauthorized`

Likely causes:

- `vuzima_access_token` cookie missing/expired.
- Browser blocking cookies due to environment mismatch.

How to verify:

1. Check cookies for `vuzima_access_token`.
2. Confirm API/client origins match configured CORS and cookie settings.

Fix:

1. Re-login.
2. Confirm `CLIENT_ORIGIN` and client URL are aligned.
3. In local/dev, verify both app and API are using expected hostnames and ports.

## Symptom: Works in one environment but fails in another

Likely causes:

- `secure` cookie behavior mismatch (HTTP vs HTTPS).
- Incorrect environment variables in deployment.

Fix:

1. Verify `NODE_ENV`, `CLIENT_ORIGIN`, and reverse-proxy behavior.
2. Ensure production traffic is HTTPS when secure cookies are enabled.
3. For cross-site hosting (different API and frontend domains), set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`.
