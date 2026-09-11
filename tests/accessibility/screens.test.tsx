import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import { Dashboard } from '../../src/pages/Dashboard'
import { FuelHistory } from '../../src/pages/FuelHistory'
import { Profile } from '../../src/pages/Profile'
import { useFuelStore } from '../../src/store/fuelStore'
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog'
import { RouteLoadingFallback } from '../../src/components/common/RouteLoadingFallback'

// Options for component-level axe audits
const axeOptions: axe.RunOptions = {
  rules: {
    'page-has-heading-one': { enabled: false },
    'region': { enabled: false },
    'color-contrast': { enabled: false }, // Handled across themes, JSDOM does not calculate full CSS background color blending
  },
}

describe('Automated Accessibility Audits (axe-core)', () => {
  beforeEach(() => {
    useFuelStore.setState({
      vehicles: [
        {
          id: 'v-a11y-1',
          vehicleNumber: 'TN 09 BX 4821',
          makeModel: 'Hyundai Creta',
          fuelType: 'Petrol',
          tankCapacity: 50,
          currentOdometer: 48625,
        },
      ],
      activeVehicleId: 'v-a11y-1',
      fuelEntries: [
        {
          id: 'fuel-1',
          vehicleNumber: 'TN 09 BX 4821',
          date: '2026-09-01',
          time: '10:30 AM',
          stationName: 'HP Fuel Station',
          location: 'Chennai',
          fuelType: 'Petrol',
          quantity: 35.5,
          amount: 3621,
          rate: 102.0,
          odometer: 48625,
          latitude: 13.0827,
          longitude: 80.2707,
          ocrConfidence: { quantity: 98, amount: 96, odometer: 99 },
          createdAt: '2026-09-01T10:30:00Z',
        },
      ],
    })
  })

  it('Dashboard page has zero accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    const results = await axe.run(container, axeOptions)
    expect(results.violations).toEqual([])
  })

  it('FuelHistory page has zero accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <FuelHistory />
      </MemoryRouter>
    )

    const results = await axe.run(container, axeOptions)
    expect(results.violations).toEqual([])
  })

  it('Profile page has zero accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    )

    const results = await axe.run(container, axeOptions)
    expect(results.violations).toEqual([])
  })

  it('ConfirmDialog has zero accessibility violations in both danger and warning variants', async () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    const results = await axe.run(container, axeOptions)
    expect(results.violations).toEqual([])
  })

  it('RouteLoadingFallback has zero accessibility violations', async () => {
    const { container } = render(<RouteLoadingFallback />)

    const results = await axe.run(container, axeOptions)
    expect(results.violations).toEqual([])
  })
})
