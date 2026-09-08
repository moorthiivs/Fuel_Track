import React from 'react'
import { Card } from './Card'
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
  return (
    <Card
      variant={highlight ? 'accent' : 'default'}
      className="flex flex-col justify-between p-4 relative group hover:border-slate-700 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400 shrink-0 border border-slate-700/60">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
          {value}
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
    </Card>
  )
}
