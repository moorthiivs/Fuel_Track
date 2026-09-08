import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFuelStore } from '../store/fuelStore'
import { fuelService } from '../services/fuelService'
import {
  formatCurrency,
  formatLitres,
  formatDistance,
  formatMileage,
  getGreeting,
} from '../utils/formatters'
import { HeaderBar } from '../components/common/HeaderBar'
import { SpotlightCard } from '../components/reactbits/SpotlightCard'
import { ShinyText } from '../components/reactbits/ShinyText'
import { DecryptedText } from '../components/reactbits/DecryptedText'
import { StarBorder } from '../components/reactbits/StarBorder'
import { ClickSpark } from '../components/reactbits/ClickSpark'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { FuelCard } from '../components/fuel/FuelCard'
import {
  Car,
  Fuel,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const activeVehicle = useFuelStore((s) => s.getActiveVehicle())
  const fuelEntries = useFuelStore((s) => s.fuelEntries)

  const stats = fuelService.computeDashboardStats(fuelEntries)
  const recentEntries = fuelEntries.slice(0, 3)
  const greeting = getGreeting()

  return (
    <ClickSpark sparkColor="#10b981" sparkCount={6} className="w-full min-h-full flex flex-col pb-8">
      <HeaderBar
        title="FuelTrack"
        subtitle="Automatic 2-Photo Logging"
      />

      <div className="px-4 py-4 sm:px-6 space-y-5 max-w-md mx-auto w-full">
        {/* User Greeting */}
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Dashboard
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <span>{greeting}</span>
            <span>👋</span>
          </h2>
          <p className="text-xs text-slate-400">
            Track fuel expenses and mileage with <ShinyText text="2 quick photos" speed={3} className="text-emerald-300 font-semibold" />.
          </p>
        </div>

        {/* My Vehicle Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              My Vehicle
            </span>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              Switch Vehicle
            </button>
          </div>

          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.25)"
            borderColor="rgba(16, 185, 129, 0.45)"
            className="p-5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30 relative overflow-hidden group cursor-pointer shadow-lg shadow-emerald-950/20"
            onClick={() => navigate('/profile')}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold tracking-wide uppercase">
                  <Car className="w-3.5 h-3.5" />
                  <DecryptedText
                    text={activeVehicle.vehicleNumber}
                    speed={30}
                    maxIterations={8}
                    encryptedClassName="text-teal-300 font-bold"
                  />
                </div>
                <h3 className="text-base font-extrabold text-slate-100 pt-1">
                  {activeVehicle.makeModel}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {activeVehicle.fuelType}
                  </span>
                  <span>•</span>
                  <span>Odometer: {formatDistance(stats.lastOdometer || activeVehicle.currentOdometer)}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Fuel className="w-6 h-6" />
              </div>
            </div>

            {/* Quick Vehicle Health Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[11px] text-slate-400">Current Mileage</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {formatMileage(stats.averageMileage)}
                </div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-[11px] text-slate-400">Last Fuel</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {recentEntries[0]?.date ? '05 Sep' : '--'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">This Month</div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(stats.totalCost)}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Statistics 2x2 Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Performance Statistics
            </span>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Trends</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Fuel Cost"
              value={formatCurrency(stats.totalCost)}
              subtext="Total logged"
              icon={<TrendingUp className="w-4 h-4" />}
              highlight
            />
            <StatCard
              label="Fuel Used"
              value={formatLitres(stats.totalLitres)}
              subtext="8 fill-ups"
              icon={<Fuel className="w-4 h-4" />}
            />
            <StatCard
              label="Distance"
              value={formatDistance(stats.totalDistance)}
              subtext="Tracked odometers"
              icon={<MapPin className="w-4 h-4" />}
            />
            <StatCard
              label="Avg Mileage"
              value={formatMileage(stats.averageMileage)}
              subtext="Estimated efficiency"
              icon={<Car className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Prominent "+ Add Fuel" CTA Card with StarBorder */}
        <div className="pt-1">
          <StarBorder speed="3s" color="#10b981" className="w-full">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/add-fuel')}
              leftIcon={<Plus className="w-5 h-5 stroke-[2.5]" />}
              className="py-4 shadow-xl shadow-emerald-500/25 text-base w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
            >
              + Add Fuel Entry (2 Photos)
            </Button>
          </StarBorder>
        </div>


        {/* Recent Fuel Entries */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recent Fuel Entries
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({fuelEntries.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentEntries.length > 0 ? (
            <div className="space-y-2.5">
              {recentEntries.map((entry) => (
                <FuelCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 space-y-2">
              <Fuel className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">
                No fuel records logged yet
              </p>
              <p className="text-xs text-slate-500">
                Tap "+ Add Fuel" to take 2 photos and log your first fill-up.
              </p>
            </div>
          )}
        </div>
      </div>
    </ClickSpark>
  )
}

