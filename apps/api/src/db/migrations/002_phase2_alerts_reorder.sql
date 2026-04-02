DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_tier') THEN
    CREATE TYPE alert_tier AS ENUM ('expired', 'critical_7d', 'warning_30d', 'info_90d');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS drug_reorder_settings (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER NOT NULL UNIQUE REFERENCES drugs(id) ON DELETE CASCADE,
  safety_stock INTEGER NOT NULL DEFAULT 0,
  lead_time_override_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expiry_alerts (
  id SERIAL PRIMARY KEY,
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_tier alert_tier NOT NULL,
  days_to_expiry INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  last_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_expiry_alerts_open_unique
  ON expiry_alerts(inventory_item_id, alert_tier)
  WHERE status = 'open';

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
  type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
