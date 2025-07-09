/**
 * Color testing fixtures and utilities
 */

export interface RgbColor {
  r: number
  g: number
  b: number
}

export interface ColorTestCase {
  input: string
  expected: string // hexToRgb returns string, not object
  description: string
}

/**
 * Parses a hex color string to RGB components (returns object for test utilities)
 */
export const parseHexToRgb = (hex: string): RgbColor => {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

/**
 * Test cases for color conversion and manipulation
 */
export const COLOR_CONVERSION_TEST_CASES: ColorTestCase[] = [
  {
    input: '#cc0000',
    expected: '204, 0, 0',
    description: 'pure red color',
  },
  {
    input: '#00ff00',
    expected: '0, 255, 0',
    description: 'pure green color',
  },
  {
    input: '#0000ff',
    expected: '0, 0, 255',
    description: 'pure blue color',
  },
  {
    input: '#ffffff',
    expected: '255, 255, 255',
    description: 'white color',
  },
  {
    input: '#000000',
    expected: '0, 0, 0',
    description: 'black color',
  },
  {
    input: '#333333',
    expected: '51, 51, 51',
    description: 'dark gray color',
  },
  {
    input: '#87ceeb',
    expected: '135, 206, 235',
    description: 'sky blue color',
  },
]

/**
 * Test cases for lighten function
 */
export const LIGHTEN_TEST_CASES = [
  {
    input: '#cc0000',
    percent: 20,
    description: 'red color lightened by 20%',
    expectBrighter: true,
  },
  {
    input: '#333333',
    percent: 50,
    description: 'dark gray lightened by 50%',
    expectBrighter: true,
  },
  {
    input: '#4a90e2',
    percent: 0,
    description: 'any color lightened by 0%',
    expectSame: true,
  },
  {
    input: '#ffffff',
    percent: 50,
    description: 'white color lightened by any amount',
    expectSame: true,
  },
  {
    input: '#123456',
    percent: 100,
    description: 'any color lightened by 100%',
    expectVeryLight: true,
  },
]

/**
 * Test cases for darken function
 */
export const DARKEN_TEST_CASES = [
  {
    input: '#87ceeb',
    percent: 30,
    description: 'light blue darkened by 30%',
    expectDarker: true,
  },
  {
    input: '#ff6b6b',
    percent: 0,
    description: 'any color darkened by 0%',
    expectSame: true,
  },
  {
    input: '#000000',
    percent: 40,
    description: 'black color darkened by any amount',
    expectSame: true,
  },
  {
    input: '#abcdef',
    percent: 100,
    description: 'any color darkened by 100%',
    expectVeryDark: true,
  },
]

/**
 * Test cases for blend function
 */
export const BLEND_TEST_CASES = [
  {
    foreground: '#ff0000',
    background: '#0000ff',
    alpha: undefined,
    description: 'red and blue with default alpha',
    expectIntermediate: true,
  },
  {
    foreground: '#ffffff',
    background: '#000000',
    alpha: 0.5,
    description: 'white and black with 50% alpha',
    expectedResult: { r: 128, g: 128, b: 128 },
  },
  {
    foreground: '#ff0000',
    background: '#00ff00',
    alpha: 0,
    description: 'any colors with 0% alpha',
    expectBackground: true,
  },
  {
    foreground: '#ff0000',
    background: '#00ff00',
    alpha: 1,
    description: 'any colors with 100% alpha',
    expectForeground: true,
  },
]

/**
 * Standard color constants for testing
 */
export const STANDARD_COLORS = {
  RED: '#ff0000',
  GREEN: '#00ff00',
  BLUE: '#0000ff',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: '#808080',
  DARK_GRAY: '#333333',
  LIGHT_GRAY: '#cccccc',
} as const
