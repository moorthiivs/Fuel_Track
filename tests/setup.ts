import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock matchMedia for responsive UI tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  // Mock ResizeObserver for Recharts ResponsiveContainer
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mock canvas-confetti to prevent JSDOM canvas getContext error
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))
