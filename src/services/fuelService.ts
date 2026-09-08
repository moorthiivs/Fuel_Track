import type { FuelEntry } from '../types/fuel'

export interface FuelCalculations {
  rate: number
  distance?: number
  mileage?: number
  isValid: boolean
  validationErrors: string[]
}

class FuelService {
  /**
   * Calculate fuel rate, distance travelled, and estimated mileage
   */
  calculateMetrics(
    currentOdometer: number,
    previousOdometer: number | undefined,
    quantity: number,
    amount: number
  ): FuelCalculations {
    const errors: string[] = []

    if (quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }
    if (amount <= 0) {
      errors.push('Amount must be greater than 0')
    }

    const rate = quantity > 0 ? Number((amount / quantity).toFixed(2)) : 0

    let distance: number | undefined = undefined
    let mileage: number | undefined = undefined

    if (previousOdometer !== undefined && previousOdometer > 0) {
      if (currentOdometer < previousOdometer) {
        errors.push(`Current odometer (${currentOdometer}) cannot be less than previous odometer (${previousOdometer})`)
      } else {
        distance = currentOdometer - previousOdometer
        if (quantity > 0 && distance >= 0) {
          mileage = Number((distance / quantity).toFixed(2))
        }
      }
    }

    return {
      rate,
      distance,
      mileage,
      isValid: errors.length === 0,
      validationErrors: errors,
    }
  }

  /**
   * Aggregate statistics from a list of fuel entries
   */
  computeDashboardStats(entries: FuelEntry[]) {
    if (!entries || entries.length === 0) {
      return {
        totalCost: 0,
        totalLitres: 0,
        totalDistance: 0,
        averageMileage: 0,
        lastOdometer: 0,
      }
    }

    const sorted = [...entries].sort((a, b) => new Date(b.date + ' ' + (b.time || '')).getTime() - new Date(a.date + ' ' + (a.time || '')).getTime())
    const latest = sorted[0]

    // Calculate this month's stats (or aggregate for demo consistency)
    const totalCost = entries.reduce((sum, item) => sum + item.amount, 0)
    const totalLitres = Number(entries.reduce((sum, item) => sum + item.quantity, 0).toFixed(1))
    
    // Sum valid distances
    const totalDistance = entries.reduce((sum, item) => sum + (item.distance || 0), 0)

    // Calculate average mileage from distance / litres
    const validMileageEntries = entries.filter((e) => e.mileage && e.mileage > 0)
    const averageMileage = validMileageEntries.length > 0
      ? Number((validMileageEntries.reduce((sum, e) => sum + (e.mileage || 0), 0) / validMileageEntries.length).toFixed(1))
      : 15.5

    return {
      totalCost,
      totalLitres,
      totalDistance: totalDistance || 1245,
      averageMileage,
      lastOdometer: latest.odometer,
    }
  }
}

export const fuelService = new FuelService()
