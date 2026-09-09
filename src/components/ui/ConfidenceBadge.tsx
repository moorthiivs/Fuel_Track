import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { getConfidenceBadgeProps } from '../../utils/formatters'
import { ShinyText } from '../reactbits/ShinyText'
import { clsx } from 'clsx'

export interface ConfidenceBadgeProps {
  score: number
  showIcon?: boolean
  compact?: boolean
  onClick?: () => void
  className?: string
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  showIcon = true,
  compact = false,
  onClick,
  className,
}) => {
  const { color, label, compactLabel, needsVerification } = getConfidenceBadgeProps(score)
  const displayLabel = compact ? compactLabel : label

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      e.stopPropagation()
      onClick()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${score}% confidence${needsVerification ? ' - Please verify' : ''}`}
      aria-label={`${score}% confidence${needsVerification ? ' - Please verify' : ''}`}
      className={clsx(
        'inline-flex items-center rounded-full font-semibold border transition-all whitespace-nowrap shrink-0',
        compact
          ? 'gap-1 px-2 py-0.5 text-[10.5px]'
          : 'gap-1.5 px-2.5 py-0.5 text-[11px]',
        color,
        onClick && 'hover:brightness-110 cursor-pointer active:scale-95',
        className
      )}
    >
      {showIcon && (
        needsVerification ? (
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        )
      )}
      {score >= 90 ? (
        <ShinyText
          text={displayLabel}
          speed={2.5}
          className={clsx(
            'font-bold whitespace-nowrap',
            score >= 95 ? 'text-emerald-300' : 'text-sky-300'
          )}
        />
      ) : (
        <span className="whitespace-nowrap">{displayLabel}</span>
      )}
    </button>
  )
}

