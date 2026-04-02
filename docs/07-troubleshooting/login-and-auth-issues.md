# Login and Auth Issues

Last updated: 2026-04-02
Owner: Engineering

## Symptom: Invalid credentials

Likely cause:

- Wrong email/password.

Verify:

- Test seeded credentials if in local dev.

Fix:

- Correct credentials or reset temporary password from Staff tab (admin).

## Symptom: Account disabled. Contact admin.

Likely cause:

- Staff account `is_active = false`.

Verify:

- Check Staff table status in admin UI.

Fix:

- Admin uses `Enable Account` action.

## Symptom: 401 Unauthorized on protected APIs

Likely cause:

- Missing/expired/invalid token.

Verify:

- Confirm `Authorization: Bearer <token>` is present.

Fix:

1. Log out and log in again.
2. Ensure API and client point to same environment.

## Symptom: 403 Forbidden for some actions

Likely cause:

- Role restrictions.

Fix:

- Use admin account for admin-only routes/tabs.
