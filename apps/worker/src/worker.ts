import { summarizeOfflineQueue } from './offlineQueueSimulator.js'

const startupMessage = [
  'Vuzima worker booted.',
  'Intended queue jobs: expiry alerts, report exports, forecast runs.',
  'Connect BullMQ + Redis in next phase.',
].join(' ')

console.log(startupMessage)

const offlinePreview = summarizeOfflineQueue([
  {
    inventory_item_id: 1,
    counted_quantity: 1120,
    captured_at: new Date().toISOString(),
  },
])

console.log('Offline queue preview', offlinePreview)
