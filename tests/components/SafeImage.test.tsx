import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SafeImage } from '../../src/components/common/SafeImage'

describe('SafeImage Component', () => {
  it('renders img element with lazy loading attribute and provided alt text', () => {
    render(<SafeImage src="https://example.com/photo.jpg" alt="Test Fuel Receipt" />)

    const img = screen.getByAltText('Test Fuel Receipt')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('renders fallback immediately when src is empty or undefined', () => {
    render(<SafeImage src="" alt="Empty Receipt" />)

    const fallback = screen.getByRole('img', { name: /empty receipt \(photo unavailable\)/i })
    expect(fallback).toBeInTheDocument()
    expect(screen.getByText('Photo unavailable')).toBeInTheDocument()
    expect(screen.getByText('Image file could not be loaded')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Empty Receipt' })).toBeNull()
  })

  it('switches to fallback when image load encounters an error', () => {
    render(<SafeImage src="/corrupt-image.jpg" alt="Damaged Meter Reading" fallbackText="Corrupt file" />)

    const img = screen.getByAltText('Damaged Meter Reading')
    expect(img).toBeInTheDocument()

    // Trigger onError
    fireEvent.error(img)

    // img should be replaced by fallback container
    expect(screen.queryByAltText('Damaged Meter Reading')).not.toBeInTheDocument()
    const fallback = screen.getByRole('img', { name: /damaged meter reading \(corrupt file\)/i })
    expect(fallback).toBeInTheDocument()
    expect(screen.getByText('Corrupt file')).toBeInTheDocument()
  })

  it('removes loading overlay when onLoad fires', () => {
    render(<SafeImage src="/valid-photo.jpg" alt="Valid Meter" />)

    const img = screen.getByAltText('Valid Meter')
    expect(img).toHaveClass('opacity-0')

    fireEvent.load(img)
    expect(img).toHaveClass('opacity-100')
  })
})
