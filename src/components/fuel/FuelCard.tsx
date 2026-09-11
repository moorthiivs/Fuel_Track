import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SpotlightCard } from '../reactbits/SpotlightCard'
import { Badge } from '../ui/Badge'
import { formatCurrency, formatLitres, formatDistance, formatRate, formatMileage } from '../../utils/formatters'
import type { FuelEntry } from '../../types/fuel'
import { Fuel, ChevronRight, Gauge, MapPin } from 'lucide-react'

export interface FuelCardProps {
  entry: FuelEntry
  compact?: boolean
}

export const FuelCard: React.FC<FuelCardProps> = ({ entry, compact = false }) => {
  const navigate = useNavigate()

  return (
    <SpotlightCard
      spotlightColor="rgba(16, 185, 129, 0.22)"
      borderColor="rgba(16, 185, 129, 0.4)"
      onClick={() => navigate(`/history/${entry.id}`)}
      className="p-4 group bg-slate-900/90 border-slate-800/90 hover:border-emerald-500/30 transition-all cursor-pointer active:scale-[0.99]"
    >

      <div className="flex items-start justify-between gap-3">
        {/* Left: Station & Date */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
              <Fuel className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
              {entry.stationName}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pl-0.5">
            <span>{entry.date}</span>
            {entry.time && (
              <>
                <span>•</span>
                <span>{entry.time}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Total Amount */}
        <div className="text-right shrink-0">
          <div className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
            {formatCurrency(entry.amount)}
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            {formatLitres(entry.quantity)}
          </div>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold text-slate-200">
              {formatDistance(entry.odometer)}
            </span>
          </span>

          <span className="text-slate-500">|</span>

          <span className="text-slate-400 font-medium">
            {formatRate(entry.rate)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {entry.mileage && (
            <Badge variant="emerald" size="sm">
              {formatMileage(entry.mileage)}
            </Badge>
          )}
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {!compact && entry.location && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 truncate">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{entry.location}</span>
        </div>
      )}
    </SpotlightCard>
  )
}

