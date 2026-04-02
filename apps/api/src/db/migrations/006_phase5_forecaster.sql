DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forecast_run_status') THEN
    CREATE TYPE forecast_run_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forecast_signal_type') THEN
    CREATE TYPE forecast_signal_type AS ENUM ('forecast', 'spike', 'drop', 'dead_stock');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS forecast_runs (
  id SERIAL PRIMARY KEY,
  status forecast_run_status NOT NULL DEFAULT 'pending',
  run_window_days INTEGER NOT NULL DEFAULT 30,
  top_fast_movers_count INTEGER NOT NULL DEFAULT 20,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_outputs (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
  drug_id INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  signal_type forecast_signal_type NOT NULL,
  predicted_units_30d NUMERIC(12,2),
  baseline_units_30d NUMERIC(12,2),
  change_percent NUMERIC(8,2),
  confidence_score NUMERIC(5,2),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_runs_status_created ON forecast_runs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forecast_outputs_run_signal ON forecast_outputs(run_id, signal_type);
