import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate' | 'violet'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700/80',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 border leading-none',
          variants[variant],
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  )
}
