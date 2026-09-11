import type { MeterOCRResult, OdometerOCRResult } from '../../types/fuel'

export interface IOCRService {
  analyzeFuelMeter(
    imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<MeterOCRResult>

  analyzeOdometer(
    imageUri: string,
    onStepUpdate?: (stepId: string) => void
  ): Promise<OdometerOCRResult>
}
