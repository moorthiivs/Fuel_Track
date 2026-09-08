import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { CheckCircle2, ArrowRight, LayoutDashboard, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatCurrency, formatLitres, formatDistance } from '../../utils/formatters'
import type { FuelEntry } from '../../types/fuel'

export interface SuccessModalProps {
  isOpen: boolean
  entry: FuelEntry | null
  onClose: () => void
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  entry,
  onClose,
}) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      // Trigger festive celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10b981', '#34d399', '#38bdf8', '#fbbf24'],
        })
      } catch (err) {
        console.log('Confetti effect unavailable:', err)
      }
    }
  }, [isOpen])

  if (!isOpen || !entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Animated Checkmark Circle */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center justify-center gap-1.5">
            <span>Fuel Entry Saved!</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Your fuel record and proof photos have been logged.
          </p>
        </div>

        {/* Highlight Metrics */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-slate-400 font-semibold mb-0.5">Amount</div>
            <div className="text-sm font-extrabold text-emerald-400 truncate">
              {formatCurrency(entry.amount)}
            </div>
          </div>

          <div className="text-center border-x border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-0.5">Quantity</div>
            <div className="text-sm font-extrabold text-slate-200 truncate">
              {formatLitres(entry.quantity)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-slate-400 font-semibold mb-0.5">Odometer</div>
            <div className="text-sm font-extrabold text-sky-400 truncate">
              {formatDistance(entry.odometer)}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              onClose()
              navigate(`/history/${entry.id}`)
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            View Entry
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => {
              onClose()
              navigate('/')
            }}
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
