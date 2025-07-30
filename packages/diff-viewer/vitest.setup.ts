import '@testing-library/jest-dom/vitest'
import { setupBeforeEach } from './src/utils/test/setup'

setupBeforeEach()

// Mock SVG getBBox method for tooltip positioning in tests
Object.defineProperty(SVGElement.prototype, 'getBBox', {
  value: () => ({
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  }),
  writable: true,
})

// Mock ResizeObserver for components that use it
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})
