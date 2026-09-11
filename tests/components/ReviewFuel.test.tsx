import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { ReviewFuel } from '../../src/pages/ReviewFuel'
import { useFuelStore } from '../../src/store/fuelStore'
import { dbManager } from '../../src/database/database'
import { SqlJsDriver } from '../../src/database/driver'
import { vehicleRepository } from '../../src/database/repositories/vehicleRepository'

describe('ReviewFuel Component', () => {
  beforeEach(async () => {
    const testDriver = new SqlJsDriver(true)
    await testDriver.init()
    await dbManager.resetForTesting(testDriver)

    await vehicleRepository.create({
      id: 'veh-rf-01',
      vehicleNumber: 'TN-01-RF',
      makeModel: 'Hyundai Creta',
      fuelType: 'Petrol',
      tankCapacity: 50,
      currentOdometer: 20000,
    })

    useFuelStore.setState({
      vehicles: [
        {
          id: 'veh-rf-01',
          vehicleNumber: 'TN-01-RF',
          makeModel: 'Hyundai Creta',
          fuelType: 'Petrol',
          tankCapacity: 50,
          currentOdometer: 20000,
        },
      ],
      activeVehicleId: 'veh-rf-01',
      fuelEntries: [],
      draftEntry: {
        meterPhotoUri: 'data:image/jpeg;base64,meter',
        meterOCR: {
          isValid: true,
          quantity: 25,
          amount: 2500,
          rate: 100,
          confidence: { quantity: 95, amount: 95, rate: 95 },
        },
        vehiclePhotoUri: 'data:image/jpeg;base64,vehicle',
        vehicleOCR: {
          isValid: true,
          odometer: 20400,
          confidence: 96,
        },
        location: {
          stationName: 'Shell Express Chennai',
          location: 'OMR Road',
          latitude: 12.9,
          longitude: 80.2,
        },
        manualEdits: {},
      },
      isDatabaseReady: true,
      isLoading: false,
    })
  })

  afterEach(async () => {
    await dbManager.close()
  })

  it('renders fuel entry draft summary and vehicle details', () => {
    render(
      <MemoryRouter>
        <ReviewFuel />
      </MemoryRouter>
    )

    expect(screen.getByText('Review Fuel Entry')).toBeInTheDocument()
    expect(screen.getByText('Fuel Quantity & Cost')).toBeInTheDocument()
    expect(screen.getByText(/25\.00 L/)).toBeInTheDocument()
    expect(screen.getByText(/2,500/)).toBeInTheDocument()
    expect(screen.getByText(/TN-01-RF/)).toBeInTheDocument()
    expect(screen.getByText(/Shell Express Chennai/)).toBeInTheDocument()
    expect(screen.getByText('Confirm & Save')).toBeInTheDocument()
    expect(screen.getByText('Retake')).toBeInTheDocument()
  })

  it('displays a validation error alert when volume or amount is 0', async () => {
    useFuelStore.setState({
      draftEntry: {
        meterPhotoUri: null,
        meterOCR: {
          isValid: false,
          quantity: 0,
          amount: 0,
          rate: 0,
          confidence: { quantity: 0, amount: 0, rate: 0 },
        },
        vehiclePhotoUri: null,
        vehicleOCR: null,
        location: null,
        manualEdits: {},
      },
    })

    render(
      <MemoryRouter>
        <ReviewFuel />
      </MemoryRouter>
    )

    const saveButton = screen.getByText('Confirm & Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(
        screen.getByText(/Fuel volume and total amount must be greater than 0/)
      ).toBeInTheDocument()
    })
  })

  it('displays odometer mismatch error and allows saving as new baseline', async () => {
    // Current odometer (5725) is lower than vehicle odometer (20000)
    useFuelStore.setState({
      draftEntry: {
        meterPhotoUri: 'data:image/jpeg;base64,meter',
        meterOCR: {
          isValid: true,
          quantity: 32.45,
          amount: 3245,
          rate: 100,
          confidence: { quantity: 98, amount: 96, rate: 100 },
        },
        vehiclePhotoUri: 'data:image/jpeg;base64,vehicle',
        vehicleOCR: {
          isValid: true,
          odometer: 5725,
          confidence: 100,
        },
        location: {
          stationName: 'Indian Oil - Erode Bunk',
          location: 'Erode, Tamil Nadu',
          latitude: 12.78,
          longitude: 80.22,
        },
        manualEdits: {},
      },
    })

    render(
      <MemoryRouter>
        <ReviewFuel />
      </MemoryRouter>
    )

    const saveButton = screen.getByText('Confirm & Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(
        screen.getByText(/Current odometer \(5725 km\) cannot be less than previous recorded reading \(20000 km\)/)
      ).toBeInTheDocument()
    })

    const baselineButton = screen.getByText('Save as New Baseline')
    expect(baselineButton).toBeInTheDocument()

    fireEvent.click(baselineButton)

    await waitFor(() => {
      expect(screen.getByText('Fuel Entry Saved!')).toBeInTheDocument()
    })
  })

  it('successfully saves valid draft and displays celebration modal', async () => {
    render(
      <MemoryRouter>
        <ReviewFuel />
      </MemoryRouter>
    )

    const saveButton = screen.getByText('Confirm & Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Fuel Entry Saved!')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Your fuel record and proof photos have been logged.')
    ).toBeInTheDocument()
  })
})
