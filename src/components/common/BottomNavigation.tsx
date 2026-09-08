import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, History, BarChart3, User, Plus } from 'lucide-react'
import { clsx } from 'clsx'

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Hide bottom navigation on full-screen capture and processing wizard steps
  const isCaptureFlow =
    location.pathname.startsWith('/add-fuel/meter') ||
    location.pathname.startsWith('/add-fuel/vehicle') ||
    location.pathname.startsWith('/add-fuel/processing')

  if (isCaptureFlow) return null

  return (
    <nav
      aria-label="Bottom Navigation"
      className="sticky bottom-0 inset-x-0 z-40 shrink-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 sm:py-2.5"
      style={{ paddingBottom: 'calc(0.5rem + var(--sab))' }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all select-none',
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Home</span>
        </NavLink>

        {/* History */}
        <NavLink
          to="/history"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all select-none',
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          <History className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">History</span>
        </NavLink>

        {/* Floating Center Primary Action: Add Fuel */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => navigate('/add-fuel')}
            aria-label="Add Fuel"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-slate-950 active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer animate-pulse-ring"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[11px] font-bold text-emerald-400 mt-1">
            Add Fuel
          </span>
        </div>

        {/* Analytics */}
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all select-none',
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Analytics</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all select-none',
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Profile</span>
        </NavLink>
      </div>
    </nav>
  )
}
