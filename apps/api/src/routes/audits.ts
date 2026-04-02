import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'

const createAuditSchema = z.object({
  title: z.string().min(3).max(255),
  section_name: z.string().min(2).max(255),
})

const upsertLineSchema = z.object({
  inventory_item_id: z.number().int().positive(),
  counted_quantity: z.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
})

const reconcileSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().max(500).optional(),
})

export const auditsRouter = Router()

auditsRouter.get('/', async (_, res) => {
  const result = await pool.query(
    `
    SELECT
      sa.id,
      sa.title,
      sa.section_name,
      sa.status,
      sa.created_at,
      sa.submitted_at,
      creator.email AS created_by_email,
      approver.email AS approved_by_email,
      COALESCE(SUM(ABS(sal.difference)), 0) AS total_variance
    FROM stock_audits sa
    INNER JOIN users creator ON creator.id = sa.created_by
    LEFT JOIN users approver ON approver.id = sa.approved_by
    LEFT JOIN stock_audit_lines sal ON sal.audit_id = sa.id
    GROUP BY sa.id, creator.email, approver.email
    ORDER BY sa.created_at DESC;
    `,
  )

  return res.json({ data: result.rows })
})

auditsRouter.post('/', async (req, res) => {
  const parsed = createAuditSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const result = await pool.query(
    `
    INSERT INTO stock_audits (title, section_name, status, created_by)
    VALUES ($1, $2, 'draft', $3)
    RETURNING id, title, section_name, status, created_by, created_at;
    `,
    [parsed.data.title, parsed.data.section_name, req.user.id],
  )

  return res.status(201).json(result.rows[0])
})

auditsRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid audit id' })
  }

  const auditResult = await pool.query(
    `
    SELECT
      sa.id,
      sa.title,
      sa.section_name,
      sa.status,
      sa.created_at,
      sa.submitted_at,
      sa.approved_at,
      creator.email AS created_by_email,
      approver.email AS approved_by_email
    FROM stock_audits sa
    INNER JOIN users creator ON creator.id = sa.created_by
    LEFT JOIN users approver ON approver.id = sa.approved_by
    WHERE sa.id = $1;
    `,
    [id],
  )

  if (auditResult.rowCount === 0) {
    return res.status(404).json({ message: 'Audit not found' })
  }

  const linesResult = await pool.query(
    `
    SELECT
      sal.id,
      sal.inventory_item_id,
      sal.system_quantity,
      sal.counted_quantity,
      sal.difference,
      sal.notes,
      ii.batch_number,
      d.brand_name
    FROM stock_audit_lines sal
    INNER JOIN inventory_items ii ON ii.id = sal.inventory_item_id
    INNER JOIN drugs d ON d.id = ii.drug_id
    WHERE sal.audit_id = $1
    ORDER BY d.brand_name ASC;
    `,
    [id],
  )

  return res.json({
    audit: auditResult.rows[0],
    lines: linesResult.rows,
  })
})

auditsRouter.post('/:id/lines', async (req, res) => {
  const auditId = Number(req.params.id)
  if (!Number.isInteger(auditId) || auditId <= 0) {
    return res.status(400).json({ message: 'Invalid audit id' })
  }

  const parsed = upsertLineSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const auditState = await client.query<{ status: string }>(
      'SELECT status FROM stock_audits WHERE id = $1 FOR UPDATE',
      [auditId],
    )

    if (auditState.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Audit not found' })
    }

    if (auditState.rows[0].status !== 'draft') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Only draft audits can be edited' })
    }

    const inventoryResult = await client.query<{ quantity_on_hand: number }>(
      'SELECT quantity_on_hand FROM inventory_items WHERE id = $1',
      [parsed.data.inventory_item_id],
    )

    if (inventoryResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Inventory item not found' })
    }

    const systemQuantity = inventoryResult.rows[0].quantity_on_hand
    const countedQuantity = parsed.data.counted_quantity
    const difference = countedQuantity - systemQuantity

    const lineResult = await client.query(
      `
      INSERT INTO stock_audit_lines (
        audit_id,
        inventory_item_id,
        system_quantity,
        counted_quantity,
        difference,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (audit_id, inventory_item_id)
      DO UPDATE SET
        system_quantity = EXCLUDED.system_quantity,
        counted_quantity = EXCLUDED.counted_quantity,
        difference = EXCLUDED.difference,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING id, audit_id, inventory_item_id, system_quantity, counted_quantity, difference, notes;
      `,
      [
        auditId,
        parsed.data.inventory_item_id,
        systemQuantity,
        countedQuantity,
        difference,
        parsed.data.notes ?? null,
      ],
    )

    await client.query('COMMIT')
    return res.json(lineResult.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})

