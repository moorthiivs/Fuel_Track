export type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'Electric'

export interface Vehicle {
  id: string
  vehicleNumber: string
  makeModel: string
  fuelType: FuelType
  currentOdometer: number
  tankCapacity?: number
  estimatedMileage?: number
}

export interface FuelStation {
  id: string
  name: string
  brand: 'Indian Oil' | 'Bharat Petroleum' | 'Hindustan Petroleum' | 'Shell' | 'Nayara' | 'Other'
  address: string
  latitude: number
  longitude: number
}

export interface OCRConfidence {
  quantity: number // e.g. 98
  amount: number   // e.g. 96
  rate?: number    // e.g. 99
  odometer: number // e.g. 99
}

export interface MeterOCRResult {
  quantity: number
  amount: number
  rate: number
  confidence: {
    quantity: number
    amount: number
    rate: number
  }
  rawDetected?: {
    volumeText?: string
    amountText?: string
    rateText?: string
  }
}

export interface OdometerOCRResult {
  odometer: number
  confidence: number
  rawDetected?: {
    odometerText?: string
  }
}

export interface LocationData {
  latitude: number
  longitude: number
  stationName: string
  location: string
  accuracy?: number
}

export interface FuelEntry {
  id: string
  vehicleNumber: string
  fuelType: FuelType | string
  stationName: string
  location: string
  latitude: number
  longitude: number
  quantity: number
  amount: number
  rate: number
  odometer: number
  previousOdometer?: number
  distance?: number
  mileage?: number
  date: string // e.g. 2026-09-05
  time: string // e.g. 13:18 or 01:18 PM
  meterPhotoUri?: string
  vehiclePhotoUri?: string
  ocrConfidence: OCRConfidence
  notes?: string
  createdAt: string
}

export interface DraftFuelEntry {
  meterPhotoUri: string | null
  meterOCR: MeterOCRResult | null
  vehiclePhotoUri: string | null
  vehicleOCR: OdometerOCRResult | null
  location: LocationData | null
  manualEdits: {
    quantity?: number
    amount?: number
    rate?: number
    odometer?: number
    stationName?: string
    location?: string
  }
}
