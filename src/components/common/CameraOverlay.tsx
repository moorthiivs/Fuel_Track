import React from 'react'
import { Sparkles, Camera, Image as ImageIcon, RotateCcw, Check } from 'lucide-react'
import { Button } from '../ui/Button'

export interface CameraOverlayProps {
  title: string
  guidanceText: string
  subGuidanceText?: string
  previewImageUri: string | null
  onCapture: () => void
  onSelectFile: () => void
  onUseDemo: () => void
  onRetake: () => void
  onConfirmPhoto: () => void
  isProcessing?: boolean
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  title,
  guidanceText,
  subGuidanceText,
  previewImageUri,
  onCapture,
  onSelectFile,
  onUseDemo,
  onRetake,
  onConfirmPhoto,
  isProcessing = false,
}) => {
  return (
    <div className="relative flex flex-col h-full bg-black text-slate-100 overflow-hidden select-none">
      {/* Viewfinder Target Container */}
      <div className="relative flex-1 flex items-center justify-center p-4 min-h-[320px]">
        {/* Background preview image if captured */}
        {previewImageUri ? (
          <div className="relative w-full h-full max-h-[460px] rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-950 flex items-center justify-center">
            <img
              src={previewImageUri}
              alt="Capture Preview"
              className="w-full h-full object-contain"
            />
            {/* Captured overlay watermark badge */}
            <div className="absolute top-3 left-3 bg-emerald-500/90 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              PHOTO CAPTURED
            </div>
          </div>
        ) : (
          /* Simulated camera scanner viewfinder */
          <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
            {/* Viewfinder Corner Reticle Brackets */}
            <div className="absolute top-3 left-3 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Scanning Laser Beam Effect */}
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-scan pointer-events-none" />

            {/* Target Guidance Center Icon */}
            <div className="flex flex-col items-center gap-2 text-slate-500 z-10 px-4 text-center">
              <Camera className="w-10 h-10 stroke-1 text-slate-400 animate-pulse" />
              <p className="text-xs font-semibold text-slate-300">
                Align target inside the guidelines
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Guidance Text Banner */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-5 py-4 text-center space-y-1">
        <h2 className="text-sm font-bold text-slate-100 flex items-center justify-center gap-2">
          <span>{title}</span>
        </h2>
        <p className="text-xs text-emerald-400 font-medium">
          {guidanceText}
        </p>
        {subGuidanceText && (
          <p className="text-[11px] text-slate-400">
            {subGuidanceText}
          </p>
        )}
      </div>

      {/* Camera Action Controls */}
      <div className="bg-slate-950 px-5 py-5 border-t border-slate-900 flex flex-col gap-3">
        {previewImageUri ? (
          /* Confirmation mode: [Retake] [Use Photo] */
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={onRetake}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retake
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={onConfirmPhoto}
              isLoading={isProcessing}
              leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
            >
              Use Photo
            </Button>
          </div>
        ) : (
          /* Capture mode: Primary Take Photo, Demo Photo, Upload */
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="primary"
                size="lg"
                onClick={onCapture}
                leftIcon={<Camera className="w-5 h-5" />}
                className="col-span-2 sm:col-span-1"
              >
                Take Photo
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onUseDemo}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
                className="col-span-2 sm:col-span-1 bg-gradient-to-r from-slate-800 to-slate-800/90 border-amber-500/30 text-amber-300 hover:text-amber-200"
              >
                Use Demo Photo
              </Button>
            </div>

            <button
              type="button"
              onClick={onSelectFile}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Or choose from device gallery</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
