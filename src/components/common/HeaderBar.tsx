import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useFuelStore } from '../../store/fuelStore'
import { ShinyText } from '../reactbits/ShinyText'
import { GeminiApiKeyModal } from './GeminiApiKeyModal'
import { geminiService } from '../../services/geminiService'

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
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false)
  const [, setForceRender] = useState(0)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  const isGeminiActive = geminiService.isConfigured()

  return (
    <>
      <header
        role="banner"
        className="sticky top-0 z-30 w-full bg-slate-950 border-b border-slate-900 px-4 py-3 shadow-md shadow-slate-950/80 shrink-0"
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
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
                  {title === 'FuelTrack' ? (
                    <ShinyText text="FuelTrack" speed={3.5} className="font-extrabold tracking-tight" />
                  ) : (
                    title
                  )}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-400 truncate">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Gemini AI Status Badge / Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsGeminiModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer select-none ${
                isGeminiActive
                  ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/35 shadow-sm shadow-purple-950/40'
                  : 'bg-slate-900 hover:bg-purple-950/40 text-slate-400 hover:text-purple-300 border border-slate-800 hover:border-purple-500/30'
              }`}
              title={
                isGeminiActive
                  ? 'Gemini 1.5 Flash Vision AI: Active. Click to manage.'
                  : 'Click to configure Gemini Flash AI API Key'
              }
              aria-label={
                isGeminiActive
                  ? 'Gemini Vision AI is active. Open settings'
                  : 'Configure Gemini API Key'
              }
            >
              {isGeminiActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Gemini AI</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  <span>AI Key</span>
                </>
              )}
            </button>

            {demoMode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Demo</span>
              </span>
            )}

            {rightAction}
          </div>
        </div>
      </header>

      <GeminiApiKeyModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onKeySaved={() => setForceRender((n) => n + 1)}
      />
    </>
  )
}


