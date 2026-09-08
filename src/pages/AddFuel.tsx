import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { cameraService } from '../services/cameraService'
import { useFuelStore } from '../store/fuelStore'
import {
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  Image as ImageIcon,
} from 'lucide-react'

export const AddFuel: React.FC = () => {
  const navigate = useNavigate()
  const draftEntry = useFuelStore((s) => s.draftEntry)
  const [previewUri, setPreviewUri] = useState<string | null>(
    draftEntry.meterPhotoUri
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleTakePhoto = async () => {
    setIsLoading(true)
    const result = await cameraService.capturePhoto()
    setIsLoading(false)
    if (result?.uri) {
      setPreviewUri(result.uri)
    }
  }

  const handleUseDemo = () => {
    const demo = cameraService.getDemoPhoto('meter')
    setPreviewUri(demo.uri)
  }

  const handleSelectFile = async () => {
    setIsLoading(true)
    const result = await cameraService.selectPhotoFromFile()
    setIsLoading(false)
    if (result?.uri) {
      setPreviewUri(result.uri)
    }
  }

  const handleContinue = () => {
    if (previewUri) {
      // Navigate to meter processing or scanner review
      navigate('/add-fuel/meter', { state: { photoUri: previewUri } })
    } else {
      navigate('/add-fuel/meter')
    }
  }

  return (
    <div className="w-full min-h-full flex flex-col pb-6">
      <HeaderBar
        title="Add Fuel"
        subtitle="Step 1 of 2: Fuel Meter"
        showBack
      />

      <div className="px-4 py-5 sm:px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Step Indicator Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-current" />
              STEP 1 OF 2
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Fuel Meter Photo
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-1/2 rounded-full" />
          </div>

          <div className="pt-1">
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Fuel Meter
            </h2>
            <p className="text-xs text-slate-400">
              Just take 2 photos. We'll do the rest.
            </p>
          </div>
        </div>

        {/* Large Camera Card */}
        <Card
          variant={previewUri ? 'accent' : 'default'}
          className="p-5 border-slate-800 text-center space-y-4 relative overflow-hidden"
        >
          {previewUri ? (
            /* Photo Captured Preview */
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                <img
                  src={previewUri}
                  alt="Fuel Meter Preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  Photo captured
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold px-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ready for AI OCR Analysis
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewUri(null)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>
            </div>
          ) : (
            /* Camera Prompt Placeholder */
            <div className="py-6 space-y-4 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
                <Camera className="w-10 h-10 stroke-1" />
              </div>

              <div className="space-y-1 max-w-xs">
                <h3 className="text-base font-bold text-slate-200">
                  Capture Bunk Meter
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Capture the petrol bunk meter showing litres and amount clearly.
                </p>
              </div>

              <div className="pt-2 w-full space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleTakePhoto}
                  isLoading={isLoading}
                  leftIcon={<Camera className="w-5 h-5" />}
                >
                  Take Photo
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleUseDemo}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
                  className="border-amber-500/30 text-amber-300 hover:text-amber-200"
                >
                  Use Demo Photo (Quick Test)
                </Button>

                <button
                  type="button"
                  onClick={handleSelectFile}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose existing photo</span>
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Continue Action Button when Photo is captured */}
        {previewUri && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleContinue}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="py-4 shadow-lg shadow-emerald-500/20 text-base"
            >
              Continue to AI Processing
            </Button>
          </div>
        )}

        {/* Benefits Note */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero manual typing</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Our computer vision engine automatically parses litres, amount, and fuel rate from the dispenser screen.
          </p>
        </div>
      </div>
    </div>
  )
}
