import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { CameraOverlay } from '../components/common/CameraOverlay'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { cameraService } from '../services/cameraService'
import { ocrService } from '../services/ocrService'
import { locationService } from '../services/locationService'
import { useFuelStore } from '../store/fuelStore'
import { AlertCircle, RotateCcw, Edit3, ArrowRight } from 'lucide-react'

export const CaptureVehicle: React.FC = () => {
  const navigate = useNavigate()
  const setDraftVehicle = useFuelStore((s) => s.setDraftVehicle)
  const setDraftLocation = useFuelStore((s) => s.setDraftLocation)
  const updateManualEdit = useFuelStore((s) => s.updateManualEdit)
  const activeVehicle = useFuelStore((s) => s.getActiveVehicle())

  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false)
  const [manualOdoInput, setManualOdoInput] = useState<string>(() =>
    String(activeVehicle?.currentOdometer || '5725')
  )

  const handleCapture = async () => {
    setValidationError(null)
    const result = await cameraService.capturePhoto()
    if (result?.uri) {
      setPhotoUri(result.uri)
    }
  }

  const handleUseDemo = () => {
    setValidationError(null)
    const demo = cameraService.getDemoPhoto('vehicle')
    setPhotoUri(demo.uri)
  }

  const handleSelectFile = async () => {
    setValidationError(null)
    const result = await cameraService.selectPhotoFromFile()
    if (result?.uri) {
      setPhotoUri(result.uri)
    }
  }

  const handleConfirmPhoto = async () => {
    if (!photoUri) return

    setIsProcessing(true)
    setValidationError(null)

    try {
      // 1. Analyze Odometer via Google ML Kit / OCR with validation
      const odometerResult = await ocrService.analyzeOdometer(photoUri)

      if (!odometerResult.isValid) {
        setValidationError(
          odometerResult.validationError ||
            'No vehicle odometer detected. Please capture a clear photo of your vehicle dashboard numbers.'
        )
        setIsProcessing(false)
        return
      }

      setDraftVehicle(photoUri, odometerResult)

      // 2. Automatically resolve Location & Nearby Station via real GPS
      const locationData = await locationService.resolveCurrentLocationDetails()
      setDraftLocation(locationData)

      // 3. Navigate straight to the Final Review & Confirm Screen
      navigate('/add-fuel/review')
    } catch (err) {
      console.error('Error analyzing vehicle cluster:', err)
      setValidationError('Failed to process image. You can retake or enter odometer manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveManualOdometer = async (e: React.FormEvent) => {
    e.preventDefault()
    const odoNum = parseInt(manualOdoInput, 10) || 48625
    updateManualEdit('odometer', odoNum)
    setDraftVehicle(photoUri || '', {
      isValid: true,
      odometer: odoNum,
      confidence: 100,
    })

    const locationData = await locationService.resolveCurrentLocationDetails()
    setDraftLocation(locationData)
    setIsManualModalOpen(false)
    navigate('/add-fuel/review')
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <HeaderBar
        title="Vehicle Dashboard"
        subtitle="Step 2 of 2: Odometer"
        showBack
        onBack={() => navigate('/add-fuel/processing')}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="m-3 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-rose-200">Photo Validation Failed</span>
              <p className="text-[11px] text-rose-300/90 mt-0.5">{validationError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setValidationError(null)
                setPhotoUri(null)
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs py-1.5"
            >
              Retake Photo
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              className="text-xs py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950"
            >
              Enter Reading Manually
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <CameraOverlay
          title="Vehicle Instrument Cluster"
          guidanceText="Fit the odometer reading inside the frame"
          subGuidanceText="Make sure total kilometres and dashboard cluster are in focus"
          previewImageUri={photoUri}
          onCapture={handleCapture}
          onSelectFile={handleSelectFile}
          onUseDemo={handleUseDemo}
          onRetake={() => {
            setValidationError(null)
            setPhotoUri(null)
          }}
          onConfirmPhoto={handleConfirmPhoto}
          isProcessing={isProcessing}
        />
      </div>

      {/* Manual Odometer Fallback Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Enter Odometer Manually"
      >
        <form onSubmit={handleSaveManualOdometer} className="space-y-4">
          <p className="text-xs text-slate-400">
            Enter your vehicle's current odometer reading in kilometres.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Odometer (km)
            </label>
            <input
              type="number"
              value={manualOdoInput}
              onChange={(e) => setManualOdoInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 48625"
              required
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
