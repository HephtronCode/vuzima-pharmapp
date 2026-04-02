export function formatMoney(value) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function formatDate(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export function formatError(error) {
  return error instanceof Error ? error.message : 'Unexpected error'
}

export function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed > 0) return parsed
  return fallback
}

export function paginateRows(rows, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  }
}
