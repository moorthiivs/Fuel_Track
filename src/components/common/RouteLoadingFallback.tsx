import React from 'react'

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh] text-slate-400 space-y-4 animate-pulse"
    >
      <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-slate-300">Loading...</p>
        <p className="text-xs text-slate-500">Preparing your FuelTrack view</p>
      </div>
      <span className="sr-only">Loading page content...</span>
    </div>
  )
}
