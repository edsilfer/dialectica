import '@testing-library/jest-dom/vitest'

// Mock ResizeObserver for components that use it
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})
