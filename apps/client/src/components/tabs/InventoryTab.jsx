import { useRef, useState } from 'react'
import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import SortButton from '../common/SortButton'
import { buildInventoryCsvTemplate, getInventoryCsvTemplateRows } from '../../utils/csv'
import { formatDate } from '../../utils/formatters'

function InventoryTab({
  isAdmin,
  suppliers,
  drugs,
  inventoryRows,
  drugForm,
  setDrugForm,
  drugErrors,
  drugSubmitting,
  onCreateDrug,
  inventoryForm,
  setInventoryForm,
  inventoryErrors,
  inventorySubmitting,
  onCreateInventoryItem,
  movementForm,
  setMovementForm,
  movementErrors,
  movementSubmitting,
  onPostMovement,
  inventoryQuery,
  setInventoryQuery,
  inventorySort,
  onToggleInventorySort,
  tablePageSize,
  onChangePageSize,
  inventoryPaged,
  onChangeInventoryPage,
  csvUploadSubmitting,
  onUploadInventoryCsv,
}) {
  const [csvFile, setCsvFile] = useState(null)
  const fileRef = useRef(null)

  async function handleCsvUpload() {
    if (!csvFile) return
    const success = await onUploadInventoryCsv(csvFile)
    if (success) {
      setCsvFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function downloadCsvTemplate() {
    const csv = buildInventoryCsvTemplate(drugs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exampleRows = getInventoryCsvTemplateRows(drugs)

  return (
    <section className="grid two">
      {isAdmin ? (
        <article className="card">
          <h3>Create Drug</h3>
          <form onSubmit={onCreateDrug} className="form-grid">
            <input placeholder="Brand name" value={drugForm.brand_name} onChange={(e) => setDrugForm((p) => ({ ...p, brand_name: e.target.value }))} />
            {drugErrors.brand_name ? <span className="field-error">{drugErrors.brand_name}</span> : null}

            <input placeholder="Generic name" value={drugForm.generic_name} onChange={(e) => setDrugForm((p) => ({ ...p, generic_name: e.target.value }))} />
            {drugErrors.generic_name ? <span className="field-error">{drugErrors.generic_name}</span> : null}

            <select value={drugForm.supplier_id} onChange={(e) => setDrugForm((p) => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">Supplier (optional)</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <input type="number" step="0.01" placeholder="Cost price" value={drugForm.cost_price} onChange={(e) => setDrugForm((p) => ({ ...p, cost_price: e.target.value }))} />
            {drugErrors.cost_price ? <span className="field-error">{drugErrors.cost_price}</span> : null}

            <input type="number" step="0.01" placeholder="Selling price" value={drugForm.selling_price} onChange={(e) => setDrugForm((p) => ({ ...p, selling_price: e.target.value }))} />
            {drugErrors.selling_price ? <span className="field-error">{drugErrors.selling_price}</span> : null}

            <input type="number" placeholder="Reorder level" value={drugForm.reorder_level} onChange={(e) => setDrugForm((p) => ({ ...p, reorder_level: e.target.value }))} />
            {drugErrors.reorder_level ? <span className="field-error">{drugErrors.reorder_level}</span> : null}

            <button type="submit" disabled={drugSubmitting}>{drugSubmitting ? 'Creating...' : 'Create Drug'}</button>
          </form>
        </article>
      ) : null}

      <article className="card">
        <h3>Add Inventory Batch</h3>
        <form onSubmit={onCreateInventoryItem} className="form-grid">
          <select value={inventoryForm.drug_id} onChange={(e) => setInventoryForm((p) => ({ ...p, drug_id: e.target.value }))}>
            <option value="">Select drug</option>
            {drugs.map((d) => <option key={d.id} value={d.id}>{d.brand_name}</option>)}
          </select>
          {inventoryErrors.drug_id ? <span className="field-error">{inventoryErrors.drug_id}</span> : null}

          <input placeholder="Batch number" value={inventoryForm.batch_number} onChange={(e) => setInventoryForm((p) => ({ ...p, batch_number: e.target.value }))} />

          <input type="date" value={inventoryForm.expiry_date} onChange={(e) => setInventoryForm((p) => ({ ...p, expiry_date: e.target.value }))} />
          {inventoryErrors.expiry_date ? <span className="field-error">{inventoryErrors.expiry_date}</span> : null}

          <input type="number" placeholder="Quantity" value={inventoryForm.quantity_on_hand} onChange={(e) => setInventoryForm((p) => ({ ...p, quantity_on_hand: e.target.value }))} />
          {inventoryErrors.quantity_on_hand ? <span className="field-error">{inventoryErrors.quantity_on_hand}</span> : null}

          <button type="submit" disabled={inventorySubmitting}>{inventorySubmitting ? 'Adding...' : 'Add Batch'}</button>
        </form>

        <h3>Import Inventory CSV</h3>
        <div className="form-grid">
          <div className="row-actions">
            <button type="button" onClick={downloadCsvTemplate}>Download CSV Template</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
          />
          <div className="muted">Columns: drug_id, batch_number (optional), expiry_date, quantity_on_hand</div>
          <div className="csv-example">
            <div className="muted">Example rows</div>
            <pre>
drug_id,batch_number,expiry_date,quantity_on_hand
{exampleRows.map((row) => `${row.drug_id},${row.batch_number},${row.expiry_date},${row.quantity_on_hand}`).join('\n')}
            </pre>
          </div>
          <button type="button" onClick={handleCsvUpload} disabled={!csvFile || csvUploadSubmitting}>
            {csvUploadSubmitting ? 'Uploading...' : 'Upload CSV to Inventory'}
          </button>
        </div>

        <h3>Post Stock Movement</h3>
        <form onSubmit={onPostMovement} className="form-grid">
          <select value={movementForm.inventory_item_id} onChange={(e) => setMovementForm((p) => ({ ...p, inventory_item_id: e.target.value }))}>
            <option value="">Select inventory item</option>
            {inventoryRows.map((item) => <option key={item.id} value={item.id}>{item.brand_name} - {item.batch_number}</option>)}
          </select>
          {movementErrors.inventory_item_id ? <span className="field-error">{movementErrors.inventory_item_id}</span> : null}

          <select value={movementForm.movement_type} onChange={(e) => setMovementForm((p) => ({ ...p, movement_type: e.target.value }))}>
            <option value="adjustment">adjustment</option>
            <option value="sale">sale</option>
            <option value="return">return</option>
          </select>

          <input type="number" placeholder="Quantity change" value={movementForm.quantity_changed} onChange={(e) => setMovementForm((p) => ({ ...p, quantity_changed: e.target.value }))} />
          {movementErrors.quantity_changed ? <span className="field-error">{movementErrors.quantity_changed}</span> : null}

          <input placeholder="Notes" value={movementForm.notes} onChange={(e) => setMovementForm((p) => ({ ...p, notes: e.target.value }))} />

          <button type="submit" disabled={movementSubmitting}>{movementSubmitting ? 'Posting...' : 'Post Movement'}</button>
        </form>
      </article>

      <article className="card full">
        <h3>Inventory</h3>
        <div className="toolbar-row">
          <input
            className="table-search"
            placeholder="Search inventory by drug, generic or batch"
            value={inventoryQuery}
            onChange={(e) => {
              setInventoryQuery(e.target.value)
              onChangeInventoryPage(1)
            }}
          />
          <SortButton label="Drug" sortState={inventorySort} sortKey="brand_name" onToggle={onToggleInventorySort} />
          <SortButton label="Expiry" sortState={inventorySort} sortKey="expiry_date" onToggle={onToggleInventorySort} />
          <SortButton label="Qty" sortState={inventorySort} sortKey="quantity_on_hand" onToggle={onToggleInventorySort} />
          <select value={tablePageSize} onChange={(e) => onChangePageSize(e.target.value)}>
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
        <table className="mobile-table">
          <thead>
            <tr>
              <th>Drug</th>
              <th>Batch</th>
              <th>Expiry</th>
              <th>Quantity</th>
              <th>Reorder</th>
            </tr>
          </thead>
          <tbody>
            {inventoryPaged.items.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <EmptyState message="No inventory rows. Add your first inventory batch." />
                </td>
              </tr>
            ) : (
              inventoryPaged.items.map((row) => (
                <tr key={row.id}>
                  <td data-label="Drug">{row.brand_name}</td>
                  <td data-label="Batch">{row.batch_number}</td>
                  <td data-label="Expiry">{formatDate(row.expiry_date)}</td>
                  <td data-label="Quantity">{row.quantity_on_hand}</td>
                  <td data-label="Reorder">{row.reorder_level}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={inventoryPaged.page}
          totalPages={inventoryPaged.totalPages}
          onChange={onChangeInventoryPage}
        />
      </article>
    </section>
  )
}

export default InventoryTab
