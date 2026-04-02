# Backup and Recovery

Last updated: 2026-04-02
Owner: Operations

## Current state

This repository provides local/dev dockerized Postgres. Production-grade backup automation is not included in repo and must be handled by environment infrastructure.

## Minimum recovery requirements

- Daily database snapshots/backups.
- Point-in-time restore strategy.
- Quarterly restore drill verification.

## Local recovery (development)

1. Recreate database container.
2. Re-run migrations.
3. Re-run seed.

## Incident notes template

- Time of incident
- Scope impacted
- Last known good backup timestamp
- Restore command(s) and verification output
