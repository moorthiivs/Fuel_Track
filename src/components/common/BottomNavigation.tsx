import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, History, BarChart3, User, Plus } from 'lucide-react'
import { ClickSpark } from '../reactbits/ClickSpark'
import { clsx } from 'clsx'

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Hide bottom navigation on all Add Fuel wizard screens (including review)
  const isCaptureFlow = location.pathname.startsWith('/add-fuel')

  if (isCaptureFlow) return null

  return (
    <nav
      aria-label="Bottom Navigation"
      className="sticky bottom-0 inset-x-0 z-40 shrink-0 bg-slate-950 border-t border-slate-900 px-4 py-2 sm:py-2.5 shadow-2xl shadow-emerald-950/20"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))' }}
    >
      <ClickSpark sparkColor="#10b981" sparkCount={6}>
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          {/* Home */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center min-h-11 min-w-11 gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 select-none active:scale-95',
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              )
            }
          >
            <Home className="w-5 h-5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
            <span className="text-[11px] tracking-tight">Home</span>
          </NavLink>

          {/* History */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center min-h-11 min-w-11 gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 select-none active:scale-95',
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              )
            }
          >
            <History className="w-5 h-5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
            <span className="text-[11px] tracking-tight">History</span>
          </NavLink>

          {/* Floating Center Primary Action: Add Fuel */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={() => navigate('/add-fuel')}
              aria-label="Add Fuel"
              className="w-14 h-14 rounded-full bg-linear-to-tr from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/50 border-4 border-slate-950 active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer animate-pulse-ring"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
            <span className="text-[11px] font-extrabold text-emerald-400 mt-1">
              Add Fuel
            </span>
          </div>

          {/* Analytics */}
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center min-h-11 min-w-11 gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 select-none active:scale-95',
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              )
            }
          >
            <BarChart3 className="w-5 h-5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
            <span className="text-[11px] tracking-tight">Analytics</span>
          </NavLink>

          {/* Profile */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center min-h-11 min-w-11 gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 select-none active:scale-95',
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              )
            }
          >
            <User className="w-5 h-5 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
            <span className="text-[11px] tracking-tight">Profile</span>
          </NavLink>
        </div>
      </ClickSpark>
    </nav>
  )
}

