import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { geminiService } from '../../services/geminiService'
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Cpu,
  Loader2,
} from 'lucide-react'

export interface GeminiApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onKeySaved?: () => void
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState(() => geminiService.getApiKey())
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setTestStatus({ type: 'error', message: 'Please enter a valid Gemini API key.' })
      return
    }

    setIsTesting(true)
    setTestStatus({ type: null, message: '' })

    const result = await geminiService.testApiKey(trimmed)
    setIsTesting(false)

    if (result.success) {
      geminiService.setApiKey(trimmed)
      setTestStatus({
        type: 'success',
        message: result.message || 'Verified & Connected to Gemini 2.0 Flash (Turbo)!',
      })
      onKeySaved?.()
      setTimeout(() => {
        onClose()
      }, 1200)
    } else {
      setTestStatus({
        type: 'error',
        message: result.message || 'Verification failed. Please check the key.',
      })
    }
  }

  const handleRemoveKey = () => {
    if (window.confirm('Remove saved Gemini API Key and switch to local offline mode?')) {
      geminiService.removeApiKey()
      setApiKey('')
      setTestStatus({ type: null, message: '' })
      onKeySaved?.()
    }
  }

  const isConfigured = geminiService.isConfigured()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gemini AI Vision Engine">
      <div className="space-y-4 text-slate-200 pb-3">
        {/* Banner with Glowing Gradient */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-purple-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Google Gemini 2.0 Flash (Turbo Speed)</span>
            </div>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Not Set
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Multimodal vision AI delivers 99%+ reading accuracy on motorcycle & car TFT displays,
            digital segment numbers, trip meters, and fuel dispenser amounts.
          </p>
        </div>

        {/* API Key Form */}
        <form onSubmit={handleTestAndSave} className="space-y-3.5">
          <div>
            <label
              htmlFor="gemini-key-input"
              className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                Gemini API Key
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Stored locally on your device
              </span>
            </label>

            <div className="relative">
              <input
                id="gemini-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Status Feedback Alert */}
          {testStatus.type && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
                testStatus.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
              role="alert"
            >
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{testStatus.message}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {isConfigured && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemoveKey}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                className="text-xs text-rose-300 hover:bg-rose-950/40 border-rose-900/40"
              >
                Clear
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs ml-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isTesting || !apiKey.trim()}
              leftIcon={
                isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )
              }
              className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 border-none"
            >
              {isTesting ? 'Verifying...' : 'Test & Save Key'}
            </Button>
          </div>
        </form>

        {/* Free API Key Guide Helper */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200 block">
                Don't have an API key?
              </span>
              <p className="text-[11px] text-slate-400">
                Get a free Google Gemini key in 1 minute.
              </p>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-colors shrink-0"
            >
              <span>Get Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Fallback Notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center text-center pt-1">
          <Cpu className="w-3.5 h-3.5" />
          <span>Local on-device OCR is used automatically if offline</span>
        </div>
      </div>
    </Modal>
  )
}
