DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_format') THEN
    CREATE TYPE report_format AS ENUM ('csv', 'pdf', 'excel');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'processing', 'ready', 'failed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
    CREATE TYPE report_type AS ENUM ('expiring_stock_value', 'monthly_consumption', 'inventory_snapshot');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS report_exports (
  id SERIAL PRIMARY KEY,
  requested_by INTEGER REFERENCES users(id),
  report_type report_type NOT NULL,
  format report_format NOT NULL DEFAULT 'csv',
  status report_status NOT NULL DEFAULT 'pending',
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_exports_status_created ON report_exports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS consumption_snapshots (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  sold_units_30d INTEGER NOT NULL DEFAULT 0,
  avg_weekly_consumption NUMERIC(10,2) NOT NULL DEFAULT 0,
  amc NUMERIC(10,2) NOT NULL DEFAULT 0,
  months_of_stock_remaining NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (drug_id, snapshot_date)
);
