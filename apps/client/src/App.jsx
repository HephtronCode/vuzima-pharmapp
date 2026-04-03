import { useEffect, useMemo, useState } from 'react'
import './App.css'
import AuthView from './components/auth/AuthView'
import StaffActionModal from './components/common/StaffActionModal'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import AlertsTab from './components/tabs/AlertsTab'
import AuditsTab from './components/tabs/AuditsTab'
import DashboardTab from './components/tabs/DashboardTab'
import InventoryTab from './components/tabs/InventoryTab'
import ReportsTab from './components/tabs/ReportsTab'
import StaffTab from './components/tabs/StaffTab'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'
import { parseInventoryCsv } from './utils/csv'
import { formatError, paginateRows, toPositiveInt } from './utils/formatters'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'audits', label: 'Stock Audits' },
  { id: 'reports', label: 'Reports' },
  { id: 'staff', label: 'Staff' },
]

const CSRF_STORAGE_KEY = 'vuzima_csrf_token'

function loadStoredUser() {
  const raw = localStorage.getItem('vuzima_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem('vuzima_user')
    return null
  }
}

function loadStoredCsrfToken() {
  return localStorage.getItem(CSRF_STORAGE_KEY) ?? ''
}

function App() {
  const initialUser = loadStoredUser()
  const initialCsrfToken = loadStoredCsrfToken()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser))
  const [user, setUser] = useState(initialUser)
  const [csrfToken, setCsrfToken] = useState(initialCsrfToken)

  const { theme, toggleTheme } = useTheme()
  const { toast, showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  const [drugForm, setDrugForm] = useState({
    brand_name: '',
    generic_name: '',
    supplier_id: '',
    cost_price: '',
    selling_price: '',
    reorder_level: '',
  })
  const [drugErrors, setDrugErrors] = useState({})
  const [drugSubmitting, setDrugSubmitting] = useState(false)

  const [inventoryForm, setInventoryForm] = useState({
    drug_id: '',
    batch_number: '',
    expiry_date: '',
    quantity_on_hand: '',
  })
  const [inventoryErrors, setInventoryErrors] = useState({})
  const [inventorySubmitting, setInventorySubmitting] = useState(false)
  const [csvUploadSubmitting, setCsvUploadSubmitting] = useState(false)

  const [movementForm, setMovementForm] = useState({
    inventory_item_id: '',
    movement_type: 'adjustment',
    quantity_changed: '',
    notes: '',
  })
  const [movementErrors, setMovementErrors] = useState({})
  const [movementSubmitting, setMovementSubmitting] = useState(false)

  const [auditForm, setAuditForm] = useState({ title: '', section_name: '' })
  const [auditErrors, setAuditErrors] = useState({})
  const [auditSubmitting, setAuditSubmitting] = useState(false)

  const [auditLineForm, setAuditLineForm] = useState({
    inventory_item_id: '',
    counted_quantity: '',
    notes: '',
  })
  const [auditLineErrors, setAuditLineErrors] = useState({})
  const [auditLineSubmitting, setAuditLineSubmitting] = useState(false)

  const [reportType, setReportType] = useState('expiring_stock_value')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [expiryScanSubmitting, setExpiryScanSubmitting] = useState(false)
  const [analyticsSubmitting, setAnalyticsSubmitting] = useState(false)
  const [forecastSubmitting, setForecastSubmitting] = useState(false)
  const [auditActionSubmitting, setAuditActionSubmitting] = useState(false)
  const [acknowledgingAlertIds, setAcknowledgingAlertIds] = useState([])

  const [inventoryQuery, setInventoryQuery] = useState('')
  const [inventorySort, setInventorySort] = useState({ key: 'expiry_date', direction: 'asc' })
  const [alertQuery, setAlertQuery] = useState('')
  const [alertSort, setAlertSort] = useState({ key: 'days_to_expiry', direction: 'asc' })
  const [auditQuery, setAuditQuery] = useState('')
  const [auditSort, setAuditSort] = useState({ key: 'created_at', direction: 'desc' })
  const [reportQuery, setReportQuery] = useState('')
  const [reportSort, setReportSort] = useState({ key: 'id', direction: 'desc' })

  const [inventoryPage, setInventoryPage] = useState(1)
  const [alertsPage, setAlertsPage] = useState(1)
  const [auditsPage, setAuditsPage] = useState(1)
  const [reportsPage, setReportsPage] = useState(1)
  const [staffPage, setStaffPage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(() => toPositiveInt(localStorage.getItem('vuzima_table_page_size'), 10))

  const [dashboard, setDashboard] = useState(null)
  const [inventoryRows, setInventoryRows] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [drugs, setDrugs] = useState([])
  const [alerts, setAlerts] = useState([])
  const [reorderRows, setReorderRows] = useState([])
  const [analyticsRows, setAnalyticsRows] = useState([])
  const [audits, setAudits] = useState([])
  const [selectedAuditId, setSelectedAuditId] = useState(null)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [reportRows, setReportRows] = useState([])
  const [forecastData, setForecastData] = useState({ run: null, forecasts: [], anomalies: [] })
  const [staffRows, setStaffRows] = useState([])

  const [staffForm, setStaffForm] = useState({ email: '', password: '' })
  const [staffErrors, setStaffErrors] = useState({})
  const [staffSubmitting, setStaffSubmitting] = useState(false)
  const [staffQuery, setStaffQuery] = useState('')
  const [staffSort, setStaffSort] = useState({ key: 'id', direction: 'desc' })
  const [staffResetSubmittingIds, setStaffResetSubmittingIds] = useState([])
  const [staffDisableSubmittingIds, setStaffDisableSubmittingIds] = useState([])
  const [staffEnableSubmittingIds, setStaffEnableSubmittingIds] = useState([])
  const [staffActionModal, setStaffActionModal] = useState({
    open: false,
    mode: '',
    staffId: null,
    password: '',
  })
  const isAdmin = user?.role === 'admin'
  const visibleTabs = useMemo(() => (isAdmin ? tabs : tabs.filter((tab) => tab.id !== 'reports' && tab.id !== 'staff')), [isAdmin])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && tabs.some((item) => item.id === tab)) setActiveTab(tab)

    const invQ = params.get('invQ')
    const alQ = params.get('alQ')
    const auQ = params.get('auQ')
    const repQ = params.get('repQ')
    const invPage = params.get('invPage')
    const alPage = params.get('alPage')
    const auPage = params.get('auPage')
    const repPage = params.get('repPage')
    const stPage = params.get('stPage')
    const pageSize = params.get('pageSize')

    if (invQ) setInventoryQuery(invQ)
    if (alQ) setAlertQuery(alQ)
    if (auQ) setAuditQuery(auQ)
    if (repQ) setReportQuery(repQ)
    if (invPage) setInventoryPage(toPositiveInt(invPage, 1))
    if (alPage) setAlertsPage(toPositiveInt(alPage, 1))
    if (auPage) setAuditsPage(toPositiveInt(auPage, 1))
    if (repPage) setReportsPage(toPositiveInt(repPage, 1))
    if (stPage) setStaffPage(toPositiveInt(stPage, 1))
    if (pageSize) setTablePageSize(toPositiveInt(pageSize, 10))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', activeTab)
    if (inventoryQuery) params.set('invQ', inventoryQuery)
    if (alertQuery) params.set('alQ', alertQuery)
    if (auditQuery) params.set('auQ', auditQuery)
    if (reportQuery) params.set('repQ', reportQuery)
    params.set('invPage', String(inventoryPage))
    params.set('alPage', String(alertsPage))
    params.set('auPage', String(auditsPage))
    params.set('repPage', String(reportsPage))
    params.set('stPage', String(staffPage))
    params.set('pageSize', String(tablePageSize))

    const query = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
    localStorage.setItem('vuzima_table_page_size', String(tablePageSize))
  }, [
    activeTab,
    inventoryQuery,
    alertQuery,
    auditQuery,
    reportQuery,
    inventoryPage,
    alertsPage,
    auditsPage,
    reportsPage,
    staffPage,
    tablePageSize,
  ])

  function sortRows(rows, sortState) {
    const sorted = [...rows].sort((a, b) => {
      const key = sortState.key
      const av = a[key] ?? ''
      const bv = b[key] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortState.direction === 'asc' ? av - bv : bv - av
      }
      const left = String(av)
      const right = String(bv)
      return sortState.direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
    })
    return sorted
  }

  const filteredInventoryRows = useMemo(() => {
    const q = inventoryQuery.trim().toLowerCase()
    const rows = !q
      ? inventoryRows
      : inventoryRows.filter((row) => `${row.brand_name} ${row.batch_number} ${row.generic_name}`.toLowerCase().includes(q))
    return sortRows(rows, inventorySort)
  }, [inventoryRows, inventoryQuery, inventorySort])

  const filteredAlerts = useMemo(() => {
    const q = alertQuery.trim().toLowerCase()
    const rows = !q
      ? alerts
      : alerts.filter((row) => `${row.brand_name} ${row.alert_tier} ${row.batch_number}`.toLowerCase().includes(q))
    return sortRows(rows, alertSort)
  }, [alerts, alertQuery, alertSort])

  const filteredAudits = useMemo(() => {
    const q = auditQuery.trim().toLowerCase()
    const rows = !q
      ? audits
      : audits.filter((row) => `${row.title} ${row.section_name} ${row.status}`.toLowerCase().includes(q))
    return sortRows(rows, auditSort)
  }, [audits, auditQuery, auditSort])

  const filteredReportRows = useMemo(() => {
    const q = reportQuery.trim().toLowerCase()
    const rows = !q
      ? reportRows
      : reportRows.filter((row) => `${row.report_type} ${row.status} ${row.format} ${row.requested_by_email ?? ''}`.toLowerCase().includes(q))
    return sortRows(rows, reportSort)
  }, [reportRows, reportQuery, reportSort])

  const filteredStaffRows = useMemo(() => {
    const q = staffQuery.trim().toLowerCase()
    const rows = !q ? staffRows : staffRows.filter((row) => `${row.email}`.toLowerCase().includes(q))
    return sortRows(rows, staffSort)
  }, [staffRows, staffQuery, staffSort])

  const inventoryPaged = useMemo(() => paginateRows(filteredInventoryRows, inventoryPage, tablePageSize), [filteredInventoryRows, inventoryPage, tablePageSize])
  const alertsPaged = useMemo(() => paginateRows(filteredAlerts, alertsPage, tablePageSize), [filteredAlerts, alertsPage, tablePageSize])
  const auditsPaged = useMemo(() => paginateRows(filteredAudits, auditsPage, tablePageSize), [filteredAudits, auditsPage, tablePageSize])
  const reportsPaged = useMemo(() => paginateRows(filteredReportRows, reportsPage, tablePageSize), [filteredReportRows, reportsPage, tablePageSize])
  const staffPaged = useMemo(() => paginateRows(filteredStaffRows, staffPage, tablePageSize), [filteredStaffRows, staffPage, tablePageSize])

  function toggleSort(setter, current, key) {
    setter({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' })
  }

  function resetPages() {
    setInventoryPage(1)
    setAlertsPage(1)
    setAuditsPage(1)
    setReportsPage(1)
    setStaffPage(1)
  }

  function validateStaffForm() {
    const errors = {}
    if (!staffForm.email.includes('@')) errors.email = 'Valid email is required'
    if ((staffForm.password ?? '').length < 8) errors.password = 'Password must be at least 8 characters'
    setStaffErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateLogin() {
    const errors = {}
    if (!loginForm.email.includes('@')) errors.email = 'Valid email is required'
    if ((loginForm.password ?? '').length < 8) errors.password = 'Password must be at least 8 characters'
    setLoginErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateDrugForm() {
    const errors = {}
    if ((drugForm.brand_name ?? '').trim().length < 2) errors.brand_name = 'Brand name is required'
    if ((drugForm.generic_name ?? '').trim().length < 2) errors.generic_name = 'Generic name is required'
    if (Number(drugForm.cost_price || 0) < 0) errors.cost_price = 'Cost price cannot be negative'
    if (Number(drugForm.selling_price || 0) < 0) errors.selling_price = 'Selling price cannot be negative'
    if (Number(drugForm.reorder_level || 0) < 0) errors.reorder_level = 'Reorder level cannot be negative'
    setDrugErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateInventoryForm() {
    const errors = {}
    if (!inventoryForm.drug_id) errors.drug_id = 'Drug is required'
    if (!inventoryForm.expiry_date) errors.expiry_date = 'Expiry date is required'
    if (Number(inventoryForm.quantity_on_hand) < 0 || Number.isNaN(Number(inventoryForm.quantity_on_hand))) {
      errors.quantity_on_hand = 'Quantity must be zero or greater'
    }
    setInventoryErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateMovementForm() {
    const errors = {}
    if (!movementForm.inventory_item_id) errors.inventory_item_id = 'Inventory item is required'
    if (Number.isNaN(Number(movementForm.quantity_changed))) errors.quantity_changed = 'Quantity change is required'
    setMovementErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateAuditForm() {
    const errors = {}
    if ((auditForm.title ?? '').trim().length < 3) errors.title = 'Audit title is required'
    if ((auditForm.section_name ?? '').trim().length < 2) errors.section_name = 'Section is required'
    setAuditErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateAuditLineForm() {
    const errors = {}
    if (!auditLineForm.inventory_item_id) errors.inventory_item_id = 'Inventory item is required'
    if (Number(auditLineForm.counted_quantity) < 0 || Number.isNaN(Number(auditLineForm.counted_quantity))) {
      errors.counted_quantity = 'Counted quantity must be zero or greater'
    }
    setAuditLineErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
    const method = (options.method ?? 'GET').toUpperCase()
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' })

    let body = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    if (!response.ok) {
      throw new Error(body?.message ?? `Request failed (${response.status})`)
    }

    return body
  }

  async function loadCoreData() {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const jobs = [
        api('/api/inventory'),
        api('/api/alerts/expiry'),
        api('/api/reorder/suggestions'),
        api('/api/analytics/consumption'),
        api('/api/audits'),
        api('/api/suppliers'),
        api('/api/drugs'),
      ]

      if (isAdmin) {
        jobs.push(api('/api/dashboard/summary'))
        jobs.push(api('/api/reports'))
        jobs.push(api('/api/forecast/latest'))
        jobs.push(api('/api/users'))
      }

      const results = await Promise.all(jobs)
      const [inventoryRes, alertsRes, reorderRes, analyticsRes, auditsRes, suppliersRes, drugsRes, dashboardRes, reportsRes, forecastRes, usersRes] = results

      setInventoryRows(inventoryRes?.data ?? [])
      setAlerts(alertsRes?.data ?? [])
      setReorderRows(reorderRes?.data ?? [])
      setAnalyticsRows(analyticsRes?.data ?? [])
      setAudits(auditsRes?.data ?? [])
      setSuppliers(suppliersRes?.data ?? [])
      setDrugs(drugsRes?.data ?? [])

      if (isAdmin) {
        setDashboard(dashboardRes ?? null)
        setReportRows(reportsRes?.data ?? [])
        setForecastData(forecastRes ?? { run: null, forecasts: [], anomalies: [] })
        setStaffRows(usersRes?.data ?? [])
      }
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoreData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    if (!selectedAuditId || !isAuthenticated) {
      setSelectedAudit(null)
      return
    }

    api(`/api/audits/${selectedAuditId}`)
      .then((data) => setSelectedAudit(data))
      .catch((error) => showToast('error', formatError(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAuditId, isAuthenticated])

  async function handleLogin(event) {
    event.preventDefault()
    if (!validateLogin()) {
      showToast('error', 'Please correct login fields')
      return
    }

    setLoginSubmitting(true)
    try {
      const data = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginForm),
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.message ?? 'Login failed')
        return body
      })

      setIsAuthenticated(true)
      setUser(data.user)
      setCsrfToken(data.csrfToken ?? '')
      localStorage.setItem('vuzima_user', JSON.stringify(data.user))
      if (data.csrfToken) {
        localStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken)
      }
      showToast('success', 'Signed in successfully')
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setLoginSubmitting(false)
    }
  }

  function handleLogout() {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)
    setIsAuthenticated(false)
    setActiveTab('dashboard')
    setUser(null)
    setCsrfToken('')
    setDashboard(null)
    setInventoryRows([])
    setAlerts([])
    setReorderRows([])
    setAnalyticsRows([])
    setAudits([])
    setSelectedAuditId(null)
    setSelectedAudit(null)
    setReportRows([])
    setStaffRows([])
    setForecastData({ run: null, forecasts: [], anomalies: [] })
    localStorage.removeItem('vuzima_user')
    localStorage.removeItem(CSRF_STORAGE_KEY)
    showToast('success', 'Logged out')
  }

  async function createDrug(event) {
    event.preventDefault()
    if (drugSubmitting) return
    if (!validateDrugForm()) {
      showToast('error', 'Fix drug form errors')
      return
    }

    setDrugSubmitting(true)
    try {
      await api('/api/drugs', {
        method: 'POST',
        body: JSON.stringify({
          brand_name: drugForm.brand_name,
          generic_name: drugForm.generic_name,
          supplier_id: drugForm.supplier_id ? Number(drugForm.supplier_id) : null,
          cost_price: Number(drugForm.cost_price || 0),
          selling_price: Number(drugForm.selling_price || 0),
          reorder_level: Number(drugForm.reorder_level || 0),
        }),
      })

      setDrugForm({ brand_name: '', generic_name: '', supplier_id: '', cost_price: '', selling_price: '', reorder_level: '' })
      showToast('success', 'Drug created')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setDrugSubmitting(false)
    }
  }

  async function createInventoryItem(event) {
    event.preventDefault()
    if (inventorySubmitting) return
    if (!validateInventoryForm()) {
      showToast('error', 'Fix inventory form errors')
      return
    }

    setInventorySubmitting(true)
    try {
      await api('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          drug_id: Number(inventoryForm.drug_id),
          batch_number: inventoryForm.batch_number || null,
          expiry_date: inventoryForm.expiry_date,
          quantity_on_hand: Number(inventoryForm.quantity_on_hand),
        }),
      })

      setInventoryForm({ drug_id: '', batch_number: '', expiry_date: '', quantity_on_hand: '' })
      showToast('success', 'Inventory batch added')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setInventorySubmitting(false)
    }
  }

  async function uploadInventoryCsv(file) {
    if (csvUploadSubmitting) return false
    setCsvUploadSubmitting(true)
    try {
      const text = await file.text()
      const rows = parseInventoryCsv(text)
      await api('/api/inventory/import-csv', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      })
      showToast('success', `Imported ${rows.length} inventory rows`)
      await loadCoreData()
      return true
    } catch (error) {
      showToast('error', formatError(error))
      return false
    } finally {
      setCsvUploadSubmitting(false)
    }
  }

  async function postMovement(event) {
    event.preventDefault()
    if (movementSubmitting) return
    if (!validateMovementForm()) {
      showToast('error', 'Fix movement form errors')
      return
    }

    setMovementSubmitting(true)
    try {
      await api('/api/inventory/movement', {
        method: 'POST',
        body: JSON.stringify({
          inventory_item_id: Number(movementForm.inventory_item_id),
          movement_type: movementForm.movement_type,
          quantity_changed: Number(movementForm.quantity_changed),
          notes: movementForm.notes || null,
        }),
      })
      setMovementForm({ inventory_item_id: '', movement_type: 'adjustment', quantity_changed: '', notes: '' })
      showToast('success', 'Stock movement posted')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setMovementSubmitting(false)
    }
  }

  async function acknowledgeAlert(alertId) {
    if (acknowledgingAlertIds.includes(alertId)) return
    const removed = alerts.find((row) => row.id === alertId) ?? null
    setAcknowledgingAlertIds((current) => [...current, alertId])
    setAlerts((current) => current.filter((row) => row.id !== alertId))
    try {
      await api('/api/alerts/acknowledge', {
        method: 'POST',
        body: JSON.stringify({ alert_id: alertId }),
      })
      showToast('success', 'Alert acknowledged')
    } catch (error) {
      if (removed) setAlerts((current) => (current.some((row) => row.id === alertId) ? current : [removed, ...current]))
      showToast('error', formatError(error))
    } finally {
      setAcknowledgingAlertIds((current) => current.filter((id) => id !== alertId))
    }
  }

  async function runExpiryScan() {
    if (expiryScanSubmitting) return
    setExpiryScanSubmitting(true)
    try {
      await api('/api/jobs/run-expiry-scan', { method: 'POST' })
      showToast('success', 'Expiry scan completed')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setExpiryScanSubmitting(false)
    }
  }

  async function refreshAnalytics() {
    if (analyticsSubmitting) return
    setAnalyticsSubmitting(true)
    try {
      await api('/api/analytics/refresh', { method: 'POST' })
      showToast('success', 'Analytics refreshed')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setAnalyticsSubmitting(false)
    }
  }

  async function runForecast() {
    if (forecastSubmitting) return
    setForecastSubmitting(true)
    try {
      await api('/api/forecast/run', { method: 'POST' })
      showToast('success', 'Forecast run completed')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setForecastSubmitting(false)
    }
  }

  async function createAudit(event) {
    event.preventDefault()
    if (auditSubmitting) return
    if (!validateAuditForm()) {
      showToast('error', 'Fix audit form errors')
      return
    }

    setAuditSubmitting(true)
    try {
      const data = await api('/api/audits', { method: 'POST', body: JSON.stringify(auditForm) })
      setAuditForm({ title: '', section_name: '' })
      setSelectedAuditId(data.id)
      showToast('success', 'Audit created')
      await loadCoreData()
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setAuditSubmitting(false)
    }
  }

  async function addAuditLine(event) {
    event.preventDefault()
    if (auditLineSubmitting) return
    if (!selectedAuditId) {
      showToast('error', 'Select an audit first')
      return
    }
    if (!validateAuditLineForm()) {
      showToast('error', 'Fix audit line form errors')
      return
    }

    setAuditLineSubmitting(true)
    try {
      await api(`/api/audits/${selectedAuditId}/lines`, {
        method: 'POST',
        body: JSON.stringify({
          inventory_item_id: Number(auditLineForm.inventory_item_id),
          counted_quantity: Number(auditLineForm.counted_quantity),
          notes: auditLineForm.notes || null,
        }),
      })
      setAuditLineForm({ inventory_item_id: '', counted_quantity: '', notes: '' })
      showToast('success', 'Audit line saved')
      await loadCoreData()
      setSelectedAuditId(selectedAuditId)
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setAuditLineSubmitting(false)
    }
  }

  async function submitAudit() {
    if (auditActionSubmitting) return
    if (!selectedAuditId) {
      showToast('error', 'Select an audit first')
      return
    }
    setAuditActionSubmitting(true)
    try {
      await api(`/api/audits/${selectedAuditId}/submit`, { method: 'POST' })
      showToast('success', 'Audit submitted')
      await loadCoreData()
      setSelectedAuditId(selectedAuditId)
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setAuditActionSubmitting(false)
    }
  }

  async function reconcileAudit(status) {
    if (auditActionSubmitting) return
    if (!selectedAuditId) {
      showToast('error', 'Select an audit first')
      return
    }

    setAuditActionSubmitting(true)
    try {
      await api(`/api/audits/${selectedAuditId}/reconcile`, {
        method: 'POST',
        body: JSON.stringify({ status, comments: status === 'approved' ? 'Approved' : 'Rejected for recount' }),
      })
      showToast('success', `Audit ${status}`)
      await loadCoreData()
      setSelectedAuditId(selectedAuditId)
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setAuditActionSubmitting(false)
    }
  }

  async function queueReport() {
    if (reportSubmitting) return
    setReportSubmitting(true)
    const optimistic = {
      id: `pending-${Date.now()}`,
      report_type: reportType,
      status: 'processing',
      format: 'csv',
      requested_by_email: user?.email ?? '--',
      file_path: '--',
    }
    setReportRows((current) => [optimistic, ...current])
    try {
      await api('/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({ report_type: reportType, format: 'csv', params: {} }),
      })
      await api('/api/reports/process', { method: 'POST' })
      showToast('success', 'Report queued and processed')
      await loadCoreData()
    } catch (error) {
      setReportRows((current) => current.filter((row) => row.id !== optimistic.id))
      showToast('error', formatError(error))
    } finally {
      setReportSubmitting(false)
    }
  }

  async function createStaff(event) {
    event.preventDefault()
    if (staffSubmitting) return
    if (!validateStaffForm()) {
      showToast('error', 'Fix staff form errors')
      return
    }

    setStaffSubmitting(true)
    try {
      const response = await api('/api/users/staff', {
        method: 'POST',
        body: JSON.stringify(staffForm),
      })
      setStaffRows((current) => [response.data, ...current])
      setStaffForm({ email: '', password: '' })
      showToast('success', 'Staff account created')
    } catch (error) {
      showToast('error', formatError(error))
    } finally {
      setStaffSubmitting(false)
    }
  }

  async function resetStaffTempPassword(staffId) {
    if (staffResetSubmittingIds.includes(staffId)) return
    setStaffActionModal({
      open: true,
      mode: 'reset_password',
      staffId,
      password: '',
    })
  }

  async function disableStaffAccount(staffId) {
    if (staffDisableSubmittingIds.includes(staffId)) return
    setStaffActionModal({
      open: true,
      mode: 'disable',
      staffId,
      password: '',
    })
  }

  async function enableStaffAccount(staffId) {
    if (staffEnableSubmittingIds.includes(staffId)) return

    const previous = staffRows
    setStaffEnableSubmittingIds((current) => [...current, staffId])
    setStaffRows((current) => current.map((row) => (row.id === staffId ? { ...row, is_active: true } : row)))

    try {
      await api(`/api/users/staff/${staffId}/enable`, { method: 'POST' })
      showToast('success', 'Staff account enabled')
    } catch (error) {
      setStaffRows(previous)
      showToast('error', formatError(error))
    } finally {
      setStaffEnableSubmittingIds((current) => current.filter((id) => id !== staffId))
    }
  }

  function closeStaffActionModal() {
    setStaffActionModal({
      open: false,
      mode: '',
      staffId: null,
      password: '',
    })
  }

  async function confirmStaffActionModal() {
    if (!staffActionModal.open || !staffActionModal.staffId) return

    const { mode, staffId, password } = staffActionModal

    if (mode === 'reset_password') {
      if (password.length < 8) {
        showToast('error', 'Temporary password must be at least 8 characters')
        return
      }

      setStaffResetSubmittingIds((current) => [...current, staffId])
      try {
        await api(`/api/users/staff/${staffId}/reset-password`, {
          method: 'POST',
          body: JSON.stringify({ password }),
        })
        showToast('success', 'Temporary password reset successfully')
        closeStaffActionModal()
      } catch (error) {
        showToast('error', formatError(error))
      } finally {
        setStaffResetSubmittingIds((current) => current.filter((id) => id !== staffId))
      }
      return
    }

    if (mode === 'disable') {
      const previous = staffRows
      setStaffDisableSubmittingIds((current) => [...current, staffId])
      setStaffRows((current) => current.map((row) => (row.id === staffId ? { ...row, is_active: false } : row)))

      try {
        await api(`/api/users/staff/${staffId}/disable`, { method: 'POST' })
        showToast('success', 'Staff account disabled')
        closeStaffActionModal()
      } catch (error) {
        setStaffRows(previous)
        showToast('error', formatError(error))
      } finally {
        setStaffDisableSubmittingIds((current) => current.filter((id) => id !== staffId))
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <AuthView
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginErrors={loginErrors}
        loginSubmitting={loginSubmitting}
        onSubmit={handleLogin}
        toast={toast}
      />
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="main">
        <TopBar
          title={tabs.find((tab) => tab.id === activeTab)?.label ?? 'Dashboard'}
          loading={loading}
          onRefresh={loadCoreData}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {activeTab === 'dashboard' ? (
          <DashboardTab
            dashboard={dashboard}
            forecastData={forecastData}
            isAdmin={isAdmin}
            onRunForecast={runForecast}
            onRunExpiryScan={runExpiryScan}
            onRefreshAnalytics={refreshAnalytics}
            forecastSubmitting={forecastSubmitting}
            expiryScanSubmitting={expiryScanSubmitting}
            analyticsSubmitting={analyticsSubmitting}
          />
        ) : null}

        {activeTab === 'inventory' ? (
          <InventoryTab
            isAdmin={isAdmin}
            suppliers={suppliers}
            drugs={drugs}
            inventoryRows={inventoryRows}
            drugForm={drugForm}
            setDrugForm={setDrugForm}
            drugErrors={drugErrors}
            drugSubmitting={drugSubmitting}
            onCreateDrug={createDrug}
            inventoryForm={inventoryForm}
            setInventoryForm={setInventoryForm}
            inventoryErrors={inventoryErrors}
            inventorySubmitting={inventorySubmitting}
            onCreateInventoryItem={createInventoryItem}
            movementForm={movementForm}
            setMovementForm={setMovementForm}
            movementErrors={movementErrors}
            movementSubmitting={movementSubmitting}
            onPostMovement={postMovement}
            inventoryQuery={inventoryQuery}
            setInventoryQuery={setInventoryQuery}
            inventorySort={inventorySort}
            onToggleInventorySort={(key) => toggleSort(setInventorySort, inventorySort, key)}
            tablePageSize={tablePageSize}
            onChangePageSize={(value) => {
              setTablePageSize(toPositiveInt(value, 10))
              resetPages()
            }}
            inventoryPaged={inventoryPaged}
            onChangeInventoryPage={setInventoryPage}
            csvUploadSubmitting={csvUploadSubmitting}
            onUploadInventoryCsv={uploadInventoryCsv}
          />
        ) : null}

        {activeTab === 'alerts' ? (
          <AlertsTab
            isAdmin={isAdmin}
            alertQuery={alertQuery}
            setAlertQuery={setAlertQuery}
            alertSort={alertSort}
            onToggleAlertSort={(key) => toggleSort(setAlertSort, alertSort, key)}
            alertsPaged={alertsPaged}
            onAcknowledgeAlert={acknowledgeAlert}
            acknowledgingAlertIds={acknowledgingAlertIds}
            onChangeAlertsPage={setAlertsPage}
            reorderRows={reorderRows}
            analyticsRows={analyticsRows}
            onRunExpiryScan={runExpiryScan}
            onRefreshData={loadCoreData}
          />
        ) : null}

        {activeTab === 'audits' ? (
          <AuditsTab
            isAdmin={isAdmin}
            auditForm={auditForm}
            setAuditForm={setAuditForm}
            auditErrors={auditErrors}
            auditSubmitting={auditSubmitting}
            onCreateAudit={createAudit}
            auditLineForm={auditLineForm}
            setAuditLineForm={setAuditLineForm}
            auditLineErrors={auditLineErrors}
            auditLineSubmitting={auditLineSubmitting}
            onAddAuditLine={addAuditLine}
            inventoryRows={inventoryRows}
            onSubmitAudit={submitAudit}
            onReconcileAudit={reconcileAudit}
            auditActionSubmitting={auditActionSubmitting}
            auditQuery={auditQuery}
            setAuditQuery={setAuditQuery}
            auditSort={auditSort}
            onToggleAuditSort={(key) => toggleSort(setAuditSort, auditSort, key)}
            auditsPaged={auditsPaged}
            onOpenAudit={setSelectedAuditId}
            onChangeAuditsPage={setAuditsPage}
            selectedAudit={selectedAudit}
          />
        ) : null}

        {activeTab === 'reports' && isAdmin ? (
          <ReportsTab
            reportType={reportType}
            setReportType={setReportType}
            reportSubmitting={reportSubmitting}
            onQueueReport={queueReport}
            reportQuery={reportQuery}
            setReportQuery={setReportQuery}
            reportSort={reportSort}
            onToggleReportSort={(key) => toggleSort(setReportSort, reportSort, key)}
            reportsPaged={reportsPaged}
            onChangeReportsPage={setReportsPage}
          />
        ) : null}

        {activeTab === 'staff' && isAdmin ? (
          <StaffTab
            staffForm={staffForm}
            setStaffForm={setStaffForm}
            staffErrors={staffErrors}
            staffSubmitting={staffSubmitting}
            onCreateStaff={createStaff}
            staffQuery={staffQuery}
            setStaffQuery={setStaffQuery}
            staffSort={staffSort}
            onToggleStaffSort={(key) => toggleSort(setStaffSort, staffSort, key)}
            staffPaged={staffPaged}
            onChangeStaffPage={setStaffPage}
            onResetTempPassword={resetStaffTempPassword}
            onDisableStaff={disableStaffAccount}
            onEnableStaff={enableStaffAccount}
            staffResetSubmittingIds={staffResetSubmittingIds}
            staffDisableSubmittingIds={staffDisableSubmittingIds}
            staffEnableSubmittingIds={staffEnableSubmittingIds}
          />
        ) : null}
      </main>

      <StaffActionModal
        open={staffActionModal.open}
        mode={staffActionModal.mode}
        value={staffActionModal.password}
        onValueChange={(password) => setStaffActionModal((current) => ({ ...current, password }))}
        onCancel={closeStaffActionModal}
        onConfirm={confirmStaffActionModal}
        submitting={
          (staffActionModal.mode === 'reset_password' && staffResetSubmittingIds.includes(staffActionModal.staffId)) ||
          (staffActionModal.mode === 'disable' && staffDisableSubmittingIds.includes(staffActionModal.staffId))
        }
      />

      {toast ? <div className={`toast ${toast.kind}`}>{toast.text}</div> : null}
    </div>
  )
}

export default App
