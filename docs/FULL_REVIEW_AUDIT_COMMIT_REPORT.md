# Full Review + Audit + Commit Report

Date: 2026-04-02
Requested by: `@maestro`

## Scope

Executed three requested workflows:

1. `@reviewer`
2. `@auditor`
3. `@commiter`

## Reviewer Results (`@reviewer`)

### High

1. Invalid calendar dates can pass inventory date validation.
   - File references:
     - `apps/api/src/routes/inventory.ts:23`
     - `apps/api/src/routes/inventory.ts:159`
     - `apps/api/src/routes/inventory.ts:190`
   - Risk: Data integrity issues in expiry-dependent workflows.
   - Recommendation: Strict round-trip date validation for `YYYY-MM-DD`.

### Medium

2. IP throttling can be reset via any successful login from that IP.
   - File references:
     - `apps/api/src/routes/auth.ts:128`
     - `apps/api/src/routes/auth.ts:129`
   - Risk: Weakens intended per-IP brute-force protection.
   - Recommendation: Clear only account/email bucket on success, keep IP decay independent.

## Auditor Results (`@auditor`)

### Medium

1. JWT stored in `localStorage`.
   - File references:
     - `apps/client/src/App.jsx:31`
     - `apps/client/src/App.jsx:447`
   - Risk: XSS token exposure.
   - Recommendation: Move to secure `HttpOnly` cookie-based session/token model.

2. Login throttling is process-local in-memory.
   - File references:
     - `apps/api/src/routes/auth.ts:23`
     - `apps/api/src/routes/auth.ts:24`
   - Risk: Reset on restart; not shared across instances.
   - Recommendation: Redis-backed distributed limiter with TTL.

### Low

3. JWT verification does not explicitly pin accepted algorithms.
   - File reference:
     - `apps/api/src/auth/jwt.ts:24`
   - Recommendation: Set explicit `algorithms` during verify.

4. Demo credentials visibility in dev and seeded static passwords.
   - File references:
     - `apps/client/src/components/auth/AuthView.jsx:59`
     - `apps/api/src/db/seed.ts:9`
   - Recommendation: Keep strictly dev-only and ensure disabled in shared environments.

### Auditor checks run

- `pnpm -r lint` passed.
- `pnpm -r test` passed (no test suites currently defined).
- `pnpm audit --prod` reported no known vulnerabilities.

## Commiter Results (`@commiter`)

- Commit hash: `1da57d9`
- Commit message: `harden auth and inventory flows and improve local dev ergonomics`

Committed files:

- `RUN_LOCAL.md`
- `apps/api/src/app.ts`
- `apps/api/src/config.ts`
- `apps/api/src/routes/audits.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/drugs.ts`
- `apps/api/src/routes/inventory.ts`
- `apps/api/src/services/alertEngine.ts`
- `apps/client/src/App.jsx`
- `apps/client/src/components/auth/AuthView.jsx`
- `apps/client/src/components/common/StaffActionModal.jsx`
- `package.json`

## Suggested Follow-up Backlog

1. Fix strict date round-trip validation in inventory handlers.
2. Adjust throttling logic to avoid full IP counter reset on unrelated successful login.
3. Migrate auth token transport from `localStorage` to secure cookies.
4. Move login throttling store to Redis for multi-instance reliability.
5. Pin JWT verify algorithm list.

## Remediation Status (2026-04-02)

### Completed

1. Strict calendar date validation fixed.
   - Updated `apps/api/src/routes/inventory.ts` to validate by UTC round-trip matching (`YYYY-MM-DD`), preventing auto-normalized invalid dates.

2. IP throttle reset weakness addressed.
   - Reworked auth throttling to avoid clearing IP failures on successful login.
   - Success now clears email failure bucket only.
   - Implemented shared-capable limiter abstraction in `apps/api/src/services/loginRateLimiter.ts`.

3. JWT verify algorithm pinned.
   - Updated `apps/api/src/auth/jwt.ts` to verify with explicit `algorithms: ['HS256']`.

4. Login rate limiting moved toward distributed support.
   - Added Redis-backed limiter path with memory fallback.
   - Wired `REDIS_URL` support in config and compose envs.
   - Files:
     - `apps/api/src/config.ts`
     - `apps/api/src/services/loginRateLimiter.ts`
     - `apps/api/src/routes/auth.ts`
     - `docker-compose.yml`
     - `.env.example`
     - `.env`
     - `apps/api/.env.example`

5. Reduced localStorage token exposure.
   - Moved auth transport from stored bearer token to `HttpOnly` cookie set by API login.
   - Added `/api/auth/logout` to clear cookie.
   - API auth middleware now accepts cookie token in addition to bearer header.
   - Files:
     - `apps/api/src/routes/auth.ts`
     - `apps/api/src/middleware/auth.ts`
     - `apps/client/src/App.jsx`

### Remaining / Future Hardening

- Full CSRF protection for cookie-based auth has now been implemented using double-submit token validation.

### Additional Completed Hardening (2026-04-02)

6. CSRF protection added for state-changing routes.
   - API now enforces CSRF for non-GET requests via `x-csrf-token` header + CSRF cookie match.
   - Login issues a CSRF token and cookie; logout clears both.
   - Client stores CSRF token and sends it on mutating requests.
   - Files:
     - `apps/api/src/middleware/csrf.ts`
     - `apps/api/src/app.ts`
     - `apps/api/src/routes/auth.ts`
     - `apps/client/src/App.jsx`
- Consider replacing the memory fallback limiter entirely in production with mandatory Redis.
