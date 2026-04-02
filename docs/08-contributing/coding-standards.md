# Coding Standards

Last updated: 2026-04-02
Owner: Engineering

## General

- Keep changes scoped and feature-focused.
- Prefer explicit validation for request payloads (Zod in API).
- Favor readable naming and small functions.

## API

- Validate all request payloads.
- Return clear status codes and user-safe messages.
- Protect routes with auth and role middleware.

## Client

- Add pending/disabled states for async actions.
- Use toasts for success/error feedback.
- Preserve existing UX patterns for forms and tables.

## Quality checks

- Run lint/build for touched apps before merge.
