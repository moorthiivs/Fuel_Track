import React, { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { clsx } from 'clsx'

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string
  containerClassName?: string
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Fuel proof photo',
  className,
  containerClassName,
  fallbackText = 'Photo unavailable',
  ...props
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const isInvalidSource = !src || src.trim() === ''

  if (hasError || isInvalidSource) {
    return (
      <div
        role="img"
        aria-label={`${alt} (${fallbackText})`}
        className={clsx(
          'w-full h-full min-h-35 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 text-center rounded-2xl select-none',
          containerClassName
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
          <ImageOff className="w-5 h-5 text-slate-500" />
        </div>
        <span className="text-xs font-semibold text-slate-400">{fallbackText}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">Image file could not be loaded</span>
      </div>
    )
  }

  return (
    <div className={clsx('relative w-full h-full overflow-hidden', containerClassName)}>
      {isLoading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center"
        >
          <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        className={clsx(
          className,
          isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'
        )}
        {...props}
      />
    </div>
  )
}
