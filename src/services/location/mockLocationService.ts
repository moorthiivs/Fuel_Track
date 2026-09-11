import type { FuelStation, LocationData } from '../../types/fuel'
import type { ILocationService } from './locationInterface'

export class MockLocationService implements ILocationService {
  private mockStation: FuelStation = {
    id: 'mock-station-1',
    name: 'Indian Oil - Bunk #04',
    brand: 'Indian Oil',
    address: 'OMR Expressway, Chennai',
    latitude: 12.8251,
    longitude: 80.2185,
  }

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    return {
      latitude: this.mockStation.latitude,
      longitude: this.mockStation.longitude,
      accuracy: 10,
    }
  }

  async reverseGeocode(_latitude: number, _longitude: number): Promise<string> {
    return 'OMR Expressway, Chennai'
  }

  async findNearbyFuelStation(
    _latitude: number,
    _longitude: number,
    _localityName?: string
  ): Promise<FuelStation> {
    return this.mockStation
  }

  async resolveCurrentLocationDetails(): Promise<LocationData> {
    return {
      latitude: this.mockStation.latitude,
      longitude: this.mockStation.longitude,
      stationName: this.mockStation.name,
      location: 'OMR Expressway, Chennai',
      accuracy: 10,
    }
  }
}

export const mockLocationService = new MockLocationService()
