import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SqlJsDriver } from '../../src/database/driver'
import { MigrationRunner } from '../../src/database/migrations'
import { VehicleRepository } from '../../src/database/repositories/vehicleRepository'
import { FuelRepository } from '../../src/database/repositories/fuelRepository'
import { PhotoRepository } from '../../src/database/repositories/photoRepository'
import { OcrRepository } from '../../src/database/repositories/ocrRepository'

describe('SQLite Repositories & Transaction Layer', () => {
  let driver: SqlJsDriver
  let vehicleRepo: VehicleRepository
  let fuelRepo: FuelRepository
  let photoRepo: PhotoRepository
  let ocrRepo: OcrRepository

  beforeEach(async () => {
    // Isolated in-memory SQLite driver for each test
    driver = new SqlJsDriver(true)
    await driver.init()
    await MigrationRunner.run(driver)

    vehicleRepo = new VehicleRepository(driver)
    fuelRepo = new FuelRepository(driver)
    photoRepo = new PhotoRepository(driver)
    ocrRepo = new OcrRepository(driver)
  })

  afterEach(async () => {
    await driver.close()
  })

  it('creates and retrieves vehicles with unique constraints', async () => {
    const v1 = await vehicleRepo.create({
      vehicleNumber: 'TN 09 BX 4821',
      makeModel: 'Hyundai Creta',
      fuelType: 'Petrol',
      tankCapacity: 50,
      currentOdometer: 45000,
    })

    expect(v1.id).toBeDefined()
    expect(v1.vehicleNumber).toBe('TN 09 BX 4821')

    const all = await vehicleRepo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].makeModel).toBe('Hyundai Creta')

    // Duplicate vehicle number rejection
    await expect(
      vehicleRepo.create({
        vehicleNumber: 'TN 09 BX 4821',
        makeModel: 'Duplicate Car',
        fuelType: 'Petrol',
        currentOdometer: 1000,
      })
    ).rejects.toThrow()
  })

  it('updates vehicle odometer and active vehicle details', async () => {
    const v = await vehicleRepo.create({
      vehicleNumber: 'KA 01 MG 9999',
      makeModel: 'Tata Nexon',
      fuelType: 'Diesel',
      currentOdometer: 12000,
    })

    await vehicleRepo.updateOdometer(v.id, 12550)
    const updated = await vehicleRepo.getById(v.id)
    expect(updated?.currentOdometer).toBe(12550)

    // Ensure odometer cannot be regressed by updateOdometer MAX()
    await vehicleRepo.updateOdometer(v.id, 11000)
    const notRegressed = await vehicleRepo.getById(v.id)
    expect(notRegressed?.currentOdometer).toBe(12550)
  })

  it('atomically creates fuel entry, photos, and ocr results in a transaction', async () => {
    const vehicle = await vehicleRepo.create({
      vehicleNumber: 'MH 02 CZ 5555',
      makeModel: 'Honda City',
      fuelType: 'Petrol',
      currentOdometer: 20000,
    })

    const entry = await fuelRepo.createWithTransaction(
      {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        capturedAt: '2026-09-10T14:30:00Z',
        fuelStationName: 'Indian Oil - Highway',
        locationAddress: 'Pune Highway',
        latitude: 18.5204,
        longitude: 73.8567,
        fuelType: 'Petrol',
        quantity: 35.0,
        amount: 3500.0,
        rate: 100.0,
        odometer: 20500,
        previousOdometer: 20000,
        distance: 500,
        mileage: 14.29,
      },
      [
        {
          photoType: 'METER',
          localPath: 'photos/meter_1.jpg',
          fileName: 'meter_1.jpg',
          capturedAt: '2026-09-10T14:30:00Z',
        },
        {
          photoType: 'VEHICLE',
          localPath: 'photos/vehicle_1.jpg',
          fileName: 'vehicle_1.jpg',
          capturedAt: '2026-09-10T14:31:00Z',
        },
      ],
      [
        { fieldName: 'quantity', extractedValue: 35.0, confidence: 99, source: 'OCR' },
        { fieldName: 'amount', extractedValue: 3500.0, confidence: 98, source: 'OCR' },
        { fieldName: 'odometer', extractedValue: 20500, confidence: 100, source: 'OCR' },
      ]
    )

    expect(entry.id).toBeDefined()
    expect(entry.meterPhotoUri).toBe('photos/meter_1.jpg')

    // Verify vehicle odometer was updated atomically
    const vUpdated = await vehicleRepo.getById(vehicle.id)
    expect(vUpdated?.currentOdometer).toBe(20500)

    // Verify photos were persisted
    const photos = await photoRepo.getByFuelEntryId(entry.id)
    expect(photos).toHaveLength(2)

    // Verify OCR results were persisted
    const ocr = await ocrRepo.getByFuelEntryId(entry.id)
    expect(ocr).toHaveLength(3)
  })

  it('rolls back completely if a step in the transaction fails', async () => {
    const vehicle = await vehicleRepo.create({
      vehicleNumber: 'DL 01 AB 1234',
      makeModel: 'Maruti Swift',
      fuelType: 'Petrol',
      currentOdometer: 10000,
    })

    // Attempt invalid transaction with foreign key violation on vehicleId
    await expect(
      fuelRepo.createWithTransaction({
        vehicleId: 'non-existent-vehicle-id',
        capturedAt: '2026-09-10T10:00:00Z',
        fuelStationName: 'Station',
        locationAddress: 'Loc',
        latitude: 0,
        longitude: 0,
        fuelType: 'Petrol',
        quantity: 20,
        amount: 2000,
        rate: 100,
        odometer: 10500,
      })
    ).rejects.toThrow()

    // Verify no orphaned records were committed
    const allEntries = await fuelRepo.getAll()
    expect(allEntries).toHaveLength(0)

    const vUnchanged = await vehicleRepo.getById(vehicle.id)
    expect(vUnchanged?.currentOdometer).toBe(10000)
  })

  it('calculates database-driven analytics across vehicles and time ranges', async () => {
    const vehicle = await vehicleRepo.create({
      vehicleNumber: 'TN 01 AA 1111',
      makeModel: 'Hyundai i20',
      fuelType: 'Petrol',
      currentOdometer: 5000,
    })

    await fuelRepo.createWithTransaction({
      vehicleId: vehicle.id,
      capturedAt: new Date().toISOString(),
      fuelStationName: 'Station A',
      locationAddress: 'Loc A',
      latitude: 12.0,
      longitude: 80.0,
      fuelType: 'Petrol',
      quantity: 25.0,
      amount: 2500.0,
      rate: 100.0,
      odometer: 5400,
      previousOdometer: 5000,
      distance: 400,
      mileage: 16.0,
    })

    await fuelRepo.createWithTransaction({
      vehicleId: vehicle.id,
      capturedAt: new Date().toISOString(),
      fuelStationName: 'Station B',
      locationAddress: 'Loc B',
      latitude: 12.0,
      longitude: 80.0,
      fuelType: 'Petrol',
      quantity: 20.0,
      amount: 2000.0,
      rate: 100.0,
      odometer: 5750,
      previousOdometer: 5400,
      distance: 350,
      mileage: 17.5,
    })

    const analytics = await fuelRepo.getAnalytics(vehicle.id)

    expect(analytics.entryCount).toBe(2)
    expect(analytics.totalLitres).toBe(45.0)
    expect(analytics.totalCost).toBe(4500.0)
    expect(analytics.totalDistance).toBe(750)
    expect(analytics.lastOdometer).toBe(5750)
    expect(analytics.averageMileage).toBeCloseTo(16.75, 1)
  })
})
