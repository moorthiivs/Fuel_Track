import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive' | 'accent'
  noPadding?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  noPadding = false,
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-900/90 border border-slate-800/80 shadow-sm',
    elevated: 'bg-slate-900 border border-slate-800 shadow-xl shadow-black/30',
    glass: 'bg-slate-900/60 backdrop-blur-md border border-slate-800/60',
    interactive:
      'bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer shadow-sm',
    accent:
      'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 shadow-lg shadow-emerald-950/20',
  }

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl overflow-hidden transition-all',
          variants[variant],
          !noPadding && 'p-4 sm:p-5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  )
}
