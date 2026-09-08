import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { CameraOverlay } from '../components/common/CameraOverlay'
import { cameraService } from '../services/cameraService'
import { ocrService } from '../services/ocrService'
import { locationService } from '../services/locationService'
import { useFuelStore } from '../store/fuelStore'

export const CaptureVehicle: React.FC = () => {
  const navigate = useNavigate()
  const setDraftVehicle = useFuelStore((s) => s.setDraftVehicle)
  const setDraftLocation = useFuelStore((s) => s.setDraftLocation)

  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const handleCapture = async () => {
    const result = await cameraService.capturePhoto()
    if (result?.uri) {
      setPhotoUri(result.uri)
    }
  }

  const handleUseDemo = () => {
    const demo = cameraService.getDemoPhoto('vehicle')
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
      // 1. Analyze Odometer via OCR
      const odometerResult = await ocrService.analyzeOdometer(photoUri)
      setDraftVehicle(photoUri, odometerResult)

      // 2. Automatically resolve Location & Nearby Station via GPS
      const locationData = await locationService.resolveCurrentLocationDetails()
      setDraftLocation(locationData)

      // 3. Navigate straight to the Final Review & Confirm Screen
      navigate('/add-fuel/review')
    } catch (err) {
      console.error('Error analyzing vehicle cluster:', err)
      navigate('/add-fuel/review')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <HeaderBar
        title="Vehicle Dashboard"
        subtitle="Step 2 of 2: Odometer"
        showBack
        onBack={() => navigate('/add-fuel/processing')}
      />

      <div className="flex-1 flex flex-col">
        <CameraOverlay
          title="Vehicle Instrument Cluster"
          guidanceText="Fit the odometer reading inside the frame"
          subGuidanceText="Make sure total kilometres and dashboard cluster are in focus"
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
