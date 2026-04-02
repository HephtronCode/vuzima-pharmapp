# System Architecture

Last updated: 2026-04-02
Owner: Engineering

## Stack

- Frontend: React + Vite (`apps/client`)
- API: Express + TypeScript + Zod (`apps/api`)
- Database: PostgreSQL
- Cache: Redis (provisioned for future queue integration)
- Worker: placeholder process with offline queue simulator (`apps/worker`)

## Runtime topology (local)

- Client runs on `http://localhost:5173`
- API runs on `http://localhost:3000`
- Postgres runs on `localhost:5432`
- Redis runs on `localhost:6379`

## Core request flow

1. User logs in from client.
2. API validates credentials and signs JWT.
3. Client stores token and sends `Authorization: Bearer <token>`.
4. API middleware enforces auth and role gates.
5. Domain routes execute SQL queries and return JSON.

## Security controls

- `helmet` for common HTTP header hardening.
- CORS origin restriction via `CLIENT_ORIGIN`.
- JWT auth and role-based authorization.
- Password hashing with `bcryptjs`.
