import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNavigation } from '../components/common/BottomNavigation'
import { Smartphone, Monitor, Signal, Wifi, Battery } from 'lucide-react'
import { clsx } from 'clsx'

export const MobileLayout: React.FC = () => {
  const [devicePreview, setDevicePreview] = useState<boolean>(true)
  const location = useLocation()

  // Dynamic status bar clock for desktop preview only
  const timeString = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-start selection:bg-emerald-500 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      {/* Desktop Helper Toolbar (Hidden completely on mobile devices and APK) */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-4xl px-6 py-2 my-2 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            FuelTrack Mobile Preview
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Desktop View</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDevicePreview(true)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer',
              devicePreview
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Frame</span>
          </button>
          <button
            type="button"
            onClick={() => setDevicePreview(false)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer',
              !devicePreview
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Responsive Max</span>
          </button>
        </div>
      </div>

      {/* Main Container - Full 100% viewport on mobile devices, phone bezel on desktop */}
      <main
        className={clsx(
          'w-full flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300',
          devicePreview
            ? 'lg:max-w-[420px] lg:my-2 lg:h-[860px] lg:max-h-[90vh] lg:rounded-[44px] lg:border-[10px] lg:border-slate-800 lg:shadow-2xl lg:shadow-emerald-950/30'
            : 'max-w-md'
        )}
      >
        {/* Fake Status Bar ONLY shown on Desktop Mockup frame (HIDDEN on Mobile/APK where native Android status bar is present) */}
        <div className="hidden lg:flex shrink-0 bg-slate-950 text-slate-300 px-6 pt-3 pb-1.5 items-center justify-between text-xs font-semibold select-none z-50 border-b border-slate-900">
          <span>{timeString}</span>
          {/* Dynamic Island Pill */}
          <div className="w-24 h-4 rounded-full bg-slate-900 border border-slate-800/80" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Scrollable Page Body: takes available vertical height, scrolls smoothly */}
        <div
          key={location.pathname}
          className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <Outlet />
        </div>

        {/* Bottom Navigation: ALWAYS pinned at bottom of viewport */}
        <BottomNavigation />
      </main>
    </div>
  )
}
