# Product Overview

Last updated: 2026-04-02
Owner: Product + Engineering

## Purpose

Vuzima Pharma Go is a pharmacy operations application for managing inventory, expiry risks, reorder decisions, stock audits, reporting, and forecast signals in one workflow.

## Core outcomes

- Reduce stockouts by exposing reorder suggestions and consumption signals.
- Reduce wastage by monitoring expiry risk and acknowledgement workflows.
- Improve inventory integrity with structured stock audits and reconciliation.
- Support owner and admin visibility through dashboard KPIs and reports.

## Platform scope (current)

- Authentication and role-based access (admin, staff).
- Drug master creation and inventory batch management.
- Stock movement posting with non-negative quantity guardrails.
- Expiry alerts and acknowledge workflow.
- Reorder suggestion engine.
- Consumption analytics refresh and retrieval.
- Stock audits (draft, submit, reconcile).
- Report export queue and processor trigger.
- Forecast model run and latest outputs.
- Admin staff account management (create, reset temporary password, disable, enable).

## Out of scope (current)

- External identity providers (SSO/OAuth).
- Multi-tenant pharmacy support.
- Fine-grained permission system beyond admin/staff roles.
- Full production background queue orchestration (worker is currently placeholder/simulator).
