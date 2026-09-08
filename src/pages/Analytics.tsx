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
import { Card } from '../components/ui/Card'
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
import { clsx } from 'clsx'

export const Analytics: React.FC = () => {
  const fuelEntries = useFuelStore((s) => s.fuelEntries)
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M'>('3M')

  const stats = fuelService.computeDashboardStats(fuelEntries)

  // Format historical data for Recharts
  const chartData = useMemo(() => {
    const reversed = [...fuelEntries].reverse()
    return reversed.map((entry) => {
      const shortDate = entry.date.slice(5) // e.g. "08-18"
      return {
        date: shortDate,
        fullDate: entry.date,
        cost: entry.amount,
        litres: entry.quantity,
        mileage: entry.mileage || 15.2,
        odometer: entry.odometer,
        station: entry.stationName,
      }
    })
  }, [fuelEntries])

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
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

  const timeOptions: Array<{ key: '7D' | '30D' | '3M' | '6M'; label: string }> = [
    { key: '7D', label: '7 Days' },
    { key: '30D', label: '30 Days' },
    { key: '3M', label: '3 Months' },
    { key: '6M', label: '6 Months' },
  ]

  return (
    <div className="flex-1 flex flex-col pb-8">
      <HeaderBar
        title="Fuel Analytics"
        subtitle="Efficiency & Cost Intelligence"
      />

      <div className="px-4 py-4 sm:px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Time Filter Tabs */}
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
          {timeOptions.map((opt) => {
            const isActive = timeRange === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTimeRange(opt.key)}
                className={clsx(
                  'flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center',
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
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
        <Card className="p-4 space-y-3 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Fuel Spending (₹)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Expense per refill transaction</p>
            </div>
            <span className="text-xs font-black text-emerald-400">
              {formatCurrency(stats.totalCost)}
            </span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#10b981" stop-opacity={0.35} />
                    <stop offset="95%" stop-color="#10b981" stop-opacity={0.0} />
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
        </Card>

        {/* Chart 2: Mileage Trend (km/L) */}
        <Card className="p-4 space-y-3 border-slate-800">
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
                <YAxis domain={[14, 17]} stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={15.0} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: 'Target', fill: '#38bdf8', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#0284c7', strokeWidth: 1.5, stroke: '#38bdf8' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Fuel Volume Consumed (Litres) */}
        <Card className="p-4 space-y-3 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-violet-400" />
                <span>Fuel Consumption (L)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Litres purchased per session</p>
            </div>
            <span className="text-xs font-bold text-violet-400">
              {formatLitres(stats.totalLitres)}
            </span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="litres"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
