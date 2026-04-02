export interface OfflineQueueRecord {
  inventory_item_id: number
  counted_quantity: number
  captured_at: string
}

export function summarizeOfflineQueue(records: OfflineQueueRecord[]) {
  return {
    queued: records.length,
    latestCaptureAt: records.length ? records[records.length - 1].captured_at : null,
  }
}
