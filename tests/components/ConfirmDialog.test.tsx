import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog'

describe('ConfirmDialog Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete Record"
        message="Are you sure you want to delete this fuel record?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('renders with accessible alertdialog attributes when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Record"
        message="Are you sure you want to delete this fuel record?"
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-message')

    expect(screen.getByText('Delete Record')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this fuel record?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument()
  })

  it('triggers onConfirm when clicking the confirm button', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Reset"
        message="Reset all preferences?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('triggers onCancel when clicking cancel button or backdrop', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Reset"
        message="Reset all preferences?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    // Backdrop click
    const backdrop = screen.getByRole('alertdialog')
    fireEvent.click(backdrop)
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('closes dialog on Escape key press', () => {
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Exit"
        message="Discard unsaved changes?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('displays loading spinner and disables buttons when isLoading is true', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Deleting..."
        message="Please wait"
        isLoading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()

    // Escape does not trigger cancel while loading
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('handles keyboard Tab navigation focus trapping between buttons', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Focus Trap Test"
        message="Check tab looping"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const confirmButton = screen.getByRole('button', { name: 'Confirm' })

    // When focus is on the last button (Confirm) and user presses Tab (forward)
    confirmButton.focus()
    expect(document.activeElement).toBe(confirmButton)

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false })
    // In JSDOM event handler triggers firstElement.focus()
    expect(document.activeElement).toBe(cancelButton)

    // When focus is on the first button (Cancel) and user presses Shift+Tab (backward)
    cancelButton.focus()
    expect(document.activeElement).toBe(cancelButton)

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(confirmButton)
  })
})
