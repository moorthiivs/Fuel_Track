import type { FuelStation, LocationData } from '../../types/fuel'

export interface ILocationService {
  getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }>
  reverseGeocode(latitude: number, longitude: number): Promise<string>
  findNearbyFuelStation(
    latitude: number,
    longitude: number,
    localityName?: string
  ): Promise<FuelStation>
  resolveCurrentLocationDetails(): Promise<LocationData>
}
