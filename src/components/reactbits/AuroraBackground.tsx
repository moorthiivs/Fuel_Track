import React from 'react'
import { clsx } from 'clsx'

export interface AuroraBackgroundProps {
  children?: React.ReactNode
  className?: string
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'relative flex flex-col w-full min-h-0 overflow-hidden bg-slate-950',
        className
      )}
    >
      {/* Aurora Ambient Shifting Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] rounded-full bg-emerald-500/10 blur-[90px] animate-aurora-1" />
        <div className="absolute top-[10%] -right-[15%] w-[60vw] h-[60vw] max-w-[450px] max-h-[450px] rounded-full bg-teal-500/8 blur-[100px] animate-aurora-2" />
        <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-cyan-500/6 blur-[110px] animate-aurora-3" />
      </div>

      <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  )
}
