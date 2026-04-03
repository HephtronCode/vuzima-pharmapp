import bcrypt from 'bcryptjs'
import { pool } from './client.js'
import { recomputeConsumptionSnapshots } from '../services/analyticsService.js'
import { runForecastModel } from '../services/forecastService.js'

async function run() {
  const client = await pool.connect()
  try {
    const adminPassword = await bcrypt.hash('AdminPass123!', 10)
    const staffPassword = await bcrypt.hash('StaffPass123!', 10)

    await client.query('BEGIN')

    await client.query(
      `
      INSERT INTO users (email, password_hash, role)
      VALUES
        ('admin@vuzimapharmago.app', $1, 'admin'),
        ('staff@vuzimapharmago.app', $2, 'staff')
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = TRUE,
        updated_at = NOW();
      `,
      [adminPassword, staffPassword],
    )

    await client.query(
      `
      INSERT INTO suppliers (name, contact_email, lead_time_days)
      VALUES
        ('PharmaPlus Distributors', 'ops@pharmaplus.example', 5),
        ('Accra Med Supply', 'support@accramed.example', 7)
      ON CONFLICT DO NOTHING;
      `,
    )

    await client.query(
      `
      INSERT INTO drugs (brand_name, generic_name, supplier_id, cost_price, selling_price, reorder_level)
      VALUES
        ('Paracetamol 500mg', 'Paracetamol', 1, 12.50, 19.00, 900),
        ('Artemether-Lumefantrine', 'Artemether-Lumefantrine', 2, 34.00, 49.00, 300),
        ('Amoxicillin 250mg', 'Amoxicillin', 1, 22.00, 35.00, 250)
      ON CONFLICT DO NOTHING;
      `,
    )

    await client.query(
      `
      INSERT INTO inventory_items (drug_id, batch_number, expiry_date, quantity_on_hand)
      VALUES
        (1, 'PA-774A', '2026-08-11', 1120),
        (2, 'AL-102C', '2026-04-06', 210),
        (3, 'AM-031R', '2026-04-02', 160)
      ON CONFLICT (drug_id, batch_number) DO NOTHING;
      `,
    )

    await client.query(
      `
      INSERT INTO drug_reorder_settings (drug_id, safety_stock, lead_time_override_days)
      VALUES
        (1, 120, 5),
        (2, 80, 7),
        (3, 60, 5)
      ON CONFLICT (drug_id) DO UPDATE
      SET safety_stock = EXCLUDED.safety_stock,
          lead_time_override_days = EXCLUDED.lead_time_override_days,
          updated_at = NOW();
      `,
    )

    await client.query(
      `
      INSERT INTO stock_audits (title, section_name, status, created_by)
      VALUES
        ('Weekly Count Baseline', 'Pain Relief', 'draft', 2)
      ON CONFLICT DO NOTHING;
      `,
    )

    await client.query('COMMIT')
    await recomputeConsumptionSnapshots()
    await runForecastModel()
    console.log('Seed complete. Test users: admin@vuzimapharmago.app / staff@vuzimapharmago.app')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Seed failed', error)
  process.exit(1)
})
