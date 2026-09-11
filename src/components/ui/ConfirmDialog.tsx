import React, { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const titleId = 'confirm-dialog-title'
  const messageId = 'confirm-dialog-message'

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'

      // Focus the cancel button initially for safe destructive operations
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          e.preventDefault()
          onCancel()
          return
        }

        // Focus trap between Cancel and Confirm buttons
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled])'
          )
          if (focusableElements.length === 0) return

          const firstElement = focusableElements[0]
          const lastElement = focusableElements[focusableElements.length - 1]

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
        // Restore focus to previous triggering element
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={clsx(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg',
              variant === 'danger'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-rose-500/10'
                : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-amber-500/10'
            )}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-bold text-slate-100 tracking-tight">
              {title}
            </h2>
            <p id={messageId} className="text-xs text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 min-h-11 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 active:scale-95 text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-slate-700 text-center"
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'flex-1 min-h-11 py-2.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer text-center active:scale-95 shadow-lg flex items-center justify-center gap-2',
              variant === 'danger'
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20 disabled:bg-rose-900 disabled:text-slate-400'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 disabled:bg-emerald-900 disabled:text-slate-400'
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
