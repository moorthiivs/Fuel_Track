import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { getConfidenceBadgeProps } from '../../utils/formatters'
import { ShinyText } from '../reactbits/ShinyText'
import { clsx } from 'clsx'

export interface ConfidenceBadgeProps {
  score: number
  showIcon?: boolean
  onClick?: () => void
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  showIcon = true,
  onClick,
}) => {
  const { color, label, needsVerification } = getConfidenceBadgeProps(score)

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all',
        color,
        onClick && 'hover:brightness-110 cursor-pointer active:scale-95'
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
        <ShinyText text={label} speed={2.5} className="text-emerald-300 font-bold" />
      ) : (
        <span>{label}</span>
      )}
    </button>
  )
}

