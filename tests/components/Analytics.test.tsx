import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { Analytics } from '../../src/pages/Analytics'
import { useFuelStore } from '../../src/store/fuelStore'
import type { FuelEntry } from '../../src/types/fuel'

const mockAnalyticsEntries: FuelEntry[] = [
  {
    id: 'entry-a1',
    vehicleNumber: 'TN-01-ANALYTICS',
    date: '2026-09-05',
    time: '09:00 AM',
    stationName: 'Shell OMR',
    location: 'Chennai',
    latitude: 12.9,
    longitude: 80.2,
    fuelType: 'Petrol',
    quantity: 30,
    amount: 3000,
    rate: 100,
    odometer: 10500,
    previousOdometer: 10000,
    distance: 500,
    mileage: 16.67,
    ocrConfidence: { quantity: 98, amount: 98, odometer: 98 },
    createdAt: '2026-09-05T09:00:00Z',
  },
  {
    id: 'entry-a2',
    vehicleNumber: 'TN-01-ANALYTICS',
    date: '2026-08-01',
    time: '11:00 AM',
    stationName: 'HPCL City Center',
    location: 'Chennai',
    latitude: 13.0,
    longitude: 80.2,
    fuelType: 'Petrol',
    quantity: 40,
    amount: 4000,
    rate: 100,
    odometer: 10000,
    previousOdometer: 9400,
    distance: 600,
    mileage: 15.0,
    ocrConfidence: { quantity: 95, amount: 95, odometer: 95 },
    createdAt: '2026-08-01T11:00:00Z',
  },
]

describe('Analytics Component', () => {
  beforeEach(() => {
    useFuelStore.setState({
      fuelEntries: mockAnalyticsEntries,
    })
  })

  it('renders fuel analytics header and key performance metric cards', () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    expect(screen.getByText('Fuel Analytics')).toBeInTheDocument()
    expect(screen.getByText('Efficiency & Cost Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Avg Mileage')).toBeInTheDocument()
    expect(screen.getByText('Monthly Cost')).toBeInTheDocument()
    expect(screen.getByText('Fuel Volume')).toBeInTheDocument()
    expect(screen.getByText('Distance')).toBeInTheDocument()
  })

  it('filters data when switching time ranges (7 Days vs 30 Days vs 3 Months)', () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    // Initially 3 Months includes both entries: total cost 3000 + 4000 = 7,000
    expect(screen.getAllByText(/7,000/).length).toBeGreaterThanOrEqual(1)

    // Switch to 7 Days (reference date 2026-09-05, cutoff 2026-08-29 -> only entry-a1)
    const sevenDaysBtn = screen.getByRole('button', { name: /7 Days/i })
    fireEvent.click(sevenDaysBtn)

    // Now filtered stats should only reflect entry-a1: cost 3,000
    expect(screen.getAllByText(/3,000/).length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty entries gracefully without crashing', () => {
    useFuelStore.setState({
      fuelEntries: [],
    })

    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    expect(screen.getByText('Fuel Analytics')).toBeInTheDocument()
    expect(screen.getByText('-- km/L')).toBeInTheDocument()
  })
})
