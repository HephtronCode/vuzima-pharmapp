# Security and Access

Last updated: 2026-04-02
Owner: Engineering + Security

## Authentication

- JWT access token issued on login.
- Passwords stored as bcrypt hashes.
- Disabled accounts blocked at login.

## Authorization

- Route-level role checks with `requireRole`.
- Admin-only operations protected in API and hidden in UI.

## Secret handling

- Use `.env` for local development only.
- Do not commit production secrets.
- Rotate `JWT_SECRET` outside development.

## Operational controls

- Disable staff account for immediate access revocation.
- Re-enable only with explicit admin decision.
- Reset temporary passwords through admin modal workflow.
