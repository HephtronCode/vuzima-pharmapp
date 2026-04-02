DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_audit_status') THEN
    CREATE TYPE stock_audit_status AS ENUM ('draft', 'submitted', 'reconciled', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reconciliation_status') THEN
    CREATE TYPE reconciliation_status AS ENUM ('approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stock_audits (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  section_name VARCHAR(255) NOT NULL,
  status stock_audit_status NOT NULL DEFAULT 'draft',
  created_by INTEGER NOT NULL REFERENCES users(id),
  submitted_by INTEGER REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_audit_lines (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER NOT NULL REFERENCES stock_audits(id) ON DELETE CASCADE,
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (audit_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS reconciliation_approvals (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER NOT NULL UNIQUE REFERENCES stock_audits(id) ON DELETE CASCADE,
  approved_by INTEGER NOT NULL REFERENCES users(id),
  status reconciliation_status NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_audits_status ON stock_audits(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_audit_lines_audit ON stock_audit_lines(audit_id);
