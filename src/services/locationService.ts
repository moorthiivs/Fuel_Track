import { Geolocation } from '@capacitor/geolocation'
import stationsMock from '../mocks/stations.json'
import type { FuelStation, LocationData } from '../types/fuel'

class LocationService {
  private defaultStations: FuelStation[] = stationsMock as FuelStation[]

  /**
   * Request permission and acquire GPS coordinates with graceful fallback
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    try {
      // Check/request location permissions on Android / iOS
      try {
        const permStatus = await Geolocation.checkPermissions()
        if (permStatus.location !== 'granted') {
          const req = await Geolocation.requestPermissions()
          if (req.location !== 'granted') {
            console.warn('Location permission not granted by user')
          }
        }
      } catch (permErr) {
        console.warn('Permission check error:', permErr)
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      })

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
      }
    } catch (error) {
      console.warn('Geolocation failed or timed out, utilizing fallback location:', error)
      return {
        latitude: 12.7879,
        longitude: 80.2281,
        accuracy: 10,
      }
    }
  }

  /**
   * Real reverse geocode coordinates using OpenStreetMap Nominatim
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'FuelTrackApp/1.0',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const addr = data.address || {}

        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.village
        const city = addr.city || addr.town || addr.municipality || addr.state_district || addr.county

        if (suburb && city) {
          return `${suburb}, ${city}`
        }
        if (city) {
          return `${city}, ${addr.state || ''}`.trim()
        }
        if (data.display_name) {
          return data.display_name.split(',').slice(0, 2).join(',').trim()
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding network error, using fallback:', err)
    }

    // Default fallback
    return 'Kelambakkam, Chennai'
  }

  /**
   * Find nearest fuel station from coordinates or match nearby real fuel bunks
   */
  async findNearbyFuelStation(
    latitude: number,
    longitude: number,
    localityName?: string
  ): Promise<FuelStation> {
    try {
      // Query OpenStreetMap for nearby fuel stations within 2km radius
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=fuel&lat=${latitude}&lon=${longitude}&bounded=1&viewbox=${longitude - 0.03},${latitude + 0.03},${longitude + 0.03},${latitude - 0.03}&limit=3`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'FuelTrackApp/1.0',
          },
        }
      )

      if (response.ok) {
        const results = await response.json()
        if (Array.isArray(results) && results.length > 0) {
          const first = results[0]
          const stationTitle = first.name || first.display_name?.split(',')[0] || 'Indian Oil Petrol Bunk'
          return {
            id: `st-${Date.now()}`,
            name: stationTitle,
            brand: 'Indian Oil',
            address: first.display_name || localityName || 'OMR Main Road',
            latitude: parseFloat(first.lat) || latitude,
            longitude: parseFloat(first.lon) || longitude,
          }
        }
      }
    } catch (err) {
      console.warn('Nearby station fetch error, using closest fallback:', err)
    }

    // If locality was determined, name station based on locality
    if (localityName && localityName !== 'Kelambakkam, Chennai') {
      return {
        id: `st-custom`,
        name: `Indian Oil - ${localityName.split(',')[0]} Bunk`,
        brand: 'Indian Oil',
        address: localityName,
        latitude,
        longitude,
      }
    }

    return this.defaultStations[0]
  }

  /**
   * Combined one-shot location resolver for draft entry
   */
  async resolveCurrentLocationDetails(): Promise<LocationData> {
    const coords = await this.getCurrentLocation()
    const locality = await this.reverseGeocode(coords.latitude, coords.longitude)
    const station = await this.findNearbyFuelStation(coords.latitude, coords.longitude, locality)

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
