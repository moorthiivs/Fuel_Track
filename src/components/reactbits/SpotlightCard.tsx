import React, { useRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  borderColor?: string
  size?: number
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(16, 185, 129, 0.16)', // Emerald glow default
  borderColor = 'rgba(16, 185, 129, 0.35)',
  size = 320,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -size, y: -size })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current) return
      const rect = divRef.current.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setOpacity(1)
    },
    []
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!divRef.current || e.touches.length === 0) return
      const touch = e.touches[0]
      const rect = divRef.current.getBoundingClientRect()
      setPosition({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
      setOpacity(1)
    },
    []
  )

  const handleMouseEnter = useCallback(() => {
    setOpacity(1)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setOpacity(0)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setOpacity(0)
  }, [])

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTouchEnd}
      className={twMerge(
        clsx(
          'relative rounded-2xl border border-slate-800/80 bg-slate-900/90 overflow-hidden transition-all duration-300',
          className
        )
      )}
      {...props}
    >
      {/* Spotlight Radial Glow inside card */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* Border Spotlight Glow Accent */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl border"
        style={{
          opacity: opacity * 0.75,
          borderColor,
          maskImage: `radial-gradient(${size * 0.7}px circle at ${position.x}px ${position.y}px, black, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(${size * 0.7}px circle at ${position.x}px ${position.y}px, black, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
