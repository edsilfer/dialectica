import { describe, it, expect } from 'vitest'
import { lighten, darken, blend, hexToRgb, transparentize, ensureContrast } from './color-utils'

const parseHexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

describe('lighten', () => {
  it('given red color, when lightened by 20%, expect lighter red', () => {
    // GIVEN
    const darkRed = '#cc0000'
    const percent = 20

    // WHEN
    const result = lighten(darkRed, percent)
    const original = parseHexToRgb(darkRed)
    const lightened = parseHexToRgb(result)

    // EXPECT
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
    expect(lightened.r).toBeGreaterThan(original.r)
  })

  it('given dark color, when lightened by 50%, expect significantly lighter color', () => {
    // GIVEN
    const darkGray = '#333333'
    const percent = 50

    // WHEN
    const result = lighten(darkGray, percent)
    const original = parseHexToRgb(darkGray)
    const lightened = parseHexToRgb(result)

    // EXPECT
    expect(lightened.r).toBeGreaterThan(original.r)
    expect(lightened.g).toBeGreaterThan(original.g)
    expect(lightened.b).toBeGreaterThan(original.b)
  })

  it('given any color, when lightened by 0%, expect same color', () => {
    // GIVEN
    const color = '#4a90e2'
    const percent = 0

    // WHEN
    const result = lighten(color, percent)

    // EXPECT
    expect(result).toBe(color)
  })

  it('given white color, when lightened by any amount, expect white color', () => {
    // GIVEN
    const white = '#ffffff'
    const percent = 50

    // WHEN
    const result = lighten(white, percent)

    // EXPECT
    expect(result).toBe('#ffffff')
  })

  it('given any color, when lightened by 100%, expect very light color', () => {
    // GIVEN
    const color = '#123456'
    const percent = 100

    // WHEN
    const result = lighten(color, percent)
    const lightened = parseHexToRgb(result)

    // EXPECT
    expect(lightened.r).toBeGreaterThanOrEqual(200)
    expect(lightened.g).toBeGreaterThanOrEqual(200)
    expect(lightened.b).toBeGreaterThanOrEqual(200)
  })
})

describe('darken', () => {
  it('given light color, when darkened by 30%, expect darker color', () => {
    // GIVEN
    const lightBlue = '#87ceeb'
    const percent = 30

    // WHEN
    const result = darken(lightBlue, percent)
    const original = parseHexToRgb(lightBlue)
    const darkened = parseHexToRgb(result)

    // EXPECT
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
    expect(darkened.r).toBeLessThan(original.r)
    expect(darkened.g).toBeLessThan(original.g)
    expect(darkened.b).toBeLessThan(original.b)
  })

  it('given any color, when darkened by 0%, expect same color', () => {
    // GIVEN
    const color = '#ff6b6b'
    const percent = 0

    // WHEN
    const result = darken(color, percent)

    // EXPECT
    expect(result).toBe(color)
  })

  it('given black color, when darkened by any amount, expect black color', () => {
    // GIVEN
    const black = '#000000'
    const percent = 40

    // WHEN
    const result = darken(black, percent)

    // EXPECT
    expect(result).toBe('#000000')
  })

  it('given any color, when darkened by 100%, expect very dark color', () => {
    // GIVEN
    const color = '#abcdef'
    const percent = 100

    // WHEN
    const result = darken(color, percent)
    const darkened = parseHexToRgb(result)

    // EXPECT
    expect(darkened.r).toBeLessThanOrEqual(50)
    expect(darkened.g).toBeLessThanOrEqual(50)
    expect(darkened.b).toBeLessThanOrEqual(50)
  })
})

