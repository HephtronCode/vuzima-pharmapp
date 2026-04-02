import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import SortButton from '../common/SortButton'

function AlertsTab({
  isAdmin,
  alertQuery,
  setAlertQuery,
  alertSort,
  onToggleAlertSort,
  alertsPaged,
  onAcknowledgeAlert,
  acknowledgingAlertIds,
  onChangeAlertsPage,
  reorderRows,
  analyticsRows,
  onRunExpiryScan,
  onRefreshData,
}) {
  return (
    <section className="grid two">
      <article className="card">
        <h3>Open Expiry Alerts</h3>
        <div className="toolbar-row">
          <input
            className="table-search"
            placeholder="Search alerts"
            value={alertQuery}
            onChange={(e) => {
              setAlertQuery(e.target.value)
              onChangeAlertsPage(1)
            }}
          />
          <SortButton label="Days" sortState={alertSort} sortKey="days_to_expiry" onToggle={onToggleAlertSort} />
          <SortButton label="Drug" sortState={alertSort} sortKey="brand_name" onToggle={onToggleAlertSort} />
        </div>
        <table>
          <thead>
            <tr>
              <th>Drug</th>
              <th>Tier</th>
              <th>Days</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alertsPaged.items.length === 0 ? (
              <tr>
                <td colSpan="4">
                  <EmptyState
                    message="No open alerts right now."
                    actionLabel={isAdmin ? 'Run Expiry Scan' : 'Refresh Alerts'}
                    onAction={isAdmin ? onRunExpiryScan : onRefreshData}
                  />
                </td>
              </tr>
            ) : (
              alertsPaged.items.map((row) => {
                const pending = acknowledgingAlertIds.includes(row.id)
                return (
                  <tr key={row.id}>
                    <td>{row.brand_name}</td>
                    <td>{row.alert_tier}</td>
                    <td>{row.days_to_expiry}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onAcknowledgeAlert(row.id)}
                        disabled={pending}
                      >
                        {pending ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <Pagination
          page={alertsPaged.page}
          totalPages={alertsPaged.totalPages}
          onChange={onChangeAlertsPage}
        />
      </article>

      <article className="card">
        <h3>Reorder Suggestions</h3>
        <table>
          <thead>
            <tr>
              <th>Drug</th>
              <th>Current</th>
              <th>ROP</th>
              <th>Suggest</th>
            </tr>
          </thead>
          <tbody>
            {reorderRows.length === 0 ? (
              <tr><td colSpan="4">No reorder suggestions.</td></tr>
            ) : (
              reorderRows.slice(0, 20).map((row) => (
                <tr key={row.drug_id}>
                  <td>{row.brand_name}</td>
                  <td>{row.current_stock}</td>
                  <td>{row.reorder_point}</td>
                  <td>{row.suggested_order_qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>

      <article className="card full">
        <h3>Consumption Analytics</h3>
        <table>
          <thead>
            <tr>
              <th>Drug</th>
              <th>Sold (30d)</th>
              <th>Weekly Avg</th>
              <th>AMC</th>
              <th>Months Remaining</th>
            </tr>
          </thead>
          <tbody>
            {analyticsRows.length === 0 ? (
              <tr><td colSpan="5">No analytics rows.</td></tr>
            ) : (
              analyticsRows.map((row) => (
                <tr key={row.drug_id}>
                  <td>{row.brand_name}</td>
                  <td>{row.sold_units_30d}</td>
                  <td>{row.avg_weekly_consumption}</td>
                  <td>{row.amc}</td>
                  <td>{row.months_of_stock_remaining ?? '--'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}

export default AlertsTab
