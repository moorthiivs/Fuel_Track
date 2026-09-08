import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  className?: string
  color?: string
  speed?: string
  children: React.ReactNode
}

export const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'div',
  className = '',
  color = '#10b981', // emerald-500
  speed = '4s',
  children,
  ...props
}) => {
  return (
    <Component
      className={twMerge(
        clsx(
          'relative block w-full overflow-hidden rounded-2xl p-[1px] select-none',
          className
        )
      )}
      {...props}
    >
      {/* Animated gradient spinning beam */}
      <div
        className="absolute w-[300%] h-[300%] -top-[100%] -left-[100%] rounded-full animate-spin-slow pointer-events-none opacity-80"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 360deg)`,
          animationDuration: speed,
        }}
      />
      {/* Inner Content with background */}
      <div className="relative z-10 w-full h-full rounded-[15px] bg-slate-950 overflow-hidden flex">
        {children}
      </div>
    </Component>
  )
}