auditsRouter.post('/:id/submit', async (req, res) => {
  const auditId = Number(req.params.id)
  if (!Number.isInteger(auditId) || auditId <= 0) {
    return res.status(400).json({ message: 'Invalid audit id' })
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const auditResult = await client.query<{ status: string }>(
      'SELECT status FROM stock_audits WHERE id = $1 FOR UPDATE',
      [auditId],
    )

    if (auditResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Audit not found' })
    }

    if (auditResult.rows[0].status !== 'draft') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Only draft audits can be submitted' })
    }

    const countResult = await client.query<{ count: string }>(
      'SELECT COUNT(*)::TEXT AS count FROM stock_audit_lines WHERE audit_id = $1',
      [auditId],
    )

    if (Number(countResult.rows[0]?.count ?? 0) === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Cannot submit an empty audit' })
    }

    await client.query(
      `
      UPDATE stock_audits
      SET status = 'submitted',
          submitted_by = $1,
          submitted_at = NOW(),
          updated_at = NOW()
      WHERE id = $2;
      `,
      [req.user.id, auditId],
    )

    await client.query('COMMIT')
    return res.json({ message: 'Audit submitted for reconciliation approval' })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})

auditsRouter.post('/:id/reconcile', async (req, res) => {
  const auditId = Number(req.params.id)
  if (!Number.isInteger(auditId) || auditId <= 0) {
    return res.status(400).json({ message: 'Invalid audit id' })
  }

  const parsed = reconcileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can reconcile audits' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const auditResult = await client.query<{ status: string }>(
      'SELECT status FROM stock_audits WHERE id = $1 FOR UPDATE',
      [auditId],
    )

    if (auditResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Audit not found' })
    }

    if (auditResult.rows[0].status !== 'submitted') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Only submitted audits can be reconciled' })
    }

    await client.query(
      `
      INSERT INTO reconciliation_approvals (audit_id, approved_by, status, comments)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (audit_id)
      DO UPDATE SET
        approved_by = EXCLUDED.approved_by,
        status = EXCLUDED.status,
        comments = EXCLUDED.comments,
        created_at = NOW();
      `,
      [auditId, req.user.id, parsed.data.status, parsed.data.comments ?? null],
    )

    if (parsed.data.status === 'approved') {
      const lines = await client.query<{
        inventory_item_id: number
        counted_quantity: number
        difference: number
      }>(
        'SELECT inventory_item_id, counted_quantity, difference FROM stock_audit_lines WHERE audit_id = $1',
        [auditId],
      )

      for (const line of lines.rows) {
        await client.query(
          `
          UPDATE inventory_items
          SET quantity_on_hand = $1,
              updated_at = NOW()
          WHERE id = $2;
          `,
          [line.counted_quantity, line.inventory_item_id],
        )

        await client.query(
          `
          INSERT INTO stock_movements (inventory_item_id, user_id, movement_type, quantity_changed, notes)
          VALUES ($1, $2, 'adjustment', 0, $3);
          `,
          [
            line.inventory_item_id,
            req.user.id,
            `Audit reconciliation applied (audit_id=${auditId}, diff=${line.difference})`,
          ],
        )
      }

      await client.query(
        `
        UPDATE stock_audits
        SET status = 'reconciled',
            approved_by = $1,
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = $2;
        `,
        [req.user.id, auditId],
      )
    } else {
      await client.query(
        `
        UPDATE stock_audits
        SET status = 'draft',
            updated_at = NOW()
        WHERE id = $1;
        `,
        [auditId],
      )
    }

    await client.query('COMMIT')
    return res.json({
      message:
        parsed.data.status === 'approved'
          ? 'Audit approved and inventory reconciled'
          : 'Audit rejected and returned to draft',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})
