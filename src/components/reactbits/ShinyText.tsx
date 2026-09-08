import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
}) => {
  const animationDuration = `${speed}s`

  return (
    <span
      className={twMerge(
        clsx(
          'inline-block bg-clip-text text-transparent bg-gradient-to-r',
          disabled
            ? 'text-slate-300'
            : 'from-slate-300 via-white to-slate-400 animate-shine font-bold',
          className
        )
      )}
      style={{
        backgroundImage: disabled
          ? undefined
          : 'linear-gradient(120deg, rgba(226, 232, 240, 0.7) 0%, rgba(255, 255, 255, 1) 50%, rgba(226, 232, 240, 0.7) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration,
      }}
    >
      {text}
    </span>
  )
}
