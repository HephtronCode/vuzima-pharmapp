# Environment Variables

Last updated: 2026-04-02
Owner: Engineering

## API (`apps/api/.env`)

Reference: `apps/api/.env.example`

```env
NODE_ENV=development
API_PORT=3000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vuzima
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=1d
```

### Notes

- `DATABASE_URL` must point to a running Postgres instance.
- `JWT_SECRET` should be changed outside development.
- `CLIENT_ORIGIN` must match the Vite origin for CORS.

## Client (`apps/client/.env`)

Reference: `apps/client/.env.example`

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Notes

- If API host/port changes, update this value and restart Vite.
