# API: Users (Admin)

Last updated: 2026-04-02
Owner: Backend Engineering

Base path: `/api/users`

Auth: required (`admin` only)

## GET /

- Returns all staff accounts with active status.

## POST /staff

- Create staff account.

```json
{
  "email": "team.member@vuzimapharmago.app",
  "password": "TempPass123!"
}
```

## POST /staff/:id/reset-password

- Reset temporary password for a staff account.

```json
{
  "password": "NewTempPass123!"
}
```

## POST /staff/:id/disable

- Set `is_active` to false.

## POST /staff/:id/enable

- Set `is_active` to true.

## Common errors

- `400` invalid id or payload
- `404` staff account not found
- `409` duplicate email on create
