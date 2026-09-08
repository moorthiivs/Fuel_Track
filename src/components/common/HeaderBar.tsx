import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useFuelStore } from '../../store/fuelStore'

export interface HeaderBarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const navigate = useNavigate()
  const demoMode = useFuelStore((s) => s.demoMode)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/90 px-4 pb-3"
      style={{
        paddingTop: 'max(0.85rem, env(safe-area-inset-top, 0.85rem))',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {title && (
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 truncate tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {demoMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Sparkles className="w-3 h-3" />
              Demo Mode
            </span>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  )
}
