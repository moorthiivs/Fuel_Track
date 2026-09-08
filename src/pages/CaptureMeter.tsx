import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { CameraOverlay } from '../components/common/CameraOverlay'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { cameraService } from '../services/cameraService'
import { ocrService } from '../services/ocrService'
import { useFuelStore } from '../store/fuelStore'
import { AlertCircle, RotateCcw, Edit3, ArrowRight } from 'lucide-react'

export const CaptureMeter: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setDraftMeter = useFuelStore((s) => s.setDraftMeter)
  const updateManualEdit = useFuelStore((s) => s.updateManualEdit)

  // Use passed state photo if came from AddFuel, or start fresh
  const initialPhoto = (location.state as any)?.photoUri || null
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhoto)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false)
  const [manualQty, setManualQty] = useState<string>('32.45')
  const [manualAmt, setManualAmt] = useState<string>('3245')

  const handleCapture = async () => {
    setValidationError(null)
    const result = await cameraService.capturePhoto()
    if (result?.uri) {
      setPhotoUri(result.uri)
    }
  }

  const handleUseDemo = () => {
    setValidationError(null)
    const demo = cameraService.getDemoPhoto('meter')
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
      // Analyze fuel meter via OCR / Google ML Kit
      const ocrResult = await ocrService.analyzeFuelMeter(photoUri)

      if (!ocrResult.isValid) {
        setValidationError(
          ocrResult.validationError ||
            'No fuel dispenser meter detected. Please capture the meter display showing litres and amount.'
        )
        setIsProcessing(false)
        return
      }

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
      setValidationError('Failed to process image. You can retake or enter litres/amount manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveManualMeter = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseFloat(manualQty) || 32.45
    const amt = parseFloat(manualAmt) || 3245
    const rate = Number((amt / qty).toFixed(2))

    updateManualEdit('quantity', qty)
    updateManualEdit('amount', amt)

    setDraftMeter(photoUri || '', {
      isValid: true,
      quantity: qty,
      amount: amt,
      rate,
      confidence: { quantity: 100, amount: 100, rate: 100 },
    })

    setIsManualModalOpen(false)
    navigate('/add-fuel/vehicle')
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      <HeaderBar
        title="Scan Fuel Meter"
        subtitle="Step 1 of 2"
        showBack
        onBack={() => navigate('/add-fuel')}
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
              Enter Manually
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <CameraOverlay
          title="Fuel Dispenser Scanner"
          guidanceText="Fit the fuel meter inside the frame"
          subGuidanceText="Make sure litres and sale amount are clearly visible"
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

      {/* Manual Fallback Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Enter Fuel Values Manually"
      >
        <form onSubmit={handleSaveManualMeter} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Litres (Quantity)
            </label>
            <input
              type="number"
              step="0.01"
              value={manualQty}
              onChange={(e) => setManualQty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 32.45"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Amount (₹)
            </label>
            <input
              type="number"
              value={manualAmt}
              onChange={(e) => setManualAmt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 3245"
              required
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
              Continue to Dashboard
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
