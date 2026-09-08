import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { ReviewSummary } from '../components/fuel/ReviewSummary'
import { SuccessModal } from '../components/fuel/SuccessModal'
import { Button } from '../components/ui/Button'
import { StarBorder } from '../components/reactbits/StarBorder'
import { ClickSpark } from '../components/reactbits/ClickSpark'
import { useFuelStore } from '../store/fuelStore'
import { Check, RotateCcw, ShieldCheck } from 'lucide-react'
import type { FuelEntry } from '../types/fuel'
import type { EditableValues } from '../components/fuel/InlineEditModal'

export const ReviewFuel: React.FC = () => {
  const navigate = useNavigate()
  const draftEntry = useFuelStore((s) => s.draftEntry)
  const activeVehicle = useFuelStore((s) => s.getActiveVehicle())
  const updateManualEdit = useFuelStore((s) => s.updateManualEdit)
  const confirmAndSaveDraft = useFuelStore((s) => s.confirmAndSaveDraft)
  const resetDraft = useFuelStore((s) => s.resetDraft)

  const [savedEntry, setSavedEntry] = useState<FuelEntry | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdateValues = (updated: EditableValues) => {
    updateManualEdit('quantity', updated.quantity)
    updateManualEdit('amount', updated.amount)
    updateManualEdit('odometer', updated.odometer)
    updateManualEdit('stationName', updated.stationName)
    updateManualEdit('location', updated.location)
  }

  const handleConfirmSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      const entry = confirmAndSaveDraft()
      setIsSaving(false)
      if (entry) {
        setSavedEntry(entry)
        setIsSuccessModalOpen(true)
      }
    }, 400)
  }

  const handleRetake = () => {
    resetDraft()
    navigate('/add-fuel')
  }

  return (
    <ClickSpark sparkColor="#10b981" sparkCount={8} className="w-full min-h-full flex flex-col justify-between pb-4">
      <HeaderBar
        title="Review Fuel Entry"
        subtitle="Everything looks good?"
        showBack
        onBack={() => navigate('/add-fuel/vehicle')}
      />

      <div className="px-4 py-5 sm:px-6 space-y-5 max-w-md mx-auto w-full">
        {/* Anti-fraud / OCR Assurance Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Data automatically populated from 2 photos & GPS. Verify below before saving.
          </span>
        </div>

        {/* Core Review Card */}
        <ReviewSummary
          draft={draftEntry}
          vehicle={activeVehicle}
          onUpdateValues={handleUpdateValues}
        />
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div
        className="sticky bottom-0 inset-x-0 z-40 shrink-0 mt-auto bg-slate-950 border-t border-slate-900 p-4 max-w-md mx-auto w-full shadow-2xl shadow-slate-950"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleRetake}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="w-1/3 min-h-[52px] font-bold"
          >
            Retake
          </Button>

          <StarBorder speed="3s" color="#10b981" className="flex-1 w-full">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleConfirmSave}
              isLoading={isSaving}
              leftIcon={<Check className="w-5 h-5 stroke-[3]" />}
              className="min-h-[52px] shadow-lg shadow-emerald-500/25 text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold w-full"
            >
              Confirm & Save
            </Button>
          </StarBorder>
        </div>
      </div>


      {/* Success Celebration Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        entry={savedEntry}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </ClickSpark>
  )
}

