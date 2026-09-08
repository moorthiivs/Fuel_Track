import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { CameraOverlay } from '../components/common/CameraOverlay'
import { cameraService } from '../services/cameraService'
import { ocrService } from '../services/ocrService'
import { useFuelStore } from '../store/fuelStore'

export const CaptureMeter: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setDraftMeter = useFuelStore((s) => s.setDraftMeter)

  // Use passed state photo if came from AddFuel, or start fresh
  const initialPhoto = (location.state as any)?.photoUri || null
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhoto)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const handleCapture = async () => {
    const result = await cameraService.capturePhoto()
    if (result?.uri) {
      setPhotoUri(result.uri)
    }
  }

  const handleUseDemo = () => {
    const demo = cameraService.getDemoPhoto('meter')
    setPhotoUri(demo.uri)
  }

  const handleSelectFile = async () => {
    const result = await cameraService.selectPhotoFromFile()
    if (result?.uri) {
      setPhotoUri(result.uri)
    }
  }

  const handleConfirmPhoto = async () => {
    if (!photoUri) return

    setIsProcessing(true)
    try {
      // Analyze fuel meter via OCR
      const ocrResult = await ocrService.analyzeFuelMeter(photoUri)
      setDraftMeter(photoUri, ocrResult)

      // Navigate to Processing screen
      navigate('/add-fuel/processing', {
        state: {
          phase: 'meter_completed',
          meterResult: ocrResult,
        },
      })
    } catch (err) {
      console.error('OCR analysis error:', err)
      // Fallback
      navigate('/add-fuel/vehicle')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <HeaderBar
        title="Scan Fuel Meter"
        subtitle="Step 1 of 2"
        showBack
        onBack={() => navigate('/add-fuel')}
      />

      <div className="flex-1 flex flex-col">
        <CameraOverlay
          title="Fuel Dispenser Scanner"
          guidanceText="Fit the fuel meter inside the frame"
          subGuidanceText="Make sure litres and sale amount are clearly visible"
          previewImageUri={photoUri}
          onCapture={handleCapture}
          onSelectFile={handleSelectFile}
          onUseDemo={handleUseDemo}
          onRetake={() => setPhotoUri(null)}
          onConfirmPhoto={handleConfirmPhoto}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  )
}
