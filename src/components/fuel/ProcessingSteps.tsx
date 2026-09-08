import React from 'react'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

export interface StepItem {
  id: string
  label: string
  sublabel?: string
  status: 'pending' | 'running' | 'completed'
}

export interface ProcessingStepsProps {
  steps: StepItem[]
  title?: string
  subtitle?: string
}

export const ProcessingSteps: React.FC<ProcessingStepsProps> = ({
  steps,
  title = 'AI & Computer Vision Processing',
  subtitle = 'Extracting meter and vehicle metrics automatically...',
}) => {
  return (
    <div className="w-full max-w-sm mx-auto space-y-5 select-none">
      {/* Header animation */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      {/* Steps List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xl">
        {steps.map((step) => {
          const isCompleted = step.status === 'completed'
          const isRunning = step.status === 'running'
          const isPending = step.status === 'pending'

          return (
            <div
              key={step.id}
              className={clsx(
                'flex items-center justify-between p-2.5 rounded-xl transition-all duration-300',
                isRunning && 'bg-slate-800/80 border border-emerald-500/30',
                isCompleted && 'bg-emerald-500/5',
                isPending && 'opacity-40'
              )}
            >
              <div className="flex items-center gap-3">
                {isCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isRunning && (
                  <Loader2 className="w-5 h-5 text-emerald-400 shrink-0 animate-spin" />
                )}
                {isPending && (
                  <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                )}

                <div>
                  <div
                    className={clsx(
                      'text-xs font-semibold',
                      isCompleted && 'text-slate-200',
                      isRunning && 'text-emerald-300 font-bold',
                      isPending && 'text-slate-500'
                    )}
                  >
                    {step.label}
                  </div>
                  {step.sublabel && (
                    <div className="text-[11px] text-slate-400">
                      {step.sublabel}
                    </div>
                  )}
                </div>
              </div>

              {isCompleted && (
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Done
                </span>
              )}
              {isRunning && (
                <span className="text-[10px] font-bold text-emerald-400 animate-pulse uppercase tracking-wider">
                  Reading
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
