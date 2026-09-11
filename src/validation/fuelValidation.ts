import { z } from 'zod'

export const VehicleSchema = z.object({
  id: z.string().optional(),
  vehicleNumber: z
    .string()
    .min(3, 'Vehicle number must be at least 3 characters')
    .max(20, 'Vehicle number cannot exceed 20 characters')
    .transform((val) => val.trim().toUpperCase()),
  makeModel: z
    .string()
    .min(2, 'Make and model must be at least 2 characters')
    .max(100)
    .transform((val) => val.trim()),
  fuelType: z.enum(['Petrol', 'Diesel', 'CNG', 'Electric'] as const),
  tankCapacity: z.number().positive('Tank capacity must be greater than 0').optional(),
  currentOdometer: z.number().int().nonnegative('Current odometer cannot be negative'),
})

export const FuelEntryInputSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  quantity: z.number().positive('Fuel quantity must be greater than 0'),
  amount: z.number().positive('Total amount must be greater than 0'),
  odometer: z.number().int().nonnegative('Odometer reading cannot be negative'),
  previousOdometer: z.number().int().nonnegative().optional(),
  fuelStationName: z.string().min(1, 'Fuel station name is required'),
  locationAddress: z.string().min(1, 'Location address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  fuelType: z.string().min(1, 'Fuel type is required'),
  notes: z.string().max(500).optional(),
})

export interface ValidatedMetrics {
  rate: number
  distance?: number
  mileage?: number
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateAndCalculateMetrics(
  currentOdometer: number,
  previousOdometer: number | undefined,
  quantity: number,
  amount: number,
  tankCapacity?: number
): ValidatedMetrics {
  const errors: string[] = []
  const warnings: string[] = []

  if (quantity <= 0 || !isFinite(quantity) || isNaN(quantity)) {
    errors.push('Fuel quantity must be greater than 0 litres.')
  }

  if (amount <= 0 || !isFinite(amount) || isNaN(amount)) {
    errors.push('Total amount must be greater than 0.')
  }

  if (currentOdometer < 0 || !isFinite(currentOdometer) || isNaN(currentOdometer)) {
    errors.push('Odometer reading must be a valid non-negative number.')
  }

  if (tankCapacity && tankCapacity > 0 && quantity > tankCapacity * 1.1) {
    warnings.push(`Entered fuel volume (${quantity}L) exceeds vehicle tank capacity (${tankCapacity}L).`)
  }

  const rate = quantity > 0 && amount > 0 ? Number((amount / quantity).toFixed(2)) : 0

  let distance: number | undefined = undefined
  let mileage: number | undefined = undefined

  if (previousOdometer !== undefined && previousOdometer > 0) {
    if (currentOdometer < previousOdometer) {
      errors.push(
        `Current odometer (${currentOdometer} km) cannot be less than previous recorded reading (${previousOdometer} km).`
      )
    } else {
      distance = currentOdometer - previousOdometer
      if (quantity > 0 && distance >= 0) {
        const rawMileage = distance / quantity
        if (isFinite(rawMileage) && !isNaN(rawMileage)) {
          mileage = Number(rawMileage.toFixed(2))
        }
      }
    }
  }

  return {
    rate,
    distance,
    mileage,
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
