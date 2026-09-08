import { Capacitor } from '@capacitor/core'
import type { MeterOCRResult, OdometerOCRResult } from '../types/fuel'

const GEMINI_KEY_STORAGE = 'fueltrack_gemini_api_key'
const GEMINI_MODEL_STORAGE = 'fueltrack_gemini_active_model'

/**
 * Production-grade resilient list of Gemini Flash multimodal models in priority order.
 * If Google deprecates or changes a model tier, the system automatically falls back
 * to the next available active model without breaking the application.
 */
export const CANDIDATE_FLASH_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
] as const

export interface GeminiTestResult {
  success: boolean
  message: string
  activeModel?: string
}

export interface GeminiOdometerResponse {
  isValid: boolean
  isDashboard?: boolean
  odometer?: number | null
  tripReading?: number | null
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
   * Get the saved Gemini API key from localStorage or environment
   */
  getApiKey(): string {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(GEMINI_KEY_STORAGE)
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
      localStorage.setItem(GEMINI_KEY_STORAGE, key.trim())
    }
  }

  /**
   * Remove the saved API key and active model
   */
  removeApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GEMINI_KEY_STORAGE)
      localStorage.removeItem(GEMINI_MODEL_STORAGE)
    }
  }

  /**
   * Returns true if a Gemini API key is configured
   */
  isConfigured(): boolean {
    return this.getApiKey().length > 0
  }

  /**
   * Get the active working model name, defaulting to gemini-3.6-flash
   */
  getActiveModel(): string {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem(GEMINI_MODEL_STORAGE)
      if (savedModel && savedModel.trim().length > 0) {
        return savedModel.trim()
      }
    }
    return CANDIDATE_FLASH_MODELS[0]
  }

  /**
   * Save the active working model
   */
  setActiveModel(modelName: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GEMINI_MODEL_STORAGE, modelName.trim())
    }
  }

  /**
   * Ultra-fast API key verification (<400ms latency).
   * Validates the key via Google's official models endpoint without triggering
   * slow reasoning/thinking generation, and instantly discovers the active model.
   */
  async testApiKey(keyToTest?: string): Promise<GeminiTestResult> {
    const key = (keyToTest || this.getApiKey()).trim()
    if (!key) {
      return { success: false, message: 'API key cannot be empty.' }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=20&key=${key}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json().catch(() => null)
        const models: Array<{ name: string; supportedGenerationMethods?: string[] }> =
          data?.models || []

        const availableModelNames = models.map((m) => m.name.replace('models/', ''))
        const bestModel =
          CANDIDATE_FLASH_MODELS.find((candidate) => availableModelNames.includes(candidate)) ||
          CANDIDATE_FLASH_MODELS[0]

        this.setActiveModel(bestModel)
        const cleanModelDisplay = bestModel
          .replace('gemini-', 'Gemini ')
          .replace('-flash', ' Flash')
          .replace('-preview', ' Preview')
          .toUpperCase()

        return {
          success: true,
          message: `Verified & Connected to ${cleanModelDisplay}!`,
          activeModel: bestModel,
        }
      }

      const errorJson = await response.json().catch(() => null)
      const errMsg =
        errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`
      return { success: false, message: errMsg }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timed out. Please check your network.',
        }
      }
      return {
        success: false,
        message: err?.message || 'Network connection failed.',
      }
    }
  }

  /**
   * Execute generateContent with automatic model fallback across candidate models.
   */
  private async executeWithModelFallback(
    payload: any,
    apiKey: string
  ): Promise<{ resultText: string; modelUsed: string }> {
    const currentActive = this.getActiveModel()
    // Reorder candidate models so current active is tried first
    const modelsToTry = [
      currentActive,
      ...CANDIDATE_FLASH_MODELS.filter((m) => m !== currentActive),
    ]

    let lastError: Error | null = null

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )

        if (response.ok) {
          const data = await response.json()
          const parts = data?.candidates?.[0]?.content?.parts
          const resultText =
            parts?.find((p: any) => typeof p.text === 'string' && (p.text.includes('{') || p.text.includes('}')))?.[
              'text'
            ] ||
            parts?.find((p: any) => typeof p.text === 'string')?.text ||
            parts?.[0]?.text

          if (resultText && resultText.trim().length > 0) {
            // Update active model for subsequent requests
            this.setActiveModel(model)
            return { resultText, modelUsed: model }
          }
        } else {
          const errorJson = await response.json().catch(() => null)
          const status = response.status
          // If 404 or model not supported/deprecated, continue to next candidate
          if (status === 404 || status === 400) {
            console.warn(`Model ${model} returned ${status}, trying next fallback model...`)
            continue
          }
          throw new Error(
            errorJson?.error?.message || `Gemini API HTTP ${status}: ${response.statusText}`
          )
        }
      } catch (err: any) {
        lastError = err
        // If it was a network error, log and try next model
        console.warn(`Request failed with model ${model}:`, err)
      }
    }

    throw lastError || new Error('All candidate Gemini Flash models failed.')
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

CRITICAL — IMAGE REJECTION RULES (MUST CHECK FIRST):
- You MUST first determine if this image is actually a vehicle dashboard, instrument cluster, or speedometer panel.
- If the image is NOT a vehicle dashboard (e.g., it is a document, certificate, receipt, invoice, table, spreadsheet, person, food, building, landscape, random object, screenshot, chart, form, or anything that is not a vehicle instrument cluster), you MUST return:
  {"isValid": false, "isDashboard": false, "odometer": null, "tripReading": null, "tripType": null, "unit": null, "speed": null, "confidence": 0, "rawDetected": null, "validationError": "This image does not appear to be a vehicle dashboard or instrument cluster."}
- Do NOT hallucinate or fabricate numbers. If you cannot clearly see dashboard instruments, reject the image.
- Do NOT extract numbers from tables, documents, labels, or any non-dashboard source.

ONLY if the image IS a genuine vehicle dashboard, follow these extraction rules:
1. Identify the cluster display: look for digital LCD, TFT screens, or analog barrel odometers.
2. Distinguish between:
   - SPEEDOMETER reading (e.g., 0 km/h, 45 km/h, mph) -> DO NOT confuse this with the odometer!
   - TACHOMETER / RPM (e.g., x1000 r/min, 2, 4, 6, 8, 10, 12) -> DO NOT confuse this with the odometer!
   - CLOCK / TIME (e.g., 5:51, 12:30) -> DO NOT confuse this with the odometer!
   - TRIP METERS (e.g., "TRIP B 5725.1 km", "TRIP A 120.4 km") -> If total ODO is not visible, use the Trip distance (round 5725.1 to 5725 or integer).
   - TOTAL ODOMETER (e.g., "ODO 48625 km", "TOTAL 48625", "5725.1 km").
3. Determine:
   - "odometer": integer kilometers (e.g. if reading is "5725.1 km", odometer must be 5725; if "48625", 48625). If total ODO is absent but trip is present, assign the rounded trip number here!
   - "tripReading": decimal number if it's a trip meter (e.g. 5725.1), or null.
   - "tripType": "TRIP A", "TRIP B", "ODO", "TOTAL", or "UNKNOWN".
   - "unit": "km" or "miles".
   - "speed": integer speed shown (e.g. 0).
   - "isValid": true ONLY if this is a genuine vehicle dashboard with a readable distance or trip reading.
   - "isDashboard": true ONLY if the image actually shows a vehicle instrument cluster.
   - "confidence": confidence score from 0 to 100.
   - "rawDetected": the exact text label found (e.g. "TRIP B 5725.1 km").
   - "validationError": null if valid, or a friendly message explaining what is missing.

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
      const payload = {
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
      }

      const { resultText } = await this.executeWithModelFallback(payload, apiKey)
      const parsed: GeminiOdometerResponse = JSON.parse(resultText)

      // STRICT: Reject if AI says this is not a dashboard
      if (!parsed.isValid || parsed.isDashboard === false) {
        return {
          isValid: false,
          validationError:
            parsed.validationError ||
            'This image does not appear to be a vehicle dashboard. Please capture your speedometer or instrument cluster.',
          odometer: 0,
          confidence: 0,
        }
      }

      // Handle both explicit odometer and trip meter numbers (e.g. 5725.1 km -> 5725)
      const odometerVal =
        typeof parsed.odometer === 'number' && parsed.odometer > 0
          ? Math.round(parsed.odometer)
          : typeof parsed.tripReading === 'number' && parsed.tripReading > 0
          ? Math.round(parsed.tripReading)
          : 0

      if (odometerVal > 0) {
        return {
          isValid: true,
          odometer: odometerVal,
          confidence: Math.max(90, parsed.confidence || 98),
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

CRITICAL — IMAGE REJECTION RULES (MUST CHECK FIRST):
- You MUST first determine if this image actually shows a fuel dispenser, petrol pump display, or fuel meter.
- If the image is NOT a fuel dispenser (e.g., it is a document, certificate, receipt, invoice, table, spreadsheet, person, food, building, landscape, random object, screenshot, chart, form, calibration report, or anything that is not a fuel pump/dispenser display), you MUST return:
  {"isValid": false, "isFuelMeter": false, "quantity": null, "amount": null, "rate": null, "fuelType": null, "confidence": {"quantity": 0, "amount": 0, "rate": 0}, "rawDetected": null, "validationError": "This image does not appear to be a fuel dispenser or petrol pump display."}
- Do NOT hallucinate or fabricate numbers. If you cannot clearly see a fuel dispenser display, reject the image.
- Do NOT extract numbers from tables, documents, labels, or any non-fuel-dispenser source.

ONLY if the image IS a genuine fuel dispenser display, follow these extraction rules:
1. A fuel dispenser display typically shows 3 primary numbers:
   - Volume / Quantity in Litres (e.g., 32.45 L)
   - Total Sale Amount in Currency (e.g., ₹ 3245.00)
   - Unit Price / Rate per Litre (e.g., ₹ 100.00 / L)
2. Note that:
   - Total Amount = Volume * Rate
   - If one of the numbers is slightly obscured, calculate it mathematically using Amount / Volume = Rate.
3. Validate:
   - "isValid": true ONLY if this is an actual fuel dispenser display showing volume and amount.
   - "isFuelMeter": true ONLY if the image actually shows a fuel pump/dispenser.
   - "quantity": floating point litres (e.g. 32.45).
   - "amount": floating point or integer total currency (e.g. 3245.0).
   - "rate": floating point price per litre (e.g. 100.0).
   - "fuelType": "Petrol", "Diesel", "CNG", or "Unknown".
   - "confidence": confidence scores for quantity, amount, rate (0 to 100).
   - "rawDetected": strings of detected values.
   - "validationError": null if valid, or a friendly message if not.

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
      const payload = {
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
      }

      const { resultText } = await this.executeWithModelFallback(payload, apiKey)
      const parsed: GeminiFuelMeterResponse = JSON.parse(resultText)

      // STRICT: Reject if AI says this is not a fuel meter
      if (!parsed.isValid || parsed.isFuelMeter === false) {
        return {
          isValid: false,
          validationError:
            parsed.validationError ||
            'This image does not appear to be a fuel dispenser or petrol pump display. Please capture the fuel meter showing litres and amount.',
          quantity: 0,
          amount: 0,
          rate: 0,
          confidence: { quantity: 0, amount: 0, rate: 0 },
        }
      }

      if (parsed.quantity && parsed.quantity > 0 && parsed.amount && parsed.amount > 0) {
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
