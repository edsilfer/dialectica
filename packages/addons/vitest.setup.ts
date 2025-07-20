import '@testing-library/jest-dom/vitest'

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
