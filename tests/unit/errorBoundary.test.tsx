import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary'

// Component that conditionally throws an error
const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test exploding component')
  }
  return <div>Healthy Child Content</div>
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error during throwing test
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders normal children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Healthy Child Content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('catches render error and displays the fallback alert UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload application/i })).toBeInTheDocument()
  })

  it('supports custom fallback node', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error View</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom Error View')
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('resets error state when clicking "Try Again"', () => {
    let throwError = true
    const DynamicChild = () => {
      if (throwError) throw new Error('First attempt failed')
      return <div>Recovered Component</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Fix the error condition and click Try Again
    throwError = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    // Re-render and verify recovery
    rerender(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('Recovered Component')).toBeInTheDocument()
  })

  it('calls window.location.reload when clicking "Reload Application"', () => {
    const originalLocation = window.location
    const reloadMock = vi.fn()

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, reload: reloadMock },
    })

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /reload application/i }))
    expect(reloadMock).toHaveBeenCalledTimes(1)

    // Restore original window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })
})
