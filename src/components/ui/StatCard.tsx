import React from 'react'
import { SpotlightCard } from '../reactbits/SpotlightCard'
import { CountUp } from '../reactbits/CountUp'
import { clsx } from 'clsx'

export interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
  highlight?: boolean
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  highlight = false,
}) => {
  // Parse numeric values with prefix and suffix for React Bits CountUp
  const renderAnimatedValue = () => {
    if (typeof value === 'number') {
      return <CountUp to={value} duration={1.2} />
    }

    // Try parsing string like "₹8,450", "78.4 L", "1,420 km", "17.8 km/L"
    const match = value.trim().match(/^([^0-9.-]*)([-+]?[0-9,]+(?:\.[0-9]+)?)(.*)$/)
    if (match) {
      const prefix = match[1]
      const rawNumStr = match[2].replace(/,/g, '')
      const num = parseFloat(rawNumStr)
      const suffix = match[3]
      const decimals = rawNumStr.includes('.') ? rawNumStr.split('.')[1].length : 0

      if (!isNaN(num)) {
        return (
          <CountUp
            to={num}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            duration={1.2}
          />
        )
      }
    }

    return value
  }

  return (
    <SpotlightCard
      spotlightColor={highlight ? 'rgba(16, 185, 129, 0.28)' : 'rgba(56, 189, 248, 0.18)'}
      borderColor={highlight ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.35)'}
      className={clsx(
        'flex flex-col justify-between p-4 relative group transition-all',
        highlight
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30'
          : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400 shrink-0 border border-slate-700/60 group-hover:scale-105 transition-transform">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
          {renderAnimatedValue()}
        </div>

        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            {trend && (
              <span
                className={clsx(
                  'font-bold',
                  trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </SpotlightCard>
  )
}

