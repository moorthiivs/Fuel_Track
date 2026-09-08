import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { DEMO_METER_PHOTO, DEMO_VEHICLE_PHOTO } from '../mocks/demoImages'

export interface PhotoCaptureResult {
  uri: string
  webPath?: string
  format: string
  isDemo?: boolean
}

class CameraService {
  /**
   * Capture photo via Capacitor Camera (native) or fallback file picker (web)
   */
  async capturePhoto(): Promise<PhotoCaptureResult> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      })

      return {
        uri: image.webPath || image.path || '',
        webPath: image.webPath,
        format: image.format,
        isDemo: false,
      }
    } catch (error) {
      console.warn('Capacitor camera unavailable or cancelled, using browser fallback:', error)
      return this.selectPhotoFromFile()
    }
  }

  /**
   * Browser file picker fallback
   */
  async selectPhotoFromFile(): Promise<PhotoCaptureResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        if (file) {
          const objectUrl = URL.createObjectURL(file)
          resolve({
            uri: objectUrl,
            webPath: objectUrl,
            format: file.type.split('/')[1] || 'jpeg',
            isDemo: false,
          })
        } else {
          // Default fallback demo if user cancels
          resolve(this.getDemoPhoto('meter'))
        }
      }

      input.click()
    })
  }

  /**
   * Instant mock demo photo for zero-friction demo mode
   */
  getDemoPhoto(type: 'meter' | 'vehicle'): PhotoCaptureResult {
    const isMeter = type === 'meter'
    return {
      uri: isMeter ? DEMO_METER_PHOTO : DEMO_VEHICLE_PHOTO,
      webPath: isMeter ? DEMO_METER_PHOTO : DEMO_VEHICLE_PHOTO,
      format: 'svg+xml',
      isDemo: true,
    }
  }
}

export const cameraService = new CameraService()
