import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatabaseManager } from '../../src/database/database'
import { SqlJsDriver } from '../../src/database/driver'
import { MigrationRunner } from '../../src/database/migrations'
import { FuelRepository } from '../../src/database/repositories/fuelRepository'
import { VehicleRepository } from '../../src/database/repositories/vehicleRepository'
import { photoStorageService } from '../../src/services/photoStorageService'

vi.mock('../../src/services/photoStorageService', () => ({
  photoStorageService: {
    deletePhoto: vi.fn().mockResolvedValue(true),
    savePhotoPermanently: vi.fn().mockResolvedValue({ localPath: '/photos/test.jpg', fileName: 'test.jpg' }),
  },
}))

describe('Database Safety & Lifecycle State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks status lifecycle transitions from IDLE to READY', async () => {
    const db = DatabaseManager.getInstance()
    // Trigger initialization
    const driver = await db.getDriver()
    expect(driver).toBeDefined()
    expect(db.getStatus()).toBe('READY')
    expect(db.getError()).toBeNull()
  })

  it('handles initialization failure gracefully and transitions to ERROR status', async () => {
    const db = DatabaseManager.getInstance()

    // Force error by mocking MigrationRunner.run
    const originalRun = MigrationRunner.run
    vi.spyOn(MigrationRunner, 'run').mockRejectedValueOnce(new Error('Simulated SQLite Disk I/O Error'))

    await expect(db.retryInitialization()).rejects.toThrow('Simulated SQLite Disk I/O Error')
    expect(db.getStatus()).toBe('ERROR')
    expect(db.getError()?.message).toContain('Simulated SQLite Disk I/O Error')

    // Restore and retry initialization
    MigrationRunner.run = originalRun
    const recoveredDriver = await db.retryInitialization()
    expect(recoveredDriver).toBeDefined()
    expect(db.getStatus()).toBe('READY')
    expect(db.getError()).toBeNull()
  })

  it('performs soft-delete and invokes physical photo cleanup', async () => {
    const driver = new SqlJsDriver(true)
    await driver.init()
    await MigrationRunner.run(driver)

    const vehicleRepo = new VehicleRepository(driver)
    const fuelRepo = new FuelRepository(driver)

    const vehicle = await vehicleRepo.create({
      id: 'veh-safety-1',
      vehicleNumber: 'TN 01 AB 9999',
      makeModel: 'Safety Test Car',
      fuelType: 'Petrol',
      currentOdometer: 10000,
    })

    const entry = await fuelRepo.createWithTransaction(
      {
        vehicleId: vehicle.id,
        capturedAt: '2026-09-01T10:00:00Z',
        fuelStationName: 'Shell Safety Station',
        locationAddress: 'Chennai, TN',
        latitude: 13.0827,
        longitude: 80.2707,
        fuelType: 'Petrol',
        quantity: 25,
        amount: 2500,
        rate: 100,
        odometer: 10450,
      },
      [
        {
          photoType: 'METER',
          localPath: 'fuel_photos/meter_test.jpg',
          fileName: 'meter_test.jpg',
          capturedAt: '2026-09-01T10:00:00Z',
        },
      ]
    )

    expect(entry.id).toBeDefined()
    const fetchedBefore = await fuelRepo.getById(entry.id)
    expect(fetchedBefore).not.toBeNull()

    // Execute deletion
    const deleteSuccess = await fuelRepo.delete(entry.id)
    expect(deleteSuccess).toBe(true)

    // Should call photoStorageService.deletePhoto to clean up disk storage
    expect(photoStorageService.deletePhoto).toHaveBeenCalledWith('fuel_photos/meter_test.jpg')

    // Soft-deleted entry should not be returned by getById or getAll
    const fetchedAfter = await fuelRepo.getById(entry.id)
    expect(fetchedAfter).toBeNull()

    const allEntries = await fuelRepo.getAll()
    expect(allEntries.find((e) => e.id === entry.id)).toBeUndefined()

    await driver.close()
  })

  it('performs permanent hard delete and cascades cleanup', async () => {
    const driver = new SqlJsDriver(true)
    await driver.init()
    await MigrationRunner.run(driver)

    const vehicleRepo = new VehicleRepository(driver)
    const fuelRepo = new FuelRepository(driver)

    const vehicle = await vehicleRepo.create({
      id: 'veh-safety-2',
      vehicleNumber: 'TN 02 CD 1234',
      makeModel: 'Hard Delete Car',
      fuelType: 'Diesel',
      currentOdometer: 20000,
    })

    const entry = await fuelRepo.createWithTransaction(
      {
        vehicleId: vehicle.id,
        capturedAt: '2026-09-02T12:00:00Z',
        fuelStationName: 'HP Hard Delete',
        locationAddress: 'Coimbatore, TN',
        latitude: 11.0168,
        longitude: 76.9558,
        fuelType: 'Diesel',
        quantity: 30,
        amount: 2700,
        rate: 90,
        odometer: 20500,
      },
      [
        {
          photoType: 'VEHICLE',
          localPath: 'fuel_photos/vehicle_test.jpg',
          fileName: 'vehicle_test.jpg',
          capturedAt: '2026-09-02T12:00:00Z',
        },
      ]
    )

    const hardDeleteSuccess = await fuelRepo.hardDelete(entry.id)
    expect(hardDeleteSuccess).toBe(true)

    expect(photoStorageService.deletePhoto).toHaveBeenCalledWith('fuel_photos/vehicle_test.jpg')

    // Verify row is physically gone from sqlite table
    const rows = await driver.query('SELECT * FROM fuel_entries WHERE id = ?;', [entry.id])
    expect(rows).toHaveLength(0)

    await driver.close()
  })
})
