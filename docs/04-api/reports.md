# API: Reports, Forecast, Analytics, Jobs

Last updated: 2026-04-02
Owner: Backend Engineering

## Reports (`/api/reports`) - admin

### POST /export

- Queue export job.

### POST /process

- Trigger report processor for pending exports.

### GET /

- List latest export jobs (status, file path, requester).

## Forecast (`/api/forecast`) - admin

### POST /run

- Execute deterministic forecast run.

### GET /latest

- Return latest run plus forecast and anomaly rows.

## Analytics (`/api/analytics`) - admin/staff

### POST /refresh

- Recompute consumption snapshot rows.

### GET /consumption

- Read latest daily snapshot.

## Jobs (`/api/jobs`) - admin

- `POST /run-expiry-scan`
- `POST /run-analytics-refresh`
- `POST /run-report-processor`
- `POST /run-forecast`
