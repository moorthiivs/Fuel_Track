import type { MeterOCRResult, OdometerOCRResult } from '../types/fuel'

export interface OCRProcessingStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed'
}

class OCRService {
  /**
   * Analyze Fuel Meter image
   * Production replacement point for: Google ML Kit / Cloud Vision / Azure AI / AWS Textract / OpenAI Vision
   */
  async analyzeFuelMeter(
    _imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<MeterOCRResult> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // Step 1: Detect bounding boxes & text zones
    onStepUpdate?.('detecting')
    await sleep(450)

    // Step 2: Read volume / litres
    onStepUpdate?.('quantity')
    await sleep(400)

    // Step 3: Read sale amount
    onStepUpdate?.('amount')
    await sleep(400)

    // Step 4: Calculate rate checksum
    onStepUpdate?.('rate')
    await sleep(350)

    // Return structured OCR result with high confidence
    return {
      quantity: 32.45,
      amount: 3245,
      rate: 100,
      confidence: {
        quantity: 98,
        amount: 96,
        rate: 99,
      },
      rawDetected: {
        volumeText: '32.45 L',
        amountText: '₹ 3245.00',
        rateText: '100.00 / L',
      },
    }
  }

  /**
   * Analyze Vehicle Dashboard / Odometer image
   */
  async analyzeOdometer(
    _imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<OdometerOCRResult> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    onStepUpdate?.('detecting_cluster')
    await sleep(450)

    onStepUpdate?.('reading_odometer')
    await sleep(400)

    return {
      odometer: 48625,
      confidence: 99,
      rawDetected: {
        odometerText: '48,625 km',
      },
    }
  }
}

export const ocrService = new OCRService()
