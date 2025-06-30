import { blend, darken, lighten, transparentize } from './color-utils'
import { spacing, typography } from './common.js'
import { ColorTokens } from './types'

const LEAD_THEME_COLORS = {
  statusColors: {
    added: '#2ea043',
    removed: '#f85149',
    modified: '#9d6507',
    hunk: '#388bfd',
    neutral: '#6e7781',
  },

  light: {
    border: '#cacdd0',
    accent: '#0366d6',
    backgroundPrimary: '#ffffff',
    backgroundContainer: '#f6f8fa',
    textPrimary: '#24292e',
    textContainerPlaceholder: '#6a737d',
    textPrimaryPlaceholder: '#6a737d',
  },
  dark: {
    border: '#30363d',
    accent: '#388bfd',
    backgroundPrimary: '#0d1117',
    backgroundContainer: '#161b22',
    textPrimary: '#c9d1d9',
    textContainerPlaceholder: '#8b949e',
    textPrimaryPlaceholder: '#8b949e',
  },
  dracula: {
    border: '#6272a4',
    accent: '#bd93f9',
    backgroundPrimary: '#282a36',
    backgroundContainer: '#44475a',
    textPrimary: '#f8f8f2',
    textContainerPlaceholder: '#6272a4',
    textPrimaryPlaceholder: '#6272a4',
  },
  solarizedDark: {
    border: '#30363d',
    accent: '#2aa198',
    backgroundPrimary: '#002b36',
    backgroundContainer: '#073642',
    textPrimary: '#839496',
    textContainerPlaceholder: '#586e75',
    textPrimaryPlaceholder: '#839496',
  },
  solarizedLight: {
    border: '#93a1a1',
    accent: '#2aa198',
    backgroundPrimary: '#fdf6e3',
    backgroundContainer: '#eee8d5',
    textPrimary: '#657b83',
    textContainerPlaceholder: '#93a1a1',
    textPrimaryPlaceholder: '#93a1a1',
  },
} as const

type ThemeVariantKeys = Exclude<keyof typeof LEAD_THEME_COLORS, 'statusColors'>
type ThemePalette = (typeof LEAD_THEME_COLORS)[ThemeVariantKeys]
const STATUS = LEAD_THEME_COLORS.statusColors

const createThemeColors = (palette: ThemePalette): ColorTokens => {
  // Helpers --------------------------------------------------------------
  const isDarkPalette = (() => {
    const hex = palette.backgroundPrimary.replace('#', '')
    const int = parseInt(hex, 16)
    const r = (int >> 16) & 0xff
    const g = (int >> 8) & 0xff
    const b = int & 0xff
    // Perceived luminance formula
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    return luma < 128
  })()

  // GitHub uses a 15 % translucent overlay for diff lines in dark themes
  const CODE_ALPHA = 0.15
  const SIDEBAR_ALPHA = 0.25

  const tint = (hex: string) => (isDarkPalette ? transparentize(hex, CODE_ALPHA) : lighten(hex, 45))

  // Line-number columns must stay opaque for sticky scroll; we pre-blend
  const numberBg = (hex: string) =>
    isDarkPalette ? blend(hex, palette.backgroundPrimary, CODE_ALPHA) : darken(lighten(hex, 45), 10)

  return {
    // Common Tokens__________________________________________________________
    ...palette,

    hover: lighten(palette.accent, 10),
    hoverContainer: lighten(palette.backgroundContainer, 10),

    // File Diff Viewer Tokens_______________________________________________
    fileViewerHeaderBg: isDarkPalette ? palette.backgroundContainer : palette.backgroundPrimary,
    fileViewerAddedSquareBg: isDarkPalette ? tint(STATUS.added) : darken(STATUS.added, 10),
    fileViewerDeletedSquareBg: isDarkPalette ? tint(STATUS.removed) : darken(STATUS.removed, 10),
    fileViewerModifiedSquareBg: isDarkPalette ? tint(STATUS.modified) : darken(STATUS.modified, 10),
    fileViwerNeutralSquareBg: isDarkPalette ? tint(STATUS.neutral) : darken(STATUS.neutral, 10),

    // Hunk Diff Viewer Tokens_______________________________________________
    hunkViewerBg: palette.backgroundPrimary,
    hunkViewerLineAddedBg: tint(STATUS.added),
    hunkViewerLineNumberAddedBg: numberBg(STATUS.added),
    hunkViewerLineRemovedBg: tint(STATUS.removed),
    hunkViewerLineNumberRemovedBg: numberBg(STATUS.removed),
    hunkViewerLineContextBg: palette.backgroundPrimary,
    hunkViewerLineNumberContextBg: palette.backgroundPrimary,
    hunkViewerLineHunkBg: isDarkPalette
      ? numberBg(STATUS.hunk)
      : blend(STATUS.hunk, palette.backgroundPrimary, CODE_ALPHA),
    hunkViewerLineNumberHunkBg: isDarkPalette
      ? numberBg(STATUS.hunk)
      : blend(STATUS.hunk, palette.backgroundPrimary, CODE_ALPHA),
    hunkViewerLineEmptyBg: isDarkPalette
      ? blend('#000000', palette.backgroundPrimary, 0.1)
      : lighten(palette.border, 15),
    hunkViewerLineNumberEmptyBg: isDarkPalette
      ? blend('#000000', palette.backgroundPrimary, 0.1)
      : lighten(palette.border, 15),
    hunkViewerAddCommentBg: palette.accent,

    // File Explorer Tokens___________________________________________________
    fileExplorerBg: palette.backgroundPrimary,
    fileExplorerSelectedFileBg: isDarkPalette ? transparentize(STATUS.hunk, SIDEBAR_ALPHA) : lighten(STATUS.hunk, 55),
    fileExplorerlineConnectorBg: palette.border,
  }
}

export const Themes = {
  light: {
    name: 'light',
    colors: createThemeColors(LEAD_THEME_COLORS.light),
    spacing,
    typography,
  },
  dark: {
    name: 'dark',
    colors: createThemeColors(LEAD_THEME_COLORS.dark),
    spacing,
    typography,
  },
  dracula: {
    name: 'dracula',
    colors: createThemeColors(LEAD_THEME_COLORS.dracula),
    spacing,
    typography,
  },
  solarizedDark: {
    name: 'solarizedDark',
    colors: createThemeColors(LEAD_THEME_COLORS.solarizedDark),
    spacing,
    typography,
  },
  solarizedLight: {
    name: 'solarizedLight',
    colors: createThemeColors(LEAD_THEME_COLORS.solarizedLight),
    spacing,
    typography,
  },
}
