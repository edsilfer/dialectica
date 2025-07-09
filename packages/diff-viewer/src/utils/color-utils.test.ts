import { describe, it, expect } from 'vitest'
import { lighten, darken, blend, hexToRgb, transparentize, ensureContrast } from './color-utils'
import {
  parseHexToRgb,
  LIGHTEN_TEST_CASES,
  DARKEN_TEST_CASES,
  BLEND_TEST_CASES,
  STANDARD_COLORS,
  COLOR_CONVERSION_TEST_CASES,
} from './test/__fixtures__/color-fixtures'

describe('lighten', () => {
  LIGHTEN_TEST_CASES.forEach(({ input, percent, description, expectBrighter, expectSame, expectVeryLight }) => {
    it(`given ${description}, when lightened by ${percent}%, expect correct result`, () => {
      // GIVEN
      const originalColor = input

      // WHEN
      const result = lighten(originalColor, percent)
      const original = parseHexToRgb(originalColor)
      const lightened = parseHexToRgb(result)

      // EXPECT
      expect(result).toMatch(/^#[0-9a-f]{6}$/)

      if (expectSame) {
        expect(result).toBe(originalColor)
      } else if (expectBrighter) {
        expect(lightened.r).toBeGreaterThan(original.r)
        expect(lightened.g).toBeGreaterThan(original.g)
        expect(lightened.b).toBeGreaterThan(original.b)
      } else if (expectVeryLight) {
        expect(lightened.r).toBeGreaterThanOrEqual(200)
        expect(lightened.g).toBeGreaterThanOrEqual(200)
        expect(lightened.b).toBeGreaterThanOrEqual(200)
      }
    })
  })

  it('given white color, when lightened by any amount, expect white color', () => {
    // GIVEN
    const white = STANDARD_COLORS.WHITE
    const percent = 50

    // WHEN
    const result = lighten(white, percent)

    // EXPECT
    expect(result).toBe(STANDARD_COLORS.WHITE)
  })
})

describe('darken', () => {
  DARKEN_TEST_CASES.forEach(({ input, percent, description, expectDarker, expectSame, expectVeryDark }) => {
    it(`given ${description}, when darkened by ${percent}%, expect correct result`, () => {
      // GIVEN
      const originalColor = input

      // WHEN
      const result = darken(originalColor, percent)
      const original = parseHexToRgb(originalColor)
      const darkened = parseHexToRgb(result)

      // EXPECT
      expect(result).toMatch(/^#[0-9a-f]{6}$/)

      if (expectSame) {
        expect(result).toBe(originalColor)
      } else if (expectDarker) {
        expect(darkened.r).toBeLessThan(original.r)
        expect(darkened.g).toBeLessThan(original.g)
        expect(darkened.b).toBeLessThan(original.b)
      } else if (expectVeryDark) {
        expect(darkened.r).toBeLessThanOrEqual(50)
        expect(darkened.g).toBeLessThanOrEqual(50)
        expect(darkened.b).toBeLessThanOrEqual(50)
      }
    })
  })

  it('given black color, when darkened by any amount, expect black color', () => {
    // GIVEN
    const black = STANDARD_COLORS.BLACK
    const percent = 40

    // WHEN
    const result = darken(black, percent)

    // EXPECT
    expect(result).toBe(STANDARD_COLORS.BLACK)
  })
})

describe('blend', () => {
  BLEND_TEST_CASES.forEach(
    ({
      foreground,
      background,
      alpha,
      description,
      expectIntermediate,
      expectedResult,
      expectBackground,
      expectForeground,
    }) => {
      it(`given ${description}, when blended, expect correct result`, () => {
        // WHEN
        const result = blend(foreground, background, alpha)

        // EXPECT
        expect(result).toMatch(/^#[0-9a-f]{6}$/)

        if (expectBackground) {
          expect(result).toBe(background)
        } else if (expectForeground) {
          expect(result).toBe(foreground)
        } else if (expectedResult) {
          const blended = parseHexToRgb(result)
          expect(blended.r).toBeCloseTo(expectedResult.r, 1)
          expect(blended.g).toBeCloseTo(expectedResult.g, 1)
          expect(blended.b).toBeCloseTo(expectedResult.b, 1)
        } else if (expectIntermediate) {
          const blended = parseHexToRgb(result)
          expect(blended.r).toBeGreaterThan(0)
          expect(blended.r).toBeLessThan(255)
          expect(blended.b).toBeGreaterThan(0)
          expect(blended.b).toBeLessThan(255)
        }
      })
    },
  )
})

describe('hexToRgb', () => {
  COLOR_CONVERSION_TEST_CASES.forEach(({ input, expected, description }) => {
    it(`given ${description}, when converted to RGB, expect correct values`, () => {
      // WHEN
      const result = hexToRgb(input)

      // EXPECT
      expect(result).toBe(expected)
    })
  })

  it('given hex color without hash, when converted, expect correct RGB', () => {
    // GIVEN
    const hexWithoutHash = 'ff0000'
    const expected = '255, 0, 0'

    // WHEN
    const result = hexToRgb(hexWithoutHash)

    // EXPECT
    expect(result).toBe(expected)
  })
})

describe('transparentize', () => {
  it('given color and alpha, when transparentized, expect rgba format', () => {
    // GIVEN
    const color = STANDARD_COLORS.RED
    const alpha = 0.5

    // WHEN
    const result = transparentize(color, alpha)

    // EXPECT
    expect(result).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('given color with alpha 1, when transparentized, expect full opacity', () => {
    // GIVEN
    const color = STANDARD_COLORS.BLUE
    const alpha = 1

    // WHEN
    const result = transparentize(color, alpha)

    // EXPECT
    expect(result).toBe('rgba(0, 0, 255, 1)')
  })
})

describe('ensureContrast', () => {
  it('given light color on light background, when ensuring contrast, expect darker foreground', () => {
    // GIVEN
    const foreground = STANDARD_COLORS.LIGHT_GRAY
    const background = STANDARD_COLORS.WHITE

    // WHEN
    const result = ensureContrast(foreground, background)

    // EXPECT
    const resultRgb = parseHexToRgb(result)
    const originalRgb = parseHexToRgb(foreground)
    expect(resultRgb.r).toBeLessThan(originalRgb.r)
    expect(resultRgb.g).toBeLessThan(originalRgb.g)
    expect(resultRgb.b).toBeLessThan(originalRgb.b)
  })

  it('given dark color on dark background, when ensuring contrast, expect lighter foreground', () => {
    // GIVEN
    const foreground = STANDARD_COLORS.DARK_GRAY
    const background = STANDARD_COLORS.BLACK

    // WHEN
    const result = ensureContrast(foreground, background)

    // EXPECT
    const resultRgb = parseHexToRgb(result)
    const originalRgb = parseHexToRgb(foreground)
    expect(resultRgb.r).toBeGreaterThan(originalRgb.r)
    expect(resultRgb.g).toBeGreaterThan(originalRgb.g)
    expect(resultRgb.b).toBeGreaterThan(originalRgb.b)
  })
})
