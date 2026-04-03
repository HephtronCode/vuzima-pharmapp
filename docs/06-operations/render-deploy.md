# Render Deployment Guide

Last updated: 2026-04-02
Owner: Engineering

## Deployment model

- API: Render Web Service
- Client: Render Static Site
- Database: Render Postgres
- Cache/limiter store: Render Redis

## Blueprint setup

1. In Render, choose Blueprint deploy from this repo.
2. Confirm `render.yaml` resources are detected.
3. Create services.

## Required manual env setup

### API service

- `CLIENT_ORIGIN=https://<your-client-domain>`
- `COOKIE_SAME_SITE=none` (required for cross-site cookie auth)
- `COOKIE_SECURE=true`

### Client service

- `VITE_API_BASE_URL=https://<your-api-domain>`

## One-time DB init

Run after first successful API deploy:

```bash
pnpm --filter @vuzima/api db:migrate
pnpm --filter @vuzima/api db:seed
```

## Keepalive notes

- Free web services may sleep after inactivity.
- Optional GitHub Action keepalive exists in `.github/workflows/keepalive.yml`.
- To enable it, set repository variable `ENABLE_RENDER_KEEPALIVE=true` and secret `RENDER_API_HEALTHCHECK_URL`.

## Recommended production path

- Prefer an always-on plan instead of keepalive pings for reliable latency and policy safety.
