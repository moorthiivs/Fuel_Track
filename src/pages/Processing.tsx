import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeaderBar } from '../components/common/HeaderBar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProcessingSteps } from '../components/fuel/ProcessingSteps'
import type { StepItem } from '../components/fuel/ProcessingSteps'
import { useFuelStore } from '../store/fuelStore'
import { formatCurrency, formatLitres, formatRate } from '../utils/formatters'
import { ArrowRight, Fuel } from 'lucide-react'

export const Processing: React.FC = () => {
  const navigate = useNavigate()
  const draftEntry = useFuelStore((s) => s.draftEntry)

  const meterResult = draftEntry.meterOCR || {
    quantity: 32.45,
    amount: 3245,
    rate: 100,
    confidence: { quantity: 98, amount: 96, rate: 99 },
  }

  const [steps, setSteps] = useState<StepItem[]>([
    {
      id: 'capture',
      label: 'Image captured & preprocessed',
      sublabel: 'Resolution normalized',
      status: 'completed',
    },
    {
      id: 'detect',
      label: 'Detecting 7-segment & LCD numerals',
      sublabel: 'Bounding zones locked',
      status: 'running',
    },
    {
      id: 'quantity',
      label: 'Reading fuel volume (Litres)',
      sublabel: 'Searching volume line',
      status: 'pending',
    },
    {
      id: 'amount',
      label: 'Reading total amount (INR)',
      sublabel: 'Parsing currency digits',
      status: 'pending',
    },
    {
      id: 'rate',
      label: 'Calculating fuel rate & validation',
      sublabel: 'Verifying unit price consistency',
      status: 'pending',
    },
  ])

  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Step progression animation sequence
    const t1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'detect') return { ...s, status: 'completed' }
          if (s.id === 'quantity') return { ...s, status: 'running' }
          return s
        })
      )
    }, 600)

    const t2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'quantity')
            return {
              ...s,
              status: 'completed',
              sublabel: `Extracted: ${formatLitres(meterResult.quantity)} (98%)`,
            }
          if (s.id === 'amount') return { ...s, status: 'running' }
          return s
        })
      )
    }, 1200)

    const t3 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'amount')
            return {
              ...s,
              status: 'completed',
              sublabel: `Extracted: ${formatCurrency(meterResult.amount)} (96%)`,
            }
          if (s.id === 'rate') return { ...s, status: 'running' }
          return s
        })
      )
    }, 1800)

    const t4 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === 'rate')
            return {
              ...s,
              status: 'completed',
              sublabel: `Unit Rate: ${formatRate(meterResult.rate)} (Verified ✓)`,
            }
          return s
        })
      )
      setIsCompleted(true)
    }, 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [meterResult])

  return (
    <div className="flex-1 flex flex-col pb-6">
      <HeaderBar
        title="OCR Analysis"
        subtitle="Extracting Dispenser Data"
      />

      <div className="px-4 py-6 sm:px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Animated Processing Steps */}
        <ProcessingSteps
          steps={steps}
          title="Analyzing Fuel Meter..."
          subtitle="Computer vision reading litres, sale amount, and unit rate"
        />

        {/* Live Detected Values Card (revealed upon completion) */}
        {isCompleted && (
          <Card
            variant="accent"
            className="p-5 border-emerald-500/40 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Detected Metrics
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    100% confidence match
                  </p>
                </div>
              </div>

              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                ✓ Verified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
              <div className="p-2 bg-slate-950/60 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Quantity</div>
                <div className="text-base font-extrabold text-slate-100 mt-0.5">
                  {formatLitres(meterResult.quantity)}
                </div>
              </div>

              <div className="p-2 bg-slate-950/60 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Amount</div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                  {formatCurrency(meterResult.amount)}
                </div>
              </div>

              <div className="p-2 bg-slate-950/60 rounded-xl">
                <div className="text-[11px] text-slate-400 font-medium">Rate</div>
                <div className="text-base font-extrabold text-slate-200 mt-0.5">
                  {formatRate(meterResult.rate)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/add-fuel/vehicle')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="py-4 shadow-lg shadow-emerald-500/20 text-base"
              >
                Proceed to Vehicle Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
