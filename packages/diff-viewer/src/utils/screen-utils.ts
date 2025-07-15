/**
 * Screen size breakpoints and constants used throughout the application
 */

/**
 * Breakpoint for determining panel width behavior
 * - MacBook 14" and smaller screens (≤1600px): Use larger panel width
 * - Larger screens (>1600px): Use smaller panel width
 */
export const MACBOOK_14_WIDTH = 1600

/**
 * Comment width constants for different screen sizes
 */
export const COMMENT_WIDTHS = {
  SMALL_SCREEN: {
    MIN_WIDTH_PX: 530,
    MAX_WIDTH_PX: 1000,
  },
  LARGE_SCREEN: {
    MIN_WIDTH_PX: 750,
    MAX_WIDTH_PX: 1000,
  },
} as const
