/**
 * Lightens a hex color by a given percentage.
 *
 * @param hex     - The hex color to lighten.
 * @param percent - The percentage to lighten the color by.
 * @returns         The lightened hex color.
 */
export function lighten(hex: string, percent: number): string {
  return adjustColor(hex, percent, true)
}

/**
 * Darkens a hex color by a given percentage.
 *
 * @param hex     - The hex color to darken.
 * @param percent - The percentage to darken the color by.
 * @returns         The darkened hex color.
 */
export function darken(hex: string, percent: number): string {
  return adjustColor(hex, percent, false)
}

/**
 * Normalizes a hex color string to 6-digit format without the leading '#'.
 */
function normalizeHex(hex: string): string {
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return hex.toLowerCase()
}

/**
 * Adjusts a hex color by a percentage, either lightening or darkening it
 * while preserving the original hue and saturation. Internally the color
 * is converted to the HSL space and only the lightness channel is changed.
 */
function adjustColor(hex: string, percent: number, lighten = true): string {
  const normalized = normalizeHex(hex)

  // Convert HEX → RGB (0-255)
  const num = parseInt(normalized, 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff

  // RGB → HSL conversion (r, g, b in [0, 1])
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)
        break
      case gNorm:
        h = (bNorm - rNorm) / delta + 2
        break
      case bNorm:
        h = (rNorm - gNorm) / delta + 4
        break
    }

    h /= 6
  }

  // Adjust lightness
  const lightnessDelta = percent / 100
  const newL = lighten ? Math.min(1, l + lightnessDelta) : Math.max(0, l - lightnessDelta)

  // HSL → RGB conversion helpers
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  let rOut: number, gOut: number, bOut: number

  if (s === 0) {
    // Achromatic
    rOut = gOut = bOut = newL
  } else {
    const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s
    const p = 2 * newL - q
    rOut = hue2rgb(p, q, h + 1 / 3)
    gOut = hue2rgb(p, q, h)
    bOut = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`
}

/**
 * Alpha-blends a foreground hex colour over a background hex colour and
 * returns the resulting fully-opaque colour (hex string).
 *
 * @param fg     – Foreground / overlay colour.
 * @param bg     – Background colour.
 * @param alpha  – Opacity of the foreground colour in the range 0-1.
 */
export function blend(fg: string, bg: string, alpha = 0.25): string {
  const toRgb = (hex: string) => {
    hex = hex.replace('#', '')
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    }
    const int = parseInt(hex, 16)
    return {
      r: (int >> 16) & 0xff,
      g: (int >> 8) & 0xff,
      b: int & 0xff,
    }
  }

  const toHex = (v: number) => v.toString(16).padStart(2, '0')

  const fgRgb = toRgb(fg)
  const bgRgb = toRgb(bg)

  const r = Math.round(fgRgb.r * alpha + bgRgb.r * (1 - alpha))
  const g = Math.round(fgRgb.g * alpha + bgRgb.g * (1 - alpha))
  const b = Math.round(fgRgb.b * alpha + bgRgb.b * (1 - alpha))

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Converts a hex colour to an "r, g, b" string (no #, no alpha).
 */
export function hexToRgb(hex: string): string {
  const norm = normalizeHex(hex)
  const r = parseInt(norm.slice(0, 2), 16)
  const g = parseInt(norm.slice(2, 4), 16)
  const b = parseInt(norm.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/**
 * Returns an rgba() string with the given alpha from a hex colour.
 */
export function transparentize(hex: string, alpha = 0.15): string {
  return `rgba(${hexToRgb(hex)}, ${alpha})`
}
