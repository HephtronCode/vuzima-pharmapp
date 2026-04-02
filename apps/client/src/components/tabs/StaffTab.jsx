import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import SortButton from '../common/SortButton'
import { formatDate } from '../../utils/formatters'

function StaffTab({
  staffForm,
  setStaffForm,
  staffErrors,
  staffSubmitting,
  onCreateStaff,
  staffQuery,
  setStaffQuery,
  staffSort,
  onToggleStaffSort,
  staffPaged,
  onChangeStaffPage,
  onResetTempPassword,
  onDisableStaff,
  onEnableStaff,
  staffResetSubmittingIds,
  staffDisableSubmittingIds,
  staffEnableSubmittingIds,
}) {
  return (
    <section className="grid two">
      <article className="card">
        <h3>Create Staff Account</h3>
        <form onSubmit={onCreateStaff} className="form-grid">
          <input
            type="email"
            placeholder="staff@example.com"
            value={staffForm.email}
            onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          {staffErrors.email ? <span className="field-error">{staffErrors.email}</span> : null}

          <input
            type="password"
            placeholder="Temporary password"
            value={staffForm.password}
            onChange={(e) => setStaffForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {staffErrors.password ? <span className="field-error">{staffErrors.password}</span> : null}

          <button type="submit" disabled={staffSubmitting}>
            {staffSubmitting ? 'Creating...' : 'Create Staff'}
          </button>
        </form>
        <div className="muted">Use a temporary password and share it securely with the staff member.</div>
      </article>

      <article className="card full">
        <h3>Staff Accounts</h3>
        <div className="toolbar-row">
          <input
            className="table-search"
            placeholder="Search staff by email"
            value={staffQuery}
            onChange={(e) => {
              setStaffQuery(e.target.value)
              onChangeStaffPage(1)
            }}
          />
          <SortButton label="ID" sortState={staffSort} sortKey="id" onToggle={onToggleStaffSort} />
          <SortButton label="Email" sortState={staffSort} sortKey="email" onToggle={onToggleStaffSort} />
          <SortButton label="Created" sortState={staffSort} sortKey="created_at" onToggle={onToggleStaffSort} />
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffPaged.items.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState message="No staff accounts yet. Create your first team member." />
                </td>
              </tr>
            ) : (
              staffPaged.items.map((row) => {
                const resetting = staffResetSubmittingIds.includes(row.id)
                const disabling = staffDisableSubmittingIds.includes(row.id)
                const enabling = staffEnableSubmittingIds.includes(row.id)

                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.email}</td>
                    <td>{row.role}</td>
                    <td>{row.is_active ? 'active' : 'disabled'}</td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          onClick={() => onResetTempPassword(row.id)}
                          disabled={resetting || disabling || enabling}
                        >
                          {resetting ? 'Resetting...' : 'Reset Temp Password'}
                        </button>
                        {row.is_active ? (
                          <button
                            className="danger"
                            type="button"
                            onClick={() => onDisableStaff(row.id)}
                            disabled={disabling || resetting || enabling}
                          >
                            {disabling ? 'Disabling...' : 'Disable Account'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEnableStaff(row.id)}
                            disabled={enabling || resetting || disabling}
                          >
                            {enabling ? 'Enabling...' : 'Enable Account'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <Pagination
          page={staffPaged.page}
          totalPages={staffPaged.totalPages}
          onChange={onChangeStaffPage}
        />
      </article>
    </section>
  )
}

export default StaffTab
