import { formatMoney } from '../../utils/formatters'

function DashboardTab({
  dashboard,
  forecastData,
  isAdmin,
  onRunForecast,
  onRunExpiryScan,
  onRefreshAnalytics,
  forecastSubmitting,
  expiryScanSubmitting,
  analyticsSubmitting,
}) {
  return (
    <section className="grid two">
      <article className="card kpis">
        <div className="kpi"><span>Total Stock Value</span><strong>{formatMoney(dashboard?.totalStockValue)}</strong></div>
        <div className="kpi"><span>Expiring Value (30d)</span><strong>{formatMoney(dashboard?.expiringValue30d)}</strong></div>
        <div className="kpi"><span>Low Stock</span><strong>{dashboard?.lowStockSkus ?? '--'}</strong></div>
        <div className="kpi"><span>Critical Alerts</span><strong>{dashboard?.criticalAlerts ?? '--'}</strong></div>
        <div className="kpi"><span>Forecast Signals</span><strong>{dashboard?.forecastSignals ?? '--'}</strong></div>
      </article>

      <article className="card">
        <h3>Forecast Operations</h3>
        <div className="row-actions">
          <button type="button" onClick={onRunForecast} disabled={!isAdmin || forecastSubmitting}>
            {forecastSubmitting ? 'Running...' : 'Run Forecast'}
          </button>
          <button type="button" onClick={onRunExpiryScan} disabled={!isAdmin || expiryScanSubmitting}>
            {expiryScanSubmitting ? 'Running...' : 'Run Expiry Scan'}
          </button>
          <button type="button" onClick={onRefreshAnalytics} disabled={analyticsSubmitting}>
            {analyticsSubmitting ? 'Refreshing...' : 'Refresh Analytics'}
          </button>
        </div>
        <div className="muted">Latest highlights</div>
        <ul>
          {(dashboard?.forecastHighlights ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="card full">
        <h3>Forecast Output</h3>
        <table className="mobile-table">
          <thead>
            <tr>
              <th>Drug</th>
              <th>Predicted 30d</th>
              <th>Baseline 30d</th>
              <th>Change %</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {(forecastData?.forecasts ?? []).length === 0 ? (
              <tr><td colSpan="5">No forecast data yet.</td></tr>
            ) : (
              forecastData.forecasts.map((row) => (
                <tr key={row.id}>
                  <td data-label="Drug">{row.brand_name}</td>
                  <td data-label="Predicted 30d">{row.predicted_units_30d}</td>
                  <td data-label="Baseline 30d">{row.baseline_units_30d}</td>
                  <td data-label="Change %">{row.change_percent}</td>
                  <td data-label="Confidence">{row.confidence_score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}

export default DashboardTab
