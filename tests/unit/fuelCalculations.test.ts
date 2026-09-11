import { describe, it, expect } from 'vitest'
import { validateAndCalculateMetrics } from '../../src/validation/fuelValidation'
import { fuelService } from '../../src/services/fuelService'

describe('Fuel Calculations & Metrics Logic', () => {
  it('correctly calculates fuel rate, distance, and mileage for valid inputs', () => {
    const currentOdo = 48625
    const prevOdo = 48120
    const quantity = 32.45
    const amount = 3245.0

    const result = validateAndCalculateMetrics(currentOdo, prevOdo, quantity, amount)

    expect(result.isValid).toBe(true)
    expect(result.rate).toBe(100.0)
    expect(result.distance).toBe(505)
    expect(result.mileage).toBe(15.56) // 505 / 32.45
    expect(result.errors).toHaveLength(0)
  })

  it('flags error when current odometer is lower than previous odometer', () => {
    const currentOdo = 47000
    const prevOdo = 48120
    const quantity = 30
    const amount = 3000

    const result = validateAndCalculateMetrics(currentOdo, prevOdo, quantity, amount)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'Current odometer (47000 km) cannot be less than previous recorded reading (48120 km).'
    )
    expect(result.distance).toBeUndefined()
    expect(result.mileage).toBeUndefined()
  })

  it('rejects zero or negative fuel volume', () => {
    const resultZero = validateAndCalculateMetrics(50000, 49500, 0, 1000)
    expect(resultZero.isValid).toBe(false)
    expect(resultZero.errors).toContain('Fuel quantity must be greater than 0 litres.')

    const resultNeg = validateAndCalculateMetrics(50000, 49500, -10, 1000)
    expect(resultNeg.isValid).toBe(false)
    expect(resultNeg.errors).toContain('Fuel quantity must be greater than 0 litres.')
  })

  it('rejects zero or negative total amount', () => {
    const resultZero = validateAndCalculateMetrics(50000, 49500, 20, 0)
    expect(resultZero.isValid).toBe(false)
    expect(resultZero.errors).toContain('Total amount must be greater than 0.')

    const resultNeg = validateAndCalculateMetrics(50000, 49500, 20, -500)
    expect(resultNeg.isValid).toBe(false)
    expect(resultNeg.errors).toContain('Total amount must be greater than 0.')
  })

  it('warns when fuel volume exceeds vehicle tank capacity', () => {
    const result = validateAndCalculateMetrics(50000, 49500, 65, 6500, 45) // 65L in 45L tank
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('exceeds vehicle tank capacity')
  })

  it('calculates aggregate dashboard statistics accurately', () => {
    const entries = [
      {
        id: '1',
        vehicleNumber: 'TN 09 BX 4821',
        fuelType: 'Petrol',
        stationName: 'Station 1',
        location: 'Location 1',
        latitude: 12.0,
        longitude: 80.0,
        quantity: 30,
        amount: 3000,
        rate: 100,
        odometer: 10500,
        previousOdometer: 10000,
        distance: 500,
        mileage: 16.67,
        date: '2026-09-01',
        time: '10:00',
        ocrConfidence: { quantity: 100, amount: 100, odometer: 100 },
        createdAt: '2026-09-01T10:00:00Z',
      },
      {
        id: '2',
        vehicleNumber: 'TN 09 BX 4821',
        fuelType: 'Petrol',
        stationName: 'Station 2',
        location: 'Location 2',
        latitude: 12.0,
        longitude: 80.0,
        quantity: 20,
        amount: 2000,
        rate: 100,
        odometer: 10800,
        previousOdometer: 10500,
        distance: 300,
        mileage: 15.0,
        date: '2026-09-05',
        time: '12:00',
        ocrConfidence: { quantity: 100, amount: 100, odometer: 100 },
        createdAt: '2026-09-05T12:00:00Z',
      },
    ]

    const stats = fuelService.computeDashboardStats(entries)

    expect(stats.totalCost).toBe(5000)
    expect(stats.totalLitres).toBe(50)
    expect(stats.totalDistance).toBe(800)
    expect(stats.lastOdometer).toBe(10800)
    expect(stats.averageMileage).toBeCloseTo(15.8, 1)
  })

  it('handles empty entries gracefully without NaN or Infinity', () => {
    const stats = fuelService.computeDashboardStats([])
    expect(stats.totalCost).toBe(0)
    expect(stats.totalLitres).toBe(0)
    expect(stats.totalDistance).toBe(0)
    expect(stats.averageMileage).toBe(0)
    expect(stats.lastOdometer).toBe(0)
  })
})
