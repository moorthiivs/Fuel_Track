import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { dbManager } from '../../src/database/database'
import { SqlJsDriver } from '../../src/database/driver'
import { vehicleRepository } from '../../src/database/repositories/vehicleRepository'
import { fuelRepository } from '../../src/database/repositories/fuelRepository'
import { useFuelStore } from '../../src/store/fuelStore'
import { ReviewFuel } from '../../src/pages/ReviewFuel'
import { FuelHistory } from '../../src/pages/FuelHistory'
import { Analytics } from '../../src/pages/Analytics'

describe('End-to-End Fuel Entry Workflow', () => {
  let testDriver: SqlJsDriver

  beforeEach(async () => {
    testDriver = new SqlJsDriver(true)
    await testDriver.init()
    await dbManager.resetForTesting(testDriver)

    // Clear any seeded entries so test starts with a clean baseline
    await testDriver.execute('DELETE FROM fuel_entries;')
    await testDriver.execute('DELETE FROM fuel_photos;')
    await testDriver.execute('DELETE FROM ocr_results;')
    await testDriver.execute('DELETE FROM vehicles;')

    // Seed primary test vehicle
    await vehicleRepository.create({
      id: 'veh-e2e-01',
      vehicleNumber: 'TN 09 E2E 9999',
      makeModel: 'Tata Nexon EV / Petrol',
      fuelType: 'Petrol',
      tankCapacity: 50,
      currentOdometer: 15000,
    })

    // Reset store state
    useFuelStore.setState({
      vehicles: [
        {
          id: 'veh-e2e-01',
          vehicleNumber: 'TN 09 E2E 9999',
          makeModel: 'Tata Nexon EV / Petrol',
          fuelType: 'Petrol',
          tankCapacity: 50,
          currentOdometer: 15000,
        },
      ],
      activeVehicleId: 'veh-e2e-01',
      fuelEntries: [],
      draftEntry: {
        meterPhotoUri: null,
        meterOCR: null,
        vehiclePhotoUri: null,
        vehicleOCR: null,
        location: null,
        manualEdits: {},
      },
      isDatabaseReady: true,
      isLoading: false,
    })
  })

  afterEach(async () => {
    await dbManager.close()
  })

  it('completes the full fuel logging lifecycle: captures photos -> reviews -> atomically saves to SQLite -> updates history & analytics', async () => {
    const store = useFuelStore.getState()

    // 1. Simulate Step 1: Capture Meter Photo & OCR extraction
    store.setDraftMeter('data:image/jpeg;base64,mockMeterPhoto', {
      isValid: true,
      quantity: 35.0,
      amount: 3500,
      rate: 100,
      confidence: { quantity: 96, amount: 95, rate: 95 },
    })

    // 2. Simulate Step 2: Capture Vehicle Odometer Photo & OCR extraction
    store.setDraftVehicle('data:image/jpeg;base64,mockVehiclePhoto', {
      isValid: true,
      odometer: 15450,
      confidence: 97,
    })

    // 3. Simulate Location tagging
    store.setDraftLocation({
      stationName: 'BPCL Airport Road',
      location: 'Meenambakkam, Chennai',
      latitude: 12.98,
      longitude: 80.17,
    })

    // 4. Render the Review Fuel Screen
    const { unmount: unmountReview } = render(
      <MemoryRouter>
        <ReviewFuel />
      </MemoryRouter>
    )

    // Verify draft data rendered accurately on Review Screen
    expect(screen.getByText(/35\.00 L/)).toBeInTheDocument()
    expect(screen.getByText(/3,500/)).toBeInTheDocument()
    expect(screen.getByText(/TN 09 E2E 9999/)).toBeInTheDocument()
    expect(screen.getByText(/BPCL Airport Road/)).toBeInTheDocument()

    // 5. User clicks "Confirm & Save"
    const confirmButton = screen.getByText('Confirm & Save')
    fireEvent.click(confirmButton)

    // Wait for success modal indicating transaction committed
    await waitFor(() => {
      expect(screen.getByText('Fuel Entry Saved!')).toBeInTheDocument()
    })

    unmountReview()

    // 6. Direct Database Assertions: Verify SQLite records created atomically
    const savedEntries = await fuelRepository.getAll()
    expect(savedEntries).toHaveLength(1)
    const entry = savedEntries[0]
    expect(entry.vehicleNumber).toBe('TN 09 E2E 9999')
    expect(entry.quantity).toBe(35)
    expect(entry.amount).toBe(3500)
    expect(entry.rate).toBe(100)
    expect(entry.odometer).toBe(15450)
    expect(entry.previousOdometer).toBe(15000)
    expect(entry.distance).toBe(450)
    expect(entry.mileage).toBeCloseTo(12.86, 1)

    // Check linked fuel_photos table
    const photoRows = await testDriver.query<any>(
      `SELECT * FROM fuel_photos WHERE fuelEntryId = ?;`,
      [entry.id]
    )
    expect(photoRows).toHaveLength(2)
    const photoTypes = photoRows.map((p) => p.photoType)
    expect(photoTypes).toContain('METER')
    expect(photoTypes).toContain('VEHICLE')

    // Check linked ocr_results table
    const ocrRows = await testDriver.query<any>(
      `SELECT * FROM ocr_results WHERE fuelEntryId = ?;`,
      [entry.id]
    )
    expect(ocrRows.length).toBeGreaterThanOrEqual(3)

    // Check vehicle currentOdometer updated in vehicles table
    const vehicleInDb = await vehicleRepository.getById('veh-e2e-01')
    expect(vehicleInDb?.currentOdometer).toBe(15450)

    // 7. Verify Fuel History reflects the new entry
    const { unmount: unmountHistory } = render(
      <MemoryRouter>
        <FuelHistory />
      </MemoryRouter>
    )
    expect(screen.getByText('BPCL Airport Road')).toBeInTheDocument()
    expect(screen.getByText(/1 verified logs recorded/)).toBeInTheDocument()
    unmountHistory()

    // 8. Verify Analytics computes stats for the new entry
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )
    expect(screen.getByText('Fuel Analytics')).toBeInTheDocument()
    expect(screen.getByText('Avg Mileage')).toBeInTheDocument()
    expect(screen.getAllByText(/3,500/).length).toBeGreaterThanOrEqual(1)
  })

  it('rejects invalid entry (e.g. zero fuel volume) and prevents database commit', async () => {
    const store = useFuelStore.getState()

    store.setDraftMeter('data:image/jpeg;base64,meter', {
      isValid: false,
      quantity: 0,
      amount: 0,
      rate: 0,
      confidence: { quantity: 0, amount: 0, rate: 0 },
    })
    store.setDraftVehicle('data:image/jpeg;base64,vehicle', {
      isValid: true,
      odometer: 15450,
      confidence: 90,
    })

    render(
      <MemoryRouter>
        <ReviewFuel />
      </MemoryRouter>
    )

    const confirmButton = screen.getByText('Confirm & Save')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(
        screen.getByText(/Fuel volume and total amount must be greater than 0/)
      ).toBeInTheDocument()
    })

    // Verify 0 records committed to SQLite
    const savedEntries = await fuelRepository.getAll()
    expect(savedEntries).toHaveLength(0)

    const photoRows = await testDriver.query<any>('SELECT * FROM fuel_photos;')
    expect(photoRows).toHaveLength(0)
  })
})
