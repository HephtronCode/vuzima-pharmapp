# Frontend Architecture

Last updated: 2026-04-02
Owner: Frontend Engineering

## App model

- Main shell and orchestration: `apps/client/src/App.jsx`
- UI split into reusable components under `apps/client/src/components/`
- Shared utilities and hooks under `apps/client/src/utils/` and `apps/client/src/hooks/`

## Key patterns

- Token-based API calls with centralized `api()` function.
- Role-aware tab rendering.
- Query-string persistence for table/search/page state.
- Local storage persistence for auth, theme, and page size.
- Pending states to prevent duplicate submits.
- Optimistic updates with rollback on failure.

## UX capabilities

- Toast notifications.
- Dark mode toggle.
- Search/sort/pagination on core tables.
- Sticky table headers.
- Staff admin action modal (reset/disable confirmations).
- Login animations via framer-motion with reduced-motion support.

## CSV import UX

- Client parser and validation in `apps/client/src/utils/csv.js`.
- Download template and inline examples in Inventory tab.
