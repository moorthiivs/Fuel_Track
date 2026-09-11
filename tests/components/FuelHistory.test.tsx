import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { FuelHistory } from '../../src/pages/FuelHistory'
import { useFuelStore } from '../../src/store/fuelStore'
import type { FuelEntry } from '../../src/types/fuel'

const mockEntries: FuelEntry[] = [
  {
    id: 'fuel-test-1',
    vehicleNumber: 'TN 09 BX 4821',
    date: '2026-09-01',
    time: '10:30 AM',
    stationName: 'HP Fuel Station',
    location: 'Anna Nagar, Chennai',
    latitude: 13.08,
    longitude: 80.21,
    fuelType: 'Petrol',
    quantity: 35.5,
    amount: 3621,
    rate: 102.0,
    odometer: 48625,
    previousOdometer: 48175,
    distance: 450,
    mileage: 12.68,
    meterPhotoUri: '/photos/meter1.jpg',
    vehiclePhotoUri: '/photos/veh1.jpg',
    ocrConfidence: { quantity: 99, amount: 98, odometer: 100 },
    createdAt: '2026-09-01T10:30:00Z',
  },
  {
    id: 'fuel-test-2',
    vehicleNumber: 'TN 09 BX 4821',
    date: '2026-08-25',
    time: '04:15 PM',
    stationName: 'Bharat Petroleum Hub',
    location: 'Guindy, Chennai',
    latitude: 13.01,
    longitude: 80.20,
    fuelType: 'Diesel',
    quantity: 40.0,
    amount: 3760,
    rate: 94.0,
    odometer: 48175,
    previousOdometer: 47625,
    distance: 550,
    mileage: 13.75,
    meterPhotoUri: '/photos/meter2.jpg',
    vehiclePhotoUri: '/photos/veh2.jpg',
    ocrConfidence: { quantity: 98, amount: 97, odometer: 99 },
    createdAt: '2026-08-25T16:15:00Z',
  },
]

describe('FuelHistory Component', () => {
  beforeEach(() => {
    useFuelStore.setState({
      fuelEntries: mockEntries,
    })
  })

  it('renders fuel entry history list correctly', () => {
    render(
      <MemoryRouter>
        <FuelHistory />
      </MemoryRouter>
    )

    expect(screen.getByText('Fuel History')).toBeInTheDocument()
    expect(screen.getByText('2 verified logs recorded')).toBeInTheDocument()
    expect(screen.getByText('HP Fuel Station')).toBeInTheDocument()
    expect(screen.getByText('Bharat Petroleum Hub')).toBeInTheDocument()
  })

  it('filters fuel entries when typing in the search input', () => {
    render(
      <MemoryRouter>
        <FuelHistory />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Search station, bunk, or vehicle/i)
    fireEvent.change(searchInput, { target: { value: 'Bharat' } })

    expect(screen.getByText('Bharat Petroleum Hub')).toBeInTheDocument()
    expect(screen.queryByText('HP Fuel Station')).not.toBeInTheDocument()
  })

  it('filters entries when selecting fuel type pills (Petrol vs Diesel)', () => {
    render(
      <MemoryRouter>
        <FuelHistory />
      </MemoryRouter>
    )

    const dieselPill = screen.getByRole('button', { name: /^Diesel$/i })
    fireEvent.click(dieselPill)

    expect(screen.getByText('Bharat Petroleum Hub')).toBeInTheDocument()
    expect(screen.queryByText('HP Fuel Station')).not.toBeInTheDocument()

    const petrolPill = screen.getByRole('button', { name: /^Petrol$/i })
    fireEvent.click(petrolPill)

    expect(screen.getByText('HP Fuel Station')).toBeInTheDocument()
    expect(screen.queryByText('Bharat Petroleum Hub')).not.toBeInTheDocument()
  })

  it('displays empty state message when no entries match the criteria', () => {
    render(
      <MemoryRouter>
        <FuelHistory />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Search station, bunk, or vehicle/i)
    fireEvent.change(searchInput, { target: { value: 'NonExistentBunkXYZ' } })

    expect(screen.getByText('No matching fuel records found')).toBeInTheDocument()
    expect(screen.queryByText('HP Fuel Station')).not.toBeInTheDocument()
  })
})
