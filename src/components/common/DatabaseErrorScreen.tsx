import React from 'react'
import { Database, RefreshCw, AlertCircle } from 'lucide-react'

export interface DatabaseErrorScreenProps {
  errorMessage?: string | null
  onRetry: () => void
  isRetrying?: boolean
}

export const DatabaseErrorScreen: React.FC<DatabaseErrorScreenProps> = ({
  errorMessage,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
          <Database className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Database Initialization Failed
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            FuelTrack could not initialize local SQLite storage. Your device may be out of storage or required permissions were denied.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left flex items-start gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-mono text-[11px] break-all">{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full min-h-12 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 active:scale-95 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying Initialization...' : 'Retry Database Setup'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
