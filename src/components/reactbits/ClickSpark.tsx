import React, { useRef, useEffect } from 'react'

export interface ClickSparkProps {
  children: React.ReactNode
  sparkColor?: string
  sparkCount?: number
  sparkDuration?: number
  className?: string
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
}

export const ClickSpark: React.FC<ClickSparkProps> = ({
  children,
  sparkColor = '#34d399', // emerald-400
  sparkCount = 8,
  sparkDuration = 400,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparksRef = useRef<Spark[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const updateSparks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      sparksRef.current = sparksRef.current.filter((spark) => {
        spark.x += spark.vx
        spark.y += spark.vy
        spark.alpha -= 1 / (sparkDuration / 16)

        if (spark.alpha <= 0) return false

        ctx.save()
        ctx.beginPath()
        ctx.arc(spark.x, spark.y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = spark.color
        ctx.globalAlpha = Math.max(0, spark.alpha)
        ctx.shadowColor = sparkColor
        ctx.shadowBlur = 4
        ctx.fill()
        ctx.restore()

        return true
      })

      if (sparksRef.current.length > 0) {
        animationFrameId = requestAnimationFrame(updateSparks)
      }
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY

      if (clientX === undefined || clientY === undefined) return

      const x = clientX - rect.left
      const y = clientY - rect.top

      const colors = [sparkColor, '#10b981', '#6ee7b7', '#f8fafc']

      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5
        const speed = 1.8 + Math.random() * 2.2
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }

      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateSparks)
    }

    const parent = canvas.parentElement
    if (parent) {
      const resize = () => {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
      resize()

      let ro: ResizeObserver | null = null
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(resize)
        ro.observe(parent)
      } else {
        window.addEventListener('resize', resize)
      }

      parent.addEventListener('click', handleClick as EventListener)

      return () => {
        if (ro) {
          ro.disconnect()
        } else {
          window.removeEventListener('resize', resize)
        }
        parent.removeEventListener('click', handleClick as EventListener)
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [sparkColor, sparkCount, sparkDuration])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
      />
      {children}
    </div>
  )
}
