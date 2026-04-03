import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import SortButton from '../common/SortButton'

function AuditsTab({
  isAdmin,
  auditForm,
  setAuditForm,
  auditErrors,
  auditSubmitting,
  onCreateAudit,
  auditLineForm,
  setAuditLineForm,
  auditLineErrors,
  auditLineSubmitting,
  onAddAuditLine,
  inventoryRows,
  onSubmitAudit,
  onReconcileAudit,
  auditActionSubmitting,
  auditQuery,
  setAuditQuery,
  auditSort,
  onToggleAuditSort,
  auditsPaged,
  onOpenAudit,
  onChangeAuditsPage,
  selectedAudit,
}) {
  return (
    <section className="grid two">
      <article className="card">
        <h3>Create Audit</h3>
        <form onSubmit={onCreateAudit} className="form-grid">
          <input placeholder="Audit title" value={auditForm.title} onChange={(e) => setAuditForm((p) => ({ ...p, title: e.target.value }))} />
          {auditErrors.title ? <span className="field-error">{auditErrors.title}</span> : null}

          <input placeholder="Section name" value={auditForm.section_name} onChange={(e) => setAuditForm((p) => ({ ...p, section_name: e.target.value }))} />
          {auditErrors.section_name ? <span className="field-error">{auditErrors.section_name}</span> : null}

          <button type="submit" disabled={auditSubmitting}>{auditSubmitting ? 'Creating...' : 'Create Audit'}</button>
        </form>

        <h3>Add Audit Line</h3>
        <form onSubmit={onAddAuditLine} className="form-grid">
          <select value={auditLineForm.inventory_item_id} onChange={(e) => setAuditLineForm((p) => ({ ...p, inventory_item_id: e.target.value }))}>
            <option value="">Inventory item</option>
            {inventoryRows.map((item) => <option key={item.id} value={item.id}>{item.brand_name} - {item.batch_number}</option>)}
          </select>
          {auditLineErrors.inventory_item_id ? <span className="field-error">{auditLineErrors.inventory_item_id}</span> : null}

          <input type="number" placeholder="Counted quantity" value={auditLineForm.counted_quantity} onChange={(e) => setAuditLineForm((p) => ({ ...p, counted_quantity: e.target.value }))} />
          {auditLineErrors.counted_quantity ? <span className="field-error">{auditLineErrors.counted_quantity}</span> : null}

          <input placeholder="Notes" value={auditLineForm.notes} onChange={(e) => setAuditLineForm((p) => ({ ...p, notes: e.target.value }))} />

          <button type="submit" disabled={auditLineSubmitting}>{auditLineSubmitting ? 'Saving...' : 'Save Line'}</button>
        </form>

        <div className="row-actions">
          <button type="button" onClick={onSubmitAudit} disabled={auditActionSubmitting}>
            {auditActionSubmitting ? 'Working...' : 'Submit Audit'}
          </button>
          {isAdmin ? (
            <>
              <button type="button" onClick={() => onReconcileAudit('approved')} disabled={auditActionSubmitting}>
                {auditActionSubmitting ? 'Working...' : 'Approve'}
              </button>
              <button type="button" onClick={() => onReconcileAudit('rejected')} disabled={auditActionSubmitting}>
                {auditActionSubmitting ? 'Working...' : 'Reject'}
              </button>
            </>
          ) : null}
        </div>
      </article>

      <article className="card">
        <h3>Audits</h3>
        <div className="toolbar-row">
          <input
            className="table-search"
            placeholder="Search audits"
            value={auditQuery}
            onChange={(e) => {
              setAuditQuery(e.target.value)
              onChangeAuditsPage(1)
            }}
          />
          <SortButton label="Status" sortState={auditSort} sortKey="status" onToggle={onToggleAuditSort} />
          <SortButton label="Created" sortState={auditSort} sortKey="created_at" onToggle={onToggleAuditSort} />
        </div>
        <table className="mobile-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {auditsPaged.items.length === 0 ? (
              <tr>
                <td colSpan="4">
                  <EmptyState
                    message="No audits yet. Create your first stock audit."
                    actionLabel="Create First Audit"
                    onAction={() => setAuditForm({ title: 'Daily Count', section_name: 'Main Shelf' })}
                  />
                </td>
              </tr>
            ) : (
              auditsPaged.items.map((audit) => (
                <tr key={audit.id}>
                  <td data-label="ID">{audit.id}</td>
                  <td data-label="Title">{audit.title}</td>
                  <td data-label="Status">{audit.status}</td>
                  <td data-label="Action"><button type="button" onClick={() => onOpenAudit(audit.id)}>Open</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={auditsPaged.page}
          totalPages={auditsPaged.totalPages}
          onChange={onChangeAuditsPage}
        />
      </article>

      <article className="card full">
        <h3>Selected Audit Detail</h3>
        <div className="muted">Audit ID: {selectedAudit?.audit?.id ?? '--'}</div>
        <table className="mobile-table">
          <thead>
            <tr>
              <th>Drug</th>
              <th>Batch</th>
              <th>System Qty</th>
              <th>Counted Qty</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {(selectedAudit?.lines ?? []).length === 0 ? (
              <tr><td colSpan="5">No lines for selected audit.</td></tr>
            ) : (
              selectedAudit.lines.map((line) => (
                <tr key={line.id}>
                  <td data-label="Drug">{line.brand_name}</td>
                  <td data-label="Batch">{line.batch_number}</td>
                  <td data-label="System Qty">{line.system_quantity}</td>
                  <td data-label="Counted Qty">{line.counted_quantity}</td>
                  <td data-label="Difference">{line.difference}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}

export default AuditsTab
