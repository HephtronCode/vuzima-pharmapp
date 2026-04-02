# UI and Performance Issues

Last updated: 2026-04-02
Owner: Frontend Engineering

## Symptom: App feels stale after action

Likely cause:

- Request failed or optimistic update rolled back.

Fix:

- Check toast messages and browser network panel.
- Click `Refresh Data` in top bar.

## Symptom: Modal action appears stuck

Likely cause:

- In-flight request or API connectivity issue.

Fix:

1. Wait for request completion.
2. Check API logs for failing endpoint.
3. Retry action.

## Symptom: Login animation feels heavy

Notes:

- Animation uses framer-motion with `LazyMotion` and reduced-motion handling.

Fix options:

- Ensure browser/system reduced motion settings if motion should be disabled.
- Validate bundle and runtime with `pnpm --filter @vuzima/client build`.
