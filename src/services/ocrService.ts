import { DEMO_METER_PHOTO, DEMO_VEHICLE_PHOTO } from '../mocks/demoImages'
import type { MeterOCRResult, OdometerOCRResult } from '../types/fuel'
import { geminiService } from './geminiService'

export interface OCRProcessingStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed'
}

class OCRService {
  /**
   * Extract Odometer reading and validate that the photo is an actual dashboard cluster.
   * Supports both motorcycles, scooters, and cars (digital LCD, TFT, analog trip meters).
   * Powered entirely by Google Gemini Flash Vision AI for maximum accuracy.
   */
  async analyzeOdometer(
    imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<OdometerOCRResult> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    onStepUpdate?.('detecting_cluster')
    await sleep(250)

    // 1. Check if user selected demo photo
    if (imageUri === DEMO_VEHICLE_PHOTO) {
      onStepUpdate?.('reading_odometer')
      await sleep(250)
      return {
        isValid: true,
        odometer: 48625,
        confidence: 99,
        rawDetected: { odometerText: '48,625 km' },
      }
    }

    // 2. Primary & Only Engine: Google Gemini Flash Multimodal AI Vision
    if (geminiService.isConfigured()) {
      try {
        onStepUpdate?.('reading_odometer')
        const geminiResult = await geminiService.analyzeVehicleCluster(imageUri)

        // Return both valid and invalid results from Gemini (it handles rejection)
        return geminiResult
      } catch (geminiErr) {
        console.warn('Gemini vision analysis failed:', geminiErr)
        return {
          isValid: false,
          validationError:
            'AI analysis failed. Please check your network connection and try again, or enter odometer reading manually.',
          odometer: 0,
          confidence: 0,
        }
      }
    }

    // 3. No AI configured — prompt user to enable Gemini
    return {
      isValid: false,
      validationError:
        'Gemini AI Vision is required for image analysis. Please enable it by tapping "Enable Gemini AI" above, or enter odometer reading manually.',
      odometer: 0,
      confidence: 0,
    }
  }

  /**
   * Extract Fuel Meter reading and validate dispenser display.
   * Powered entirely by Google Gemini Flash Vision AI for maximum accuracy.
   */
  async analyzeFuelMeter(
    imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<MeterOCRResult> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    onStepUpdate?.('detecting')
    await sleep(250)

    // 1. Check if demo photo
    if (imageUri === DEMO_METER_PHOTO) {
      onStepUpdate?.('quantity')
      await sleep(200)
      onStepUpdate?.('amount')
      await sleep(200)
      onStepUpdate?.('rate')
      await sleep(150)

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

    // 2. Primary & Only Engine: Google Gemini Flash Multimodal AI Vision
    if (geminiService.isConfigured()) {
      try {
        onStepUpdate?.('quantity')
        const geminiResult = await geminiService.analyzeFuelMeter(imageUri)

        if (geminiResult && geminiResult.isValid && geminiResult.quantity > 0) {
          onStepUpdate?.('amount')
          onStepUpdate?.('rate')
        }

        // Return both valid and invalid results from Gemini (it handles rejection)
        return geminiResult
      } catch (geminiErr) {
        console.warn('Gemini fuel meter analysis failed:', geminiErr)
        return {
          isValid: false,
          validationError:
            'AI analysis failed. Please check your network connection and try again, or enter values manually.',
          quantity: 0,
          amount: 0,
          rate: 0,
          confidence: { quantity: 0, amount: 0, rate: 0 },
        }
      }
    }

    // 3. No AI configured — prompt user to enable Gemini
    return {
      isValid: false,
      validationError:
        'Gemini AI Vision is required for image analysis. Please enable it by tapping "Enable Gemini AI" above, or enter values manually.',
      quantity: 0,
      amount: 0,
      rate: 0,
      confidence: { quantity: 0, amount: 0, rate: 0 },
    }
  }
}

export const ocrService = new OCRService()
