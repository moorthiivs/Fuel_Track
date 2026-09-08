import { Script, TextRecognition } from '@capacitor-mlkit/text-recognition'
import { Capacitor } from '@capacitor/core'
import { DEMO_METER_PHOTO, DEMO_VEHICLE_PHOTO } from '../mocks/demoImages'
import type { MeterOCRResult, OdometerOCRResult } from '../types/fuel'

export interface OCRProcessingStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed'
}

class OCRService {
  /**
   * Run Google ML Kit on-device Text Recognition (Native Android/iOS)
   */
  async recognizeTextWithMLKit(imageUri: string): Promise<string> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await TextRecognition.processImage({
          path: imageUri,
          script: Script.Latin,
        })
        return result.text || ''
      }
    } catch (err) {
      console.warn('Google ML Kit on-device recognition error:', err)
    }
    return ''
  }

  /**
   * Extract Odometer reading and validate that the photo is an actual dashboard cluster
   */
  async analyzeOdometer(
    imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<OdometerOCRResult> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    onStepUpdate?.('detecting_cluster')
    await sleep(400)

    // 1. Check if user selected demo photo
    if (imageUri === DEMO_VEHICLE_PHOTO) {
      onStepUpdate?.('reading_odometer')
      await sleep(350)
      return {
        isValid: true,
        odometer: 48625,
        confidence: 99,
        rawDetected: { odometerText: '48,625 km' },
      }
    }

    // 2. On Native Android, run Google ML Kit
    let recognizedText = ''
    if (Capacitor.isNativePlatform()) {
      recognizedText = await this.recognizeTextWithMLKit(imageUri)
    }

    onStepUpdate?.('reading_odometer')
    await sleep(300)

    // 3. Validation Logic: Check if recognized text contains vehicle cluster/odometer features
    if (recognizedText && recognizedText.trim().length > 0) {
      const lowerText = recognizedText.toLowerCase()

      // Look for cluster indicators
      const hasClusterKeywords =
        lowerText.includes('km') ||
        lowerText.includes('odo') ||
        lowerText.includes('trip') ||
        lowerText.includes('rpm') ||
        lowerText.includes('km/h') ||
        lowerText.includes('range')

      // Look for 4-6 digit odometer numbers (e.g. 48625, 48,625, 120450)
      const odometerMatches = recognizedText.match(/\b\d{1,3}(?:[,\s]\d{3})|\b\d{4,6}\b/g)

      if (hasClusterKeywords && odometerMatches && odometerMatches.length > 0) {
        // Clean matched number
        const cleanDigits = odometerMatches[0].replace(/[\s,]/g, '')
        const num = parseInt(cleanDigits, 10)
        if (num >= 50 && num <= 999999) {
          return {
            isValid: true,
            odometer: num,
            confidence: 95,
            rawDetected: { odometerText: `${num} km` },
          }
        }
      }

      // If user uploaded a personal photo or selfie with words or faces but no odometer
      if (!hasClusterKeywords && (!odometerMatches || odometerMatches.length === 0)) {
        return {
          isValid: false,
          validationError:
            'No vehicle odometer detected. The captured photo does not show a vehicle instrument cluster or digital numbers.',
          odometer: 0,
          confidence: 0,
        }
      }
    }

    // 4. In browser/demo mode or if ML Kit didn't find specific digits:
    if (!Capacitor.isNativePlatform()) {
      if (imageUri.startsWith('blob:') || imageUri.startsWith('data:image/')) {
        return {
          isValid: true,
          odometer: 48625,
          confidence: 92,
          rawDetected: { odometerText: '48,625 km' },
        }
      }
    }

    // Native fallback when no odometer readable
    if (Capacitor.isNativePlatform()) {
      return {
        isValid: false,
        validationError:
          'No odometer reading detected. Please ensure the dashboard display is clearly visible and glare-free.',
        odometer: 0,
        confidence: 0,
      }
    }

    return {
      isValid: true,
      odometer: 48625,
      confidence: 99,
      rawDetected: { odometerText: '48,625 km' },
    }
  }

  /**
   * Extract Fuel Meter reading and validate dispenser display
   */
  async analyzeFuelMeter(
    imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<MeterOCRResult> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    onStepUpdate?.('detecting')
    await sleep(400)

    // 1. Check if demo photo
    if (imageUri === DEMO_METER_PHOTO) {
      onStepUpdate?.('quantity')
      await sleep(300)
      onStepUpdate?.('amount')
      await sleep(300)
      onStepUpdate?.('rate')
      await sleep(250)

      return {
        isValid: true,
        quantity: 32.45,
        amount: 3245,
        rate: 100,
        confidence: { quantity: 98, amount: 96, rate: 99 },
        rawDetected: {
          volumeText: '32.45 L',
          amountText: '₹ 3245.00',
          rateText: '100.00 / L',
        },
      }
    }

    // 2. On Native Android, run Google ML Kit
    let recognizedText = ''
    if (Capacitor.isNativePlatform()) {
      recognizedText = await this.recognizeTextWithMLKit(imageUri)
    }

    onStepUpdate?.('quantity')
    await sleep(300)
    onStepUpdate?.('amount')
    await sleep(300)

    // 3. Validation Logic: Check if recognized text contains fuel dispenser features
    if (recognizedText && recognizedText.trim().length > 0) {
      const lowerText = recognizedText.toLowerCase()

      const hasMeterKeywords =
        lowerText.includes('sale') ||
        lowerText.includes('volume') ||
        lowerText.includes('litre') ||
        lowerText.includes('ltr') ||
        lowerText.includes('rate') ||
        lowerText.includes('pump') ||
        lowerText.includes('fuel') ||
        lowerText.includes('petrol') ||
        lowerText.includes('diesel')

      // Look for decimals like 32.45
      const decimalMatches = recognizedText.match(/\b\d{1,3}\.\d{2}\b/g)
      // Look for currency amounts like 3245
      const amountMatches = recognizedText.match(/\b\d{3,5}\b/g)

      if (decimalMatches && amountMatches) {
        const qty = parseFloat(decimalMatches[0])
        const amt = parseFloat(amountMatches[0])
        const rate = qty > 0 ? Number((amt / qty).toFixed(2)) : 100

        return {
          isValid: true,
          quantity: qty,
          amount: amt,
          rate,
          confidence: { quantity: 95, amount: 94, rate: 97 },
          rawDetected: {
            volumeText: `${qty} L`,
            amountText: `₹ ${amt}`,
            rateText: `${rate} / L`,
          },
        }
      }

      // If text exists but has NO meter characteristics (e.g. personal selfie/random image)
      if (!hasMeterKeywords && (!decimalMatches || !amountMatches)) {
        return {
          isValid: false,
          validationError:
            'No fuel dispenser meter detected. The photo does not show litres or sale amount digits.',
          quantity: 0,
          amount: 0,
          rate: 0,
          confidence: { quantity: 0, amount: 0, rate: 0 },
        }
      }
    }

    // Native fallback when no numbers detected
    if (Capacitor.isNativePlatform()) {
      return {
        isValid: false,
        validationError:
          'Could not clearly read fuel meter digits. Please fit the litres and amount within the camera guidelines.',
        quantity: 0,
        amount: 0,
        rate: 0,
        confidence: { quantity: 0, amount: 0, rate: 0 },
      }
    }

    return {
      isValid: true,
      quantity: 32.45,
      amount: 3245,
      rate: 100,
      confidence: { quantity: 98, amount: 96, rate: 99 },
      rawDetected: {
        volumeText: '32.45 L',
        amountText: '₹ 3245.00',
        rateText: '100.00 / L',
      },
    }
  }
}

export const ocrService = new OCRService()
