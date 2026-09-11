import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dbManager } from '../../src/database/database'
import { SqlJsDriver } from '../../src/database/driver'
import { vehicleRepository } from '../../src/database/repositories/vehicleRepository'
import { useFuelStore } from '../../src/store/fuelStore'

describe('FuelStore (Zustand + SQLite Integration)', () => {
  beforeEach(async () => {
    // Reset database to an isolated in-memory SqlJsDriver instance
    const testDriver = new SqlJsDriver(true)
    await testDriver.init()
    await dbManager.resetForTesting(testDriver)

    // Seed test vehicle
    await vehicleRepository.create({
      id: 'veh-store-01',
      vehicleNumber: 'TN-01-STORE',
      makeModel: 'Tata Nexon',
      fuelType: 'Petrol',
      tankCapacity: 44,
      currentOdometer: 10000,
    })

    // Reset store state
    useFuelStore.setState({
      vehicles: [],
      fuelEntries: [],
      activeVehicleId: 'veh-store-01',
      draftEntry: {
        meterPhotoUri: null,
        meterOCR: null,
        vehiclePhotoUri: null,
        vehicleOCR: null,
        location: null,
        manualEdits: {},
      },
      isProcessing: false,
      processingStepText: '',
      demoMode: false,
      isDatabaseReady: false,
      isLoading: false,
      errorMessage: null,
    })
  })

  afterEach(async () => {
    await dbManager.close()
  })

  it('loads initial data from SQLite into reactive store state', async () => {
    const store = useFuelStore.getState()
    await store.loadInitialData()

    const updatedState = useFuelStore.getState()
    expect(updatedState.isDatabaseReady).toBe(true)
    expect(updatedState.vehicles.length).toBeGreaterThanOrEqual(1)
    expect(updatedState.vehicles.find((v) => v.id === 'veh-store-01')).toBeDefined()
    expect(updatedState.fuelEntries.length).toBeGreaterThanOrEqual(1)
  })

  it('updates draft state correctly with meter and vehicle OCR data', () => {
    const store = useFuelStore.getState()

    store.setDraftMeter('test-meter.jpg', {
      isValid: true,
      quantity: 25.5,
      amount: 2550,
      rate: 100,
      confidence: { quantity: 95, amount: 94, rate: 95 },
    })

    store.setDraftVehicle('test-vehicle.jpg', {
      isValid: true,
      odometer: 10450,
      confidence: 96,
    })

    store.updateManualEdit('stationName', 'Express Shell Station')

    const draft = useFuelStore.getState().draftEntry
    expect(draft.meterPhotoUri).toBe('test-meter.jpg')
    expect(draft.meterOCR?.quantity).toBe(25.5)
    expect(draft.meterOCR?.amount).toBe(2550)
    expect(draft.vehiclePhotoUri).toBe('test-vehicle.jpg')
    expect(draft.vehicleOCR?.odometer).toBe(10450)
    expect(draft.manualEdits.stationName).toBe('Express Shell Station')
  })

  it('rejects confirmAndSaveDraft when validation fails (e.g., zero volume)', async () => {
    const store = useFuelStore.getState()
    await store.loadInitialData()
    const countBefore = useFuelStore.getState().fuelEntries.length

    // Missing quantity (0)
    store.setDraftMeter('meter.jpg', {
      isValid: false,
      quantity: 0,
      amount: 0,
      rate: 0,
      confidence: { quantity: 0, amount: 0, rate: 0 },
    })
    store.setDraftVehicle('vehicle.jpg', {
      isValid: true,
      odometer: 10450,
      confidence: 90,
    })

    const result = await useFuelStore.getState().confirmAndSaveDraft()
    expect(result).toBeNull()

    // Fuel entries list should remain unchanged
    expect(useFuelStore.getState().fuelEntries).toHaveLength(countBefore)
  })

  it('saves valid draft atomically into SQLite and updates vehicle odometer', async () => {
    const store = useFuelStore.getState()
    await store.loadInitialData()
    const countBefore = useFuelStore.getState().fuelEntries.length

    store.setDraftMeter('data:image/jpeg;base64,meter', {
      isValid: true,
      quantity: 30,
      amount: 3000,
      rate: 100,
      confidence: { quantity: 98, amount: 98, rate: 98 },
    })
    store.setDraftVehicle('data:image/jpeg;base64,vehicle', {
      isValid: true,
      odometer: 10500,
      confidence: 95,
    })
    store.updateManualEdit('stationName', 'Downtown Shell')

    const saved = await useFuelStore.getState().confirmAndSaveDraft()
    expect(saved).not.toBeNull()
    expect(saved?.quantity).toBe(30)
    expect(saved?.amount).toBe(3000)
    expect(saved?.odometer).toBe(10500)
    expect(saved?.rate).toBe(100)
    expect(saved?.distance).toBe(500) // 10500 - 10000

    const stateAfterSave = useFuelStore.getState()
    expect(stateAfterSave.fuelEntries).toHaveLength(countBefore + 1)
    expect(stateAfterSave.fuelEntries[0].id).toBe(saved?.id)

    // Draft should be reset
    expect(stateAfterSave.draftEntry.meterPhotoUri).toBeNull()

    // Vehicle odometer in state should be updated
    const vehicle = stateAfterSave.vehicles.find((v) => v.id === 'veh-store-01')
    expect(vehicle?.currentOdometer).toBe(10500)
  })

  it('deletes fuel entry from SQLite and removes it from reactive store state', async () => {
    const store = useFuelStore.getState()
    await store.loadInitialData()
    const countBefore = useFuelStore.getState().fuelEntries.length

    store.setDraftMeter('data:image/jpeg;base64,meter', {
      isValid: true,
      quantity: 20,
      amount: 2000,
      rate: 100,
      confidence: { quantity: 95, amount: 95, rate: 95 },
    })
    store.setDraftVehicle('data:image/jpeg;base64,vehicle', {
      isValid: true,
      odometer: 10300,
      confidence: 95,
    })

    const saved = await useFuelStore.getState().confirmAndSaveDraft()
    expect(saved).not.toBeNull()
    expect(useFuelStore.getState().fuelEntries).toHaveLength(countBefore + 1)

    const deleted = await useFuelStore.getState().deleteFuelEntry(saved!.id)
    expect(deleted).toBe(true)
    expect(useFuelStore.getState().fuelEntries).toHaveLength(countBefore)
  })
})
