import { Router } from 'express'

export const mockRouter = Router()

mockRouter.get('/dashboard', (_, res) => {
  res.json({
    totalStockValue: 1284230,
    expiringValue30d: 124900,
    lowStockSkus: 14,
    ownerMargin: 24.1,
    forecastHighlights: [
      'Paracetamol expected +12% in next 30 days',
      'ORS expected +9% due to seasonal trend',
    ],
  })
})
