import { ColorTokens } from '../types/theme'
import { spacing, typography } from './common.js'

const lightColors: ColorTokens = {
  borderBg: '#e1e4e8',
  textPrimary: '#24292e',
  tooltipBg: '#24292e',
  tooltipText: '#ffffff',
  fileViewerHeaderBg: '#f6f8fa',
  hunkViewerBg: '#ffffff',
  lineAddedBg: '#e6ffed',
  addedSquareBg: '#1f883d',
  deletedSquareBg: '#d73a49',
  neutralSquareBg: '#e1e4e8',
  lineRemovedBg: '#ffeef0',
  lineContextBg: '#f6f8fa',
  lineHunkBg: '#f1f8ff',
  addCommentBg: '#0366d6',
}

const darkColors: ColorTokens = {
  borderBg: '#30363d',
  textPrimary: '#c9d1d9',
  tooltipBg: '#ffffff',
  tooltipText: '#161b22',
  fileViewerHeaderBg: '#161b22',
  hunkViewerBg: '#0d1117',
  lineAddedBg: 'rgba(46, 160, 67, 0.15)',
  addedSquareBg: '#238636',
  deletedSquareBg: '#da3633',
  neutralSquareBg: '#30363d',
  lineRemovedBg: 'rgba(248, 81, 73, 0.15)',
  lineContextBg: '#0d1117',
  lineHunkBg: 'rgba(56, 139, 253, 0.15)',
  addCommentBg: '#0366d6',
}

const draculaColors: ColorTokens = {
  borderBg: '#44475a',
  textPrimary: '#f8f8f2',
  tooltipBg: '#ffffff',
  tooltipText: '#282a36',
  fileViewerHeaderBg: '#282a36',
  hunkViewerBg: '#282a36',
  lineAddedBg: 'rgba(80, 250, 123, 0.15)',
  addedSquareBg: '#50fa7b',
  deletedSquareBg: '#ff5555',
  neutralSquareBg: '#44475a',
  lineRemovedBg: 'rgba(255, 85, 85, 0.15)',
  lineContextBg: '#282a36',
  lineHunkBg: 'rgba(189, 147, 249, 0.15)',
  addCommentBg: '#bd93f9',
}

const solarizedDarkColors: ColorTokens = {
  borderBg: '#073642',
  textPrimary: '#839496',
  tooltipBg: '#839496',
  tooltipText: '#002b36',
  fileViewerHeaderBg: '#002b36',
  hunkViewerBg: '#002b36',
  lineAddedBg: 'rgba(133, 153, 0, 0.15)',
  addedSquareBg: '#859900',
  deletedSquareBg: '#dc322f',
  neutralSquareBg: '#073642',
  lineRemovedBg: 'rgba(220, 50, 47, 0.15)',
  lineContextBg: '#002b36',
  lineHunkBg: 'rgba(38, 139, 210, 0.15)',
  addCommentBg: '#6c71c4',
}

const solarizedLightColors: ColorTokens = {
  borderBg: '#eee8d5',
  textPrimary: '#657b83',
  tooltipBg: '#657b83',
  tooltipText: '#fdf6e3',
  fileViewerHeaderBg: '#fdf6e3',
  hunkViewerBg: '#fdf6e3',
  lineAddedBg: 'rgba(133, 153, 0, 0.15)',
  addedSquareBg: '#859900',
  deletedSquareBg: '#dc322f',
  neutralSquareBg: '#eee8d5',
  lineRemovedBg: 'rgba(220, 50, 47, 0.15)',
  lineContextBg: '#fdf6e3',
  lineHunkBg: 'rgba(38, 139, 210, 0.15)',
  addCommentBg: '#6c71c4',
}

export const Themes = {
  light: {
    colors: lightColors,
    spacing,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing,
    typography,
  },
  dracula: {
    colors: draculaColors,
    spacing,
    typography,
  },
  solarizedDark: {
    colors: solarizedDarkColors,
    spacing,
    typography,
  },
  solarizedLight: {
    colors: solarizedLightColors,
    spacing,
    typography,
  },
}
