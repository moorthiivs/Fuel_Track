import React, { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { HeaderBar } from '../components/common/HeaderBar'
import { StatCard } from '../components/ui/StatCard'

import { useFuelStore } from '../store/fuelStore'
import { fuelService } from '../services/fuelService'
import {
  formatCurrency,
  formatLitres,
  formatDistance,
  formatMileage,
} from '../utils/formatters'
import { TrendingUp, Fuel, MapPin, Gauge, BarChart2 } from 'lucide-react'
import { SpotlightCard } from '../components/reactbits/SpotlightCard'
import { ClickSpark } from '../components/reactbits/ClickSpark'
import { ShinyText } from '../components/reactbits/ShinyText'
import { clsx } from 'clsx'

// Custom Dark Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md">
        <div className="font-bold text-slate-200">{item.fullDate}</div>
        <div className="text-emerald-400 font-semibold">
          {formatCurrency(item.cost)} • {formatLitres(item.litres)}
        </div>
        <div className="text-sky-400 font-medium">
          Mileage: {formatMileage(item.mileage)}
        </div>
        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
          {item.station}
        </div>
      </div>
    )
  }
  return null
}

export const Analytics: React.FC = () => {
  const fuelEntries = useFuelStore((s) => s.fuelEntries)
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M'>('3M')

  // Filter entries based on selected timeRange
  const filteredEntries = useMemo(() => {
    if (!fuelEntries || fuelEntries.length === 0) return []

    // Sort entries descending to find the reference date (latest entry date or now)
    const sorted = [...fuelEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const referenceDateStr = sorted[0]?.date || '2026-09-05'
    const latestDate = new Date(referenceDateStr)

    const daysMap = { '7D': 7, '30D': 30, '3M': 90, '6M': 180 }
    const days = daysMap[timeRange] || 90
    const cutoffDate = new Date(latestDate.getTime() - days * 24 * 60 * 60 * 1000)

    const matches = sorted.filter((entry) => {
      const entryDate = new Date(entry.date)
      return !isNaN(entryDate.getTime()) && entryDate >= cutoffDate
    })

    return matches.length > 0 ? matches : sorted
  }, [fuelEntries, timeRange])

  const stats = useMemo(
    () => fuelService.computeDashboardStats(filteredEntries),
    [filteredEntries]
  )

  // Format filtered historical data for Recharts (chronological order)
  const chartData = useMemo(() => {
    const ascending = [...filteredEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return ascending.map((entry) => {
      const shortDate = entry.date.slice(5) // e.g. "08-18"
      return {
        date: shortDate,
        fullDate: entry.date,
        cost: entry.amount,
        litres: entry.quantity,
        mileage:
          entry.mileage && entry.mileage > 0
            ? entry.mileage
            : entry.distance && entry.quantity > 0
              ? Number((entry.distance / entry.quantity).toFixed(2))
              : 0,
        odometer: entry.odometer,
        station: entry.stationName,
      }
    })
  }, [filteredEntries])


  const timeOptions: Array<{ key: '7D' | '30D' | '3M' | '6M'; label: string }> = [
    { key: '7D', label: '7 Days' },
    { key: '30D', label: '30 Days' },
    { key: '3M', label: '3 Months' },
    { key: '6M', label: '6 Months' },
  ]

  return (
    <ClickSpark sparkColor="#38bdf8" sparkCount={6} className="w-full min-h-full flex flex-col pb-8">
      <HeaderBar
        title="Fuel Analytics"
        subtitle="Efficiency & Cost Intelligence"
      />

      <div className="px-4 py-4 sm:px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Time Filter Tabs */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner gap-1">
          {timeOptions.map((opt) => {
            const isActive = timeRange === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTimeRange(opt.key)}
                className={clsx(
                  'flex-1 py-2 sm:py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer text-center select-none active:scale-95 flex items-center justify-center',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* 4 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Avg Mileage"
            value={formatMileage(stats.averageMileage)}
            subtext="+0.4 km/L vs last month"
            icon={<Gauge className="w-4 h-4" />}
            highlight
          />
          <StatCard
            label="Monthly Cost"
            value={formatCurrency(stats.totalCost)}
            subtext="Within budget"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <StatCard
            label="Fuel Volume"
            value={formatLitres(stats.totalLitres)}
            subtext="8 Total fills"
            icon={<Fuel className="w-4 h-4" />}
          />
          <StatCard
            label="Distance"
            value={formatDistance(stats.totalDistance)}
            subtext="Tracked mileage"
            icon={<MapPin className="w-4 h-4" />}
          />
        </div>

        {/* Chart 1: Fuel Spending Over Time */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.2)"
          borderColor="rgba(16, 185, 129, 0.35)"
          className="p-4 space-y-3 bg-slate-900/90 border-slate-800 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Fuel Spending (₹)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Expense per refill transaction</p>
            </div>
            <span className="text-xs font-black text-emerald-400">
              <ShinyText text={formatCurrency(stats.totalCost)} speed={3} className="text-emerald-400 font-black" />
            </span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Chart 2: Mileage Trend (km/L) */}
        <SpotlightCard
          spotlightColor="rgba(56, 189, 248, 0.2)"
          borderColor="rgba(56, 189, 248, 0.35)"
          className="p-4 space-y-3 bg-slate-900/90 border-slate-800 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span>Mileage Curve (km/L)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Fuel economy between fill-ups</p>
            </div>
            <span className="text-xs font-bold text-sky-400">
              Target: 15.0 km/L
            </span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={15.0} stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ fill: '#38bdf8', r: 3.5, strokeWidth: 1.5, stroke: '#0f172a' }}
                  activeDot={{ r: 5, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Chart 3: Litres Filled by Station */}
        <SpotlightCard
          spotlightColor="rgba(168, 85, 247, 0.16)"
          borderColor="rgba(168, 85, 247, 0.3)"
          className="p-4 space-y-3 bg-slate-900/90 border-slate-800 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span>Fuel Volume Per Fill (L)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Station dispense comparison</p>
            </div>
            <span className="text-xs font-bold text-purple-400">
              {formatLitres(stats.totalLitres)} Total
            </span>
          </div>

          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="litres" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>
    </ClickSpark>
  )
}