describe('blend', () => {
  it('given two colors, when blended with default alpha, expect intermediate color', () => {
    // GIVEN
    const red = '#ff0000'
    const blue = '#0000ff'

    // WHEN
    const result = blend(red, blue)
    const blended = parseHexToRgb(result)

    // EXPECT
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
    expect(blended.r).toBeGreaterThan(0)
    expect(blended.r).toBeLessThan(255)
    expect(blended.b).toBeGreaterThan(0)
    expect(blended.b).toBeLessThan(255)
  })

  it('given two colors, when blended with alpha 0.5, expect 50/50 mix', () => {
    // GIVEN
    const white = '#ffffff'
    const black = '#000000'
    const alpha = 0.5

    // WHEN
    const result = blend(white, black, alpha)
    const blended = parseHexToRgb(result)

    // EXPECT
    expect(blended.r).toBeCloseTo(128, 1)
    expect(blended.g).toBeCloseTo(128, 1)
    expect(blended.b).toBeCloseTo(128, 1)
  })

  it('given two colors, when blended with alpha 0, expect background color', () => {
    // GIVEN
    const foreground = '#ff0000'
    const background = '#00ff00'
    const alpha = 0

    // WHEN
    const result = blend(foreground, background, alpha)

    // EXPECT
    expect(result).toBe(background)
  })

  it('given two colors, when blended with alpha 1, expect foreground color', () => {
    // GIVEN
    const foreground = '#ff0000'
    const background = '#00ff00'
    const alpha = 1

    // WHEN
    const result = blend(foreground, background, alpha)

    // EXPECT
    expect(result).toBe(foreground)
  })
})

describe('hexToRgb', () => {
  it('given 6-digit hex with hash, when converted, expect correct RGB string', () => {
    // GIVEN
    const hex = '#ff6b35'

    // WHEN
    const result = hexToRgb(hex)

    // EXPECT
    expect(result).toBe('255, 107, 53')
  })

  it('given 6-digit hex without hash, when converted, expect correct RGB string', () => {
    // GIVEN
    const hex = 'ff6b35'

    // WHEN
    const result = hexToRgb(hex)

    // EXPECT
    expect(result).toBe('255, 107, 53')
  })

  it('given 3-digit hex, when converted, expect expanded RGB string', () => {
    // GIVEN
    const hex = '#f60'

    // WHEN
    const result = hexToRgb(hex)

    // EXPECT
    expect(result).toBe('255, 102, 0')
  })

  it('given white color, when converted, expect max RGB values', () => {
    // GIVEN
    const hex = '#ffffff'

    // WHEN
    const result = hexToRgb(hex)

    // EXPECT
    expect(result).toBe('255, 255, 255')
  })

  it('given black color, when converted, expect zero RGB values', () => {
    // GIVEN
    const hex = '#000000'

    // WHEN
    const result = hexToRgb(hex)

    // EXPECT
    expect(result).toBe('0, 0, 0')
  })
})

describe('transparentize', () => {
  it('given hex color, when transparentized with default alpha, expect rgba string', () => {
    // GIVEN
    const hex = '#ff6b35'

    // WHEN
    const result = transparentize(hex)

    // EXPECT
    expect(result).toBe('rgba(255, 107, 53, 0.15)')
  })

  it('given hex color, when transparentized with custom alpha, expect rgba with custom alpha', () => {
    // GIVEN
    const hex = '#4a90e2'
    const alpha = 0.7

    // WHEN
    const result = transparentize(hex, alpha)

    // EXPECT
    expect(result).toBe('rgba(74, 144, 226, 0.7)')
  })

  it('given 3-digit hex, when transparentized, expect expanded rgba string', () => {
    // GIVEN
    const hex = '#f60'
    const alpha = 0.8

    // WHEN
    const result = transparentize(hex, alpha)

    // EXPECT
    expect(result).toBe('rgba(255, 102, 0, 0.8)')
  })
})

describe('ensureContrast', () => {
  it('given high contrast colors, when checking contrast, expect original foreground', () => {
    // GIVEN
    const foreground = '#000000'
    const background = '#ffffff'
    const minContrast = 4.5

    // WHEN
    const result = ensureContrast(foreground, background, minContrast)

    // EXPECT
    expect(result).toBe(foreground)
  })

  it('given low contrast colors, when ensuring contrast, expect adjusted color', () => {
    // GIVEN
    const foreground = '#cccccc'
    const background = '#ffffff'
    const minContrast = 3.0

    // WHEN
    const result = ensureContrast(foreground, background, minContrast)
    const original = parseHexToRgb(foreground)
    const adjusted = parseHexToRgb(result)

    // EXPECT
    expect(result).not.toBe(foreground)
    expect(adjusted.r).toBeLessThan(original.r)
    expect(adjusted.g).toBeLessThan(original.g)
    expect(adjusted.b).toBeLessThan(original.b)
  })

  it('given similar colors, when ensuring high contrast, expect significantly different color', () => {
    // GIVEN
    const foreground = '#666666'
    const background = '#777777'
    const minContrast = 4.5

    // WHEN
    const result = ensureContrast(foreground, background, minContrast)

    // EXPECT
    expect(result).not.toBe(foreground)
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })
})
