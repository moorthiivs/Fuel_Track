import type { MeterOCRResult, OdometerOCRResult } from '../../types/fuel'
import type { IOCRService } from './ocrInterface'

export class MockOCRService implements IOCRService {
  private shouldFail = false

  setFail(fail: boolean): void {
    this.shouldFail = fail
  }

  async analyzeFuelMeter(
    _imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<MeterOCRResult> {
    onStepUpdate?.('detecting')
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (this.shouldFail) {
      return {
        isValid: false,
        validationError: 'Unable to read dispenser meter. Please enter fuel litres and amount manually.',
        quantity: 0,
        amount: 0,
        rate: 0,
        confidence: { quantity: 0, amount: 0, rate: 0 },
      }
    }

    onStepUpdate?.('quantity')
    onStepUpdate?.('amount')
    onStepUpdate?.('rate')

    return {
      isValid: true,
      quantity: 32.45,
      amount: 3245.0,
      rate: 100.0,
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

  async analyzeOdometer(
    _imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<OdometerOCRResult> {
    onStepUpdate?.('detecting_cluster')
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (this.shouldFail) {
      return {
        isValid: false,
        validationError: 'Unable to read odometer reading. Please enter it manually.',
        odometer: 0,
        confidence: 0,
      }
    }

    onStepUpdate?.('reading_odometer')

    return {
      isValid: true,
      odometer: 48625,
      confidence: 99,
      rawDetected: {
        odometerText: '48,625 km',
      },
    }
  }
}

export const mockOcrService = new MockOCRService()
