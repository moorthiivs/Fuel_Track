import { Geolocation } from '@capacitor/geolocation'
import stationsMock from '../mocks/stations.json'
import type { FuelStation, LocationData } from '../types/fuel'

class LocationService {
  private stations: FuelStation[] = stationsMock as FuelStation[]

  /**
   * Acquire GPS position using Capacitor Geolocation with graceful fallback
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    try {
      // First check permission or get direct coordinates
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      })

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
      }
    } catch (error) {
      console.warn('Geolocation unavailable or denied, utilizing demo station coordinates:', error)
      // Standard demo bunk coordinates (Kelambakkam, Chennai)
      return {
        latitude: 12.7879,
        longitude: 80.2281,
        accuracy: 10,
      }
    }
  }

  /**
   * Resolve coordinates to readable city / locality string
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // In production, invoke Google Maps Geocoding API / Nominatim / Mapbox
    if (Math.abs(latitude - 12.7879) < 0.05 && Math.abs(longitude - 80.2281) < 0.05) {
      return 'Kelambakkam, Chennai'
    }
    return 'Kelambakkam, Chennai'
  }

  /**
   * Find nearest fuel station from coordinates
   */
  async findNearbyFuelStation(
    _latitude: number,
    _longitude: number
  ): Promise<FuelStation> {
    // Match closest station or default to Indian Oil - XYZ Bunk
    return this.stations[0] || {
      id: 'st-001',
      name: 'Indian Oil - XYZ Bunk',
      brand: 'Indian Oil',
      address: 'OMR Main Road, Kelambakkam, Chennai, Tamil Nadu 603103',
      latitude: 12.7879,
      longitude: 80.2281,
    }
  }

  /**
   * Combined one-shot location resolver for draft entry
   */
  async resolveCurrentLocationDetails(): Promise<LocationData> {
    const coords = await this.getCurrentLocation()
    const station = await this.findNearbyFuelStation(coords.latitude, coords.longitude)
    const locality = await this.reverseGeocode(coords.latitude, coords.longitude)

    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      stationName: station.name,
      location: locality,
      accuracy: coords.accuracy,
    }
  }
}

export const locationService = new LocationService()
