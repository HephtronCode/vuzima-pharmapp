# API: Auth

Last updated: 2026-04-02
Owner: Backend Engineering

Base path: `/api/auth`

## POST /login

Authenticate user and return JWT.

Request:

```json
{
  "email": "admin@vuzimapharmago.app",
  "password": "AdminPass123!"
}
```

Success response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@vuzimapharmago.app",
    "role": "admin"
  }
}
```

Failure cases:

- `400` invalid request body
- `401` invalid credentials
- `403` account disabled
