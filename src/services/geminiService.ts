import { Capacitor } from '@capacitor/core'
import type { MeterOCRResult, OdometerOCRResult } from '../types/fuel'

const GEMINI_STORAGE_KEY = 'fueltrack_gemini_api_key'
const DEFAULT_MODEL = 'gemini-1.5-flash'

export interface GeminiTestResult {
  success: boolean
  message: string
}

export interface GeminiOdometerResponse {
  isValid: boolean
  isDashboard?: boolean
  odometer?: number
  tripReading?: number
  tripType?: string
  unit?: string
  speed?: number
  fuelLevel?: string
  confidence?: number
  rawDetected?: string
  explanation?: string
  validationError?: string
}

export interface GeminiFuelMeterResponse {
  isValid: boolean
  isFuelMeter?: boolean
  quantity?: number
  amount?: number
  rate?: number
  fuelType?: string
  confidence?: {
    quantity: number
    amount: number
    rate: number
  }
  rawDetected?: {
    volumeText?: string
    amountText?: string
    rateText?: string
  }
  validationError?: string
}

class GeminiService {
  /**
   * Get the active Gemini API key from localStorage or Vite environment variable
   */
  getApiKey(): string {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(GEMINI_STORAGE_KEY)
      if (savedKey && savedKey.trim().length > 0) {
        return savedKey.trim()
      }
    }
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
      return envKey.trim()
    }
    return ''
  }

  /**
   * Save a new API key to localStorage
   */
  setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim())
    }
  }

  /**
   * Remove the saved API key
   */
  removeApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GEMINI_STORAGE_KEY)
    }
  }

  /**
   * Returns true if a Gemini API key is configured
   */
  isConfigured(): boolean {
    return this.getApiKey().length > 0
  }

  /**
   * Test an API key by making a lightweight generation call
   */
  async testApiKey(keyToTest?: string): Promise<GeminiTestResult> {
    const key = (keyToTest || this.getApiKey()).trim()
    if (!key) {
      return { success: false, message: 'API key cannot be empty.' }
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Respond with the single word: OK' }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null)
        const errMsg =
          errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        return { success: false, message: errMsg }
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && text.trim().length > 0) {
        return { success: true, message: 'Gemini 1.5 Flash connected successfully!' }
      }
      return { success: false, message: 'Unexpected response from Gemini API.' }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error connecting to Google Gemini API.',
      }
    }
  }

  /**
   * Convert any image URI (Capacitor webPath, blob:, data:, file:) into pure Base64 and MIME type
   */
  async imageUriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
    if (!uri) throw new Error('Image URI is empty')

    // 1. Data URL
    if (uri.startsWith('data:')) {
      const [meta, rawData] = uri.split(',')
      const mimeMatch = meta.match(/data:(.*?);/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      return { base64: rawData, mimeType }
    }

    // 2. Fetch as Blob (Works for blob:, http://localhost/_capacitor_file_/, and web paths)
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      const mimeType = blob.type || 'image/jpeg'

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const res = reader.result as string
          const base64 = res.split(',')[1] || ''
          resolve({ base64, mimeType })
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (fetchErr) {
      // 3. Native fallback via Capacitor Filesystem for file:// paths
      if (Capacitor.isNativePlatform() && (uri.startsWith('file://') || uri.startsWith('/'))) {
        try {
          const { Filesystem } = await import('@capacitor/filesystem')
          const file = await Filesystem.readFile({ path: uri })
          const base64 = typeof file.data === 'string' ? file.data : ''
          return { base64, mimeType: 'image/jpeg' }
        } catch (fsErr) {
          console.warn('Filesystem fallback failed:', fsErr)
        }
      }
      throw fetchErr
    }
  }

  /**
   * Analyze Vehicle Dashboard / Instrument Cluster with Gemini Flash Vision
   * Extracts total odometer, trip reading, speed, fuel level, and validates cluster.
   */
  async analyzeVehicleCluster(imageUri: string): Promise<OdometerOCRResult> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      return {
        isValid: false,
        validationError: 'Gemini API key is not configured.',
        odometer: 0,
        confidence: 0,
      }
    }

    const { base64, mimeType } = await this.imageUriToBase64(imageUri)

    const prompt = `You are a high-precision automotive vision AI specializing in vehicle dashboards, instrument clusters, and speedometers for motorcycles, scooters, and cars.
Analyze this photo and extract the current vehicle odometer or trip distance reading.

IMPORTANT RULES:
1. Identify the cluster display: look for digital LCD, TFT screens, or analog barrel odometers.
2. Distinguish between:
   - SPEEDOMETER reading (e.g., 0 km/h, 45 km/h, mph) -> DO NOT confuse this with the odometer!
   - TACHOMETER / RPM (e.g., x1000 r/min, 2, 4, 6, 8, 10, 12) -> DO NOT confuse this with the odometer!
   - CLOCK / TIME (e.g., 5:51, 12:30) -> DO NOT confuse this with the odometer!
   - TRIP METERS (e.g., "TRIP B 5725.1 km", "TRIP A 120.4 km") -> If total ODO is not visible, use the Trip distance (round 5725.1 to 5725 or integer).
   - TOTAL ODOMETER (e.g., "ODO 48625 km", "TOTAL 48625", "5725.1 km").
3. Determine:
   - "odometer": integer kilometers (e.g. if reading is "5725.1 km", odometer must be 5725; if "48625", 48625).
   - "tripReading": the exact decimal number if it's a trip meter (e.g., 5725.1), or null if not trip.
   - "tripType": "TRIP A", "TRIP B", "ODO", "TOTAL", or "UNKNOWN".
   - "unit": "km" or "miles".
   - "speed": integer speed shown (e.g. 0).
   - "isValid": boolean, true if this is a genuine vehicle dashboard with a readable distance or trip reading.
   - "confidence": confidence score from 0 to 100.
   - "rawDetected": the exact text label found (e.g. "TRIP B 5725.1 km").
   - "validationError": if not valid, a friendly message explaining what is missing.

Respond ONLY with valid JSON matching this schema:
{
  "isValid": true,
  "isDashboard": true,
  "odometer": 5725,
  "tripReading": 5725.1,
  "tripType": "TRIP B",
  "unit": "km",
  "speed": 0,
  "confidence": 98,
  "rawDetected": "TRIP B 5725.1 km",
  "validationError": null
}`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null)
        throw new Error(
          errorJson?.error?.message || `Gemini API HTTP ${response.status}: ${response.statusText}`
        )
      }

      const result = await response.json()
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        throw new Error('Empty response from Gemini Vision')
      }

      const parsed: GeminiOdometerResponse = JSON.parse(rawText)

      const odometerVal =
        typeof parsed.odometer === 'number' && parsed.odometer > 0
          ? Math.round(parsed.odometer)
          : parsed.tripReading
          ? Math.round(parsed.tripReading)
          : 0

      if (parsed.isValid && odometerVal > 0) {
        return {
          isValid: true,
          odometer: odometerVal,
          confidence: Math.max(90, parsed.confidence || 95),
          rawDetected: {
            odometerText: parsed.rawDetected || `${odometerVal} ${parsed.unit || 'km'}`,
          },
        }
      }

      return {
        isValid: false,
        validationError:
          parsed.validationError ||
          'Could not clearly identify odometer or trip meter. Please ensure dashboard numbers are visible.',
        odometer: 0,
        confidence: 0,
      }
    } catch (err: any) {
      console.warn('Gemini vehicle cluster analysis error:', err)
      throw err
    }
  }

  /**
   * Analyze Fuel Dispenser Meter with Gemini Flash Vision
   * Extracts volume (litres), total amount (₹), and rate per litre.
   */
  async analyzeFuelMeter(imageUri: string): Promise<MeterOCRResult> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      return {
        isValid: false,
        validationError: 'Gemini API key is not configured.',
        quantity: 0,
        amount: 0,
        rate: 0,
        confidence: { quantity: 0, amount: 0, rate: 0 },
      }
    }

    const { base64, mimeType } = await this.imageUriToBase64(imageUri)

    const prompt = `You are a precision computer vision AI for fuel stations and petrol pump dispensers.
Analyze this fuel dispenser display photo and extract the transaction numbers.

RULES:
1. A fuel dispenser display typically shows 3 primary numbers:
   - Volume / Quantity in Litres (e.g., 32.45 L)
   - Total Sale Amount in Currency (e.g., ₹ 3245.00)
   - Unit Price / Rate per Litre (e.g., ₹ 100.00 / L)
2. Note that:
   - Total Amount = Volume * Rate
   - If one of the numbers is slightly obscured, calculate it mathematically using Amount / Volume = Rate.
3. Validate:
   - "isValid": boolean, true if this is an actual fuel dispenser display showing volume and amount.
   - "quantity": floating point litres (e.g. 32.45).
   - "amount": floating point or integer total currency (e.g. 3245.0).
   - "rate": floating point price per litre (e.g. 100.0).
   - "fuelType": "Petrol", "Diesel", "CNG", or "Unknown".
   - "confidence": confidence scores for quantity, amount, rate (0 to 100).
   - "rawDetected": strings of detected values.

Respond ONLY with valid JSON matching this schema:
{
  "isValid": true,
  "isFuelMeter": true,
  "quantity": 32.45,
  "amount": 3245.0,
  "rate": 100.0,
  "fuelType": "Petrol",
  "confidence": {
    "quantity": 98,
    "amount": 97,
    "rate": 99
  },
  "rawDetected": {
    "volumeText": "32.45 L",
    "amountText": "₹ 3245.00",
    "rateText": "100.00 / L"
  },
  "validationError": null
}`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null)
        throw new Error(
          errorJson?.error?.message || `Gemini API HTTP ${response.status}: ${response.statusText}`
        )
      }

      const result = await response.json()
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        throw new Error('Empty response from Gemini Vision')
      }

      const parsed: GeminiFuelMeterResponse = JSON.parse(rawText)

      if (parsed.isValid && parsed.quantity && parsed.quantity > 0 && parsed.amount && parsed.amount > 0) {
        const qty = Number(parsed.quantity.toFixed(2))
        const amt = Number(parsed.amount.toFixed(2))
        const calculatedRate = Number((amt / qty).toFixed(2))
        const rate = parsed.rate && parsed.rate > 0 ? Number(parsed.rate.toFixed(2)) : calculatedRate

        return {
          isValid: true,
          quantity: qty,
          amount: amt,
          rate,
          confidence: {
            quantity: parsed.confidence?.quantity || 96,
            amount: parsed.confidence?.amount || 96,
            rate: parsed.confidence?.rate || 98,
          },
          rawDetected: {
            volumeText: parsed.rawDetected?.volumeText || `${qty} L`,
            amountText: parsed.rawDetected?.amountText || `₹ ${amt}`,
            rateText: parsed.rawDetected?.rateText || `${rate} / L`,
          },
        }
      }

      return {
        isValid: false,
        validationError:
          parsed.validationError ||
          'Could not clearly read fuel dispenser values. Please ensure volume and amount are clearly in frame.',
        quantity: 0,
        amount: 0,
        rate: 0,
        confidence: { quantity: 0, amount: 0, rate: 0 },
      }
    } catch (err: any) {
      console.warn('Gemini fuel meter analysis error:', err)
      throw err
    }
  }
}

export const geminiService = new GeminiService()
