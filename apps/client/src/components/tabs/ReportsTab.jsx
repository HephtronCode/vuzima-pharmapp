import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import SortButton from '../common/SortButton'

function ReportsTab({
  reportType,
  setReportType,
  reportSubmitting,
  onQueueReport,
  reportQuery,
  setReportQuery,
  reportSort,
  onToggleReportSort,
  reportsPaged,
  onChangeReportsPage,
}) {
  return (
    <section className="grid two">
      <article className="card">
        <h3>Queue Report Export</h3>
        <div className="form-grid">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="expiring_stock_value">expiring_stock_value</option>
            <option value="monthly_consumption">monthly_consumption</option>
            <option value="inventory_snapshot">inventory_snapshot</option>
          </select>
          <button type="button" onClick={onQueueReport} disabled={reportSubmitting}>
            {reportSubmitting ? 'Processing...' : 'Queue and Process CSV'}
          </button>
        </div>
      </article>

      <article className="card full">
        <h3>Report Jobs</h3>
        <div className="toolbar-row">
          <input
            className="table-search"
            placeholder="Search reports"
            value={reportQuery}
            onChange={(e) => {
              setReportQuery(e.target.value)
              onChangeReportsPage(1)
            }}
          />
          <SortButton label="Status" sortState={reportSort} sortKey="status" onToggle={onToggleReportSort} />
          <SortButton label="ID" sortState={reportSort} sortKey="id" onToggle={onToggleReportSort} />
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Format</th>
              <th>Requested By</th>
              <th>File Path</th>
            </tr>
          </thead>
          <tbody>
            {reportsPaged.items.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState
                    message="No reports yet. Generate your first export job."
                    actionLabel="Generate Report"
                    onAction={onQueueReport}
                  />
                </td>
              </tr>
            ) : (
              reportsPaged.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.report_type}</td>
                  <td>{row.status}</td>
                  <td>{row.format}</td>
                  <td>{row.requested_by_email ?? '--'}</td>
                  <td>{row.file_path ?? '--'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={reportsPaged.page}
          totalPages={reportsPaged.totalPages}
          onChange={onChangeReportsPage}
        />
      </article>
    </section>
  )
}

export default ReportsTab
