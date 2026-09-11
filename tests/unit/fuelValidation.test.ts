import { describe, it, expect } from 'vitest'
import { VehicleSchema, FuelEntryInputSchema } from '../../src/validation/fuelValidation'

describe('Zod Validation Schemas', () => {
  it('validates and formats valid vehicle payload', () => {
    const validVehicle = {
      vehicleNumber: 'tn 09 bx 4821',
      makeModel: 'Hyundai Creta SX',
      fuelType: 'Petrol' as const,
      tankCapacity: 50,
      currentOdometer: 48000,
    }

    const parsed = VehicleSchema.parse(validVehicle)
    expect(parsed.vehicleNumber).toBe('TN 09 BX 4821') // Auto-trimmed and uppercase
    expect(parsed.makeModel).toBe('Hyundai Creta SX')
    expect(parsed.fuelType).toBe('Petrol')
  })

  it('rejects vehicle with invalid fuel type or negative odometer', () => {
    expect(() =>
      VehicleSchema.parse({
        vehicleNumber: 'TN 09',
        makeModel: 'Car',
        fuelType: 'Kerosene', // invalid
        currentOdometer: 100,
      })
    ).toThrow()

    expect(() =>
      VehicleSchema.parse({
        vehicleNumber: 'TN 09 BX 1234',
        makeModel: 'Car',
        fuelType: 'Petrol',
        currentOdometer: -500, // negative
      })
    ).toThrow()
  })

  it('validates valid fuel entry input', () => {
    const validEntry = {
      vehicleId: 'veh-001',
      quantity: 35.5,
      amount: 3621.0,
      odometer: 49000,
      fuelStationName: 'Shell Bunk',
      locationAddress: 'Sholinganallur, Chennai',
      latitude: 12.9015,
      longitude: 80.2279,
      fuelType: 'Petrol',
    }

    const parsed = FuelEntryInputSchema.parse(validEntry)
    expect(parsed.quantity).toBe(35.5)
    expect(parsed.amount).toBe(3621.0)
  })

  it('rejects fuel entry with non-positive volume or amount', () => {
    expect(() =>
      FuelEntryInputSchema.parse({
        vehicleId: 'veh-001',
        quantity: 0,
        amount: 1000,
        odometer: 49000,
        fuelStationName: 'Station',
        locationAddress: 'Loc',
        latitude: 12.0,
        longitude: 80.0,
        fuelType: 'Petrol',
      })
    ).toThrow()

    expect(() =>
      FuelEntryInputSchema.parse({
        vehicleId: 'veh-001',
        quantity: 10,
        amount: -50,
        odometer: 49000,
        fuelStationName: 'Station',
        locationAddress: 'Loc',
        latitude: 12.0,
        longitude: 80.0,
        fuelType: 'Petrol',
      })
    ).toThrow()
  })

  it('rejects coordinates out of geographical bounds', () => {
    expect(() =>
      FuelEntryInputSchema.parse({
        vehicleId: 'veh-001',
        quantity: 10,
        amount: 1000,
        odometer: 49000,
        fuelStationName: 'Station',
        locationAddress: 'Loc',
        latitude: 195.0, // out of range -90..90
        longitude: 80.0,
        fuelType: 'Petrol',
      })
    ).toThrow()
  })
})
