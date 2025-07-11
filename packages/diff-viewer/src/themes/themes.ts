import { blend, darken, ensureContrast, lighten, transparentize } from '../utils/color-utils'
import { ColorTokens, SpacingTokens, TypographyTokens } from './types'

export const spacing: SpacingTokens = {
  xxs: '0.125rem', // 2px
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
}

export const typography: TypographyTokens = {
  regularFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  regularFontSize: 13,
  regularFontSizeSM: 11,
  codeFontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
  codeFontSize: 13,
  codeLineHeight: 1.2,
}

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
  vscodeDark: {
    border: '#3c3c3c',
    accent: '#007acc',
    backgroundPrimary: '#1e1e1e',
    backgroundContainer: '#252526',
    textPrimary: '#d4d4d4',
    textContainerPlaceholder: '#808080',
    textPrimaryPlaceholder: '#808080',
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

  const tint = (hex: string) => (isDarkPalette ? transparentize(hex, CODE_ALPHA) : blend(hex, '#ffffff', 0.15))

  // Line-number columns must stay opaque for sticky scroll; we pre-blend
  const numberBg = (hex: string) =>
    isDarkPalette ? blend(hex, palette.backgroundPrimary, CODE_ALPHA) : blend(hex, '#ffffff', 0.25)

  // Helper for elements that need strong contrast (like file icons)
  const contrastColor = (hex: string, background: string = palette.backgroundPrimary) =>
    ensureContrast(hex, background, 3.0)

  return {
    // Common Tokens__________________________________________________________
    ...palette,

    hover: lighten(palette.accent, 10),
    hoverContainer: lighten(palette.backgroundContainer, 10),

    // File Diff Viewer Tokens_______________________________________________
    fileViewerHeaderBg: isDarkPalette ? palette.backgroundContainer : palette.backgroundPrimary,
    fileViewerAddedSquareBg: isDarkPalette ? contrastColor(STATUS.added) : contrastColor(darken(STATUS.added, 10)),
    fileViewerDeletedSquareBg: isDarkPalette
      ? contrastColor(STATUS.removed)
      : contrastColor(darken(STATUS.removed, 10)),
    fileViewerModifiedSquareBg: isDarkPalette
      ? contrastColor(STATUS.modified)
      : contrastColor(darken(STATUS.modified, 10)),
    fileViwerNeutralSquareBg: isDarkPalette ? contrastColor(STATUS.neutral) : contrastColor(darken(STATUS.neutral, 10)),

    // Hunk Diff Viewer Tokens_______________________________________________
    hunkViewerBg: palette.backgroundPrimary,
    hunkViewerLineAddedBg: tint(STATUS.added),
    hunkViewerLineNumberAddedBg: numberBg(STATUS.added),
    hunkViewerLineRemovedBg: tint(STATUS.removed),
    hunkViewerLineNumberRemovedBg: numberBg(STATUS.removed),
    hunkViewerLineContextBg: palette.backgroundPrimary,
    hunkViewerLineNumberContextBg: palette.backgroundPrimary,
    hunkViewerLineHunkBg: tint(STATUS.hunk),
    hunkViewerLineNumberHunkBg: numberBg(STATUS.hunk),
    hunkViewerLineEmptyBg: isDarkPalette
      ? blend('#000000', palette.backgroundPrimary, 0.1)
      : lighten(palette.border, 15),
    hunkViewerLineNumberEmptyBg: isDarkPalette
      ? blend('#000000', palette.backgroundPrimary, 0.1)
      : lighten(palette.border, 15),
    hunkViewerAddCommentBg: palette.accent,

    // File Explorer Tokens___________________________________________________
    fileExplorerBg: palette.backgroundPrimary,
    fileExplorerSelectedFileBg: isDarkPalette
      ? ensureContrast(blend(STATUS.hunk, palette.backgroundPrimary, SIDEBAR_ALPHA), palette.backgroundPrimary, 2.0)
      : ensureContrast(lighten(STATUS.hunk, 55), palette.backgroundPrimary, 2.0),
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
  vscodeDark: {
    name: 'vscodeDark',
    colors: createThemeColors(LEAD_THEME_COLORS.vscodeDark),
    spacing,
    typography,
  },
}
