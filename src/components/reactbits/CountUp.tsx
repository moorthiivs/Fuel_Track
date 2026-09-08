import React, { useEffect, useState, useRef } from 'react'

export interface CountUpProps {
  to: number
  from?: number
  duration?: number // in seconds
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
  className?: string
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
}) => {
  const [currentValue, setCurrentValue] = useState<number>(from)
  const currentValRef = useRef<number>(from)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    let animationFrameId: number
    const startVal = currentValRef.current
    const endVal = to
    const durationMs = duration * 1000

    startTimeRef.current = null

    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / durationMs, 1)
      const easedProgress = easeOutExpo(progress)
      const nextValue = startVal + (endVal - startVal) * easedProgress

      currentValRef.current = nextValue
      setCurrentValue(nextValue)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        currentValRef.current = endVal
        setCurrentValue(endVal)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [to, duration])


  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const [intPart, decPart] = fixed.split('.')
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
  }

  return (
    <span className={className}>
      {prefix}
      {formatNumber(currentValue)}
      {suffix}
    </span>
  )
}
