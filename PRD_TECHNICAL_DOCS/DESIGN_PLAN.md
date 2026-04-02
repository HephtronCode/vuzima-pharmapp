# Kemia Design Plan (Mobile-First)

Version: 1.0
Status: Active

## 1) Design Direction

Design for trust, speed, and clarity in high-pressure pharmacy workflows.

Principles:
- Fast recognition over recall
- Risk-first visual hierarchy (expiry and low-stock always surfaced)
- Minimal taps for core tasks (count, adjust, approve)
- Accessible by default (WCAG 2.2 AA)

## 2) Information Architecture

Primary navigation:
- Dashboard
- Inventory
- Alerts
- Stock Audit
- Reports
- Settings

Role-aware visibility:
- Admin: all modules, approvals, financial analytics
- Staff: inventory operations, audits, limited financial visibility

## 3) Core Screens and UX Flows

### Login
- Email/password with clear error states
- Optional remember-me for trusted device

### Dashboard (single pane)
- KPI cards: total stock value, expiring value, low-stock count
- Forecast widget (top movers, 30-day signal)
- Alert rail (critical first)

### Inventory Command Center
- Dense table + mobile card mode
- Fast filters: expiry window, low-stock, supplier, category
- Batch-level drill-down
- Primary actions: add drug, add batch, adjust stock

### Expiry and Reorder Alerts
- Severity bands: 90d (info), 30d (warning), 7d (critical)
- One-tap actions: mark acknowledged, generate reorder suggestion

### Stock Audit (mobile-first)
- Section selection
- Offline count entry (large touch targets)
- Optional barcode scan placeholder for v1.1
- Submit -> discrepancy summary -> admin approval queue

### Reports
- Preset reports with date and branch filters
- Async generation status and download center

## 4) Visual System

### Color tokens (example)
- `--bg`: #F7FAFC
- `--surface`: #FFFFFF
- `--text`: #0F172A
- `--primary`: #0E7490
- `--success`: #15803D
- `--warning`: #B45309
- `--danger`: #B91C1C

### Typography
- Headings: `Sora`
- Body/UI: `Manrope`
- Numeric/KPI: `IBM Plex Sans`

### Components (shadcn + custom)
- KPICard, AlertPill, InventoryTable, BatchDrawer
- AuditCountInput, ReconcileDiffCard, ExportJobToast

## 5) Responsive and Offline UX

- Mobile-first breakpoints with adaptive layouts
- Persistent offline banner and sync status indicator
- Optimistic UI for count entry with local queue fallback
- Conflict UI: server vs local value resolution on sync

## 6) Interaction and Motion

- Subtle 150-200ms transitions for panel changes
- Staggered dashboard card reveal on load
- Alert pulse only for critical 7-day expiry (non-intrusive)

## 7) Accessibility Plan

- Contrast >= WCAG AA
- Keyboard navigation for all form and table actions
- Semantic labels and live regions for async status updates
- Error messages with actionable recovery guidance

## 8) Design Deliverables and Sequence

Week 1:
- Design tokens and component primitives
- Wireframes for login, dashboard, inventory

Week 2:
- High-fidelity screens for alerts, audits, reports
- Clickable prototype for key flows

Week 3:
- Developer handoff (component specs, states, spacing)
- UI QA checklist and accessibility acceptance criteria

## 9) Design Suggestions (High Impact)

1. Prioritize a dedicated critical-alert strip across all pages to reduce missed expiry actions.
2. Use financial values with trend context (up/down vs previous period) to improve owner decision speed.
3. Keep stock audit input ultra-optimized for thumb use; avoid dense desktop-only controls.
4. Add role-based onboarding tips for first login to reduce training overhead.
5. Implement empty-state guidance with one-click actions to reduce operational dead ends.
