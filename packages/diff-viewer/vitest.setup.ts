import '@testing-library/jest-dom/vitest'
import { setupBeforeEach, setupGlobalTestMocks } from './src/test/setup'

// Run global setup before all tests
setupGlobalTestMocks()
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
