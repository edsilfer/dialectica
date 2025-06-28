import { ColorTokens } from './types'
import { spacing, typography } from './common.js'

const lightColors: ColorTokens = {
  colorPrimary: '#ffffff',
  borderBg: '#e1e4e8',
  textPrimary: '#24292e',
  placeholderText: '#6a737d',
  accentColor: '#0366d6',

  // Tooltip
  tooltipBg: '#24292e',
  tooltipText: '#ffffff',

  // File Viewer
  fileViewerHeaderBg: '#f6f8fa',
  fileViewerAddedSquareBg: '#1f883d',
  fileViewerDeletedSquareBg: '#d73a49',
  fileViwerNeutralSquareBg: '#e1e4e8',

  // Hunk Viewer
  hunkViewerBg: '#ffffff',
  hunkViewerLineAddedBg: '#dafbe1',
  hunkViewerLineNumberAddedBg: '#aceebb',
  hunkViewerLineRemovedBg: '#ffebe9',
  hunkViewerLineNumberRemovedBg: '#ffcecb',
  hunkViewerLineContextBg: '#f6f8fa',
  hunkViewerLineNumberContextBg: '#f6f8fa',
  hunkViewerLineHunkBg: '#f1f8ff',
  hunkViewerLineNumberHunkBg: '#f1f8ff',
  hunkViewerAddCommentBg: '#0366d6',

  // File Explorer
  fileExplorerBg: '#ffffff',
  fileExplorerSelectedFileBg: '#f1f8ff',
  fileExplorerlineConnectorBg: '#cacdd0',
}

const darkColors: ColorTokens = {
  colorPrimary: '#0d1117',
  borderBg: '#30363d',
  textPrimary: '#c9d1d9',
  placeholderText: '#484f58',
  accentColor: '#388bfd',

  // Tooltip
  tooltipBg: '#ffffff',
  tooltipText: '#161b22',

  // File Viewer
  fileViewerHeaderBg: '#161b22',
  fileViewerAddedSquareBg: '#238636',
  fileViewerDeletedSquareBg: '#da3633',
  fileViwerNeutralSquareBg: '#30363d',

  // Hunk Viewer
  hunkViewerBg: '#0d1117',
  hunkViewerLineAddedBg: 'rgba(46, 160, 67, 0.15)',
  hunkViewerLineNumberAddedBg: 'rgba(46, 160, 67, 0.15)',
  hunkViewerLineRemovedBg: 'rgba(248, 81, 73, 0.15)',
  hunkViewerLineNumberRemovedBg: 'rgba(248, 81, 73, 0.15)',
  hunkViewerLineContextBg: '#0d1117',
  hunkViewerLineNumberContextBg: '#0d1117',
  hunkViewerLineHunkBg: 'rgba(56, 139, 253, 0.15)',
  hunkViewerLineNumberHunkBg: 'rgba(56, 139, 253, 0.15)',
  hunkViewerAddCommentBg: '#0366d6',

  // File Explorer
  fileExplorerBg: '#0d1117',
  fileExplorerSelectedFileBg: 'rgba(56, 139, 253, 0.25)',
  fileExplorerlineConnectorBg: '#30363d',
}

const draculaColors: ColorTokens = {
  colorPrimary: '#282a36',
  borderBg: '#6272a4',
  textPrimary: '#f8f8f2',
  placeholderText: '#6272a4',
  accentColor: '#bd93f9',

  // Tooltip
  tooltipBg: '#ffffff',
  tooltipText: '#282a36',

  // File Viewer
  fileViewerHeaderBg: '#282a36',
  fileViewerAddedSquareBg: '#50fa7b',
  fileViewerDeletedSquareBg: '#ff5555',
  fileViwerNeutralSquareBg: '#44475a',

  // Hunk Viewer
  hunkViewerBg: '#282a36',
  hunkViewerLineAddedBg: 'rgba(80, 250, 123, 0.15)',
  hunkViewerLineNumberAddedBg: 'rgba(80, 250, 123, 0.15)',
  hunkViewerLineRemovedBg: 'rgba(255, 85, 85, 0.15)',
  hunkViewerLineNumberRemovedBg: 'rgba(255, 85, 85, 0.15)',
  hunkViewerLineContextBg: '#282a36',
  hunkViewerLineNumberContextBg: '#282a36',
  hunkViewerLineHunkBg: 'rgba(189, 147, 249, 0.15)',
  hunkViewerLineNumberHunkBg: 'rgba(189, 147, 249, 0.15)',
  hunkViewerAddCommentBg: '#bd93f9',

  // File Explorer
  fileExplorerBg: '#282a36',
  fileExplorerSelectedFileBg: 'rgba(189, 147, 249, 0.25)',
  fileExplorerlineConnectorBg: '#44475a',
}

const solarizedDarkColors: ColorTokens = {
  colorPrimary: '#002b36',
  borderBg: '#586e75',
  textPrimary: '#839496',
  placeholderText: '#586e75',
  accentColor: '#268bd2',
  tooltipBg: '#839496',
  tooltipText: '#002b36',

  // File Viewer
  fileViewerHeaderBg: '#002b36',
  fileViewerAddedSquareBg: '#859900',
  fileViewerDeletedSquareBg: '#dc322f',
  fileViwerNeutralSquareBg: '#073642',

  // Hunk Viewer
  hunkViewerBg: '#002b36',
  hunkViewerLineAddedBg: 'rgba(133, 153, 0, 0.15)',
  hunkViewerLineNumberAddedBg: 'rgba(133, 153, 0, 0.15)',
  hunkViewerLineRemovedBg: 'rgba(220, 50, 47, 0.15)',
  hunkViewerLineNumberRemovedBg: 'rgba(220, 50, 47, 0.15)',
  hunkViewerLineContextBg: '#002b36',
  hunkViewerLineNumberContextBg: '#002b36',
  hunkViewerLineHunkBg: 'rgba(38, 139, 210, 0.15)',
  hunkViewerLineNumberHunkBg: 'rgba(38, 139, 210, 0.15)',
  hunkViewerAddCommentBg: '#6c71c4',

  // File Explorer
  fileExplorerBg: '#002b36',
  fileExplorerSelectedFileBg: 'rgba(38, 139, 210, 0.25)',
  fileExplorerlineConnectorBg: '#073642',
}

const solarizedLightColors: ColorTokens = {
  colorPrimary: '#fdf6e3',
  borderBg: '#93a1a1',
  textPrimary: '#657b83',
  placeholderText: '#93a1a1',
  accentColor: '#268bd2',

  // Tooltip
  tooltipBg: '#657b83',
  tooltipText: '#fdf6e3',

  // File Viewer
  fileViewerHeaderBg: '#fdf6e3',
  fileViewerAddedSquareBg: '#859900',
  fileViewerDeletedSquareBg: '#dc322f',
  fileViwerNeutralSquareBg: '#eee8d5',

  // Hunk Viewer
  hunkViewerBg: '#fdf6e3',
  hunkViewerLineAddedBg: 'rgba(133, 153, 0, 0.15)',
  hunkViewerLineNumberAddedBg: 'rgba(133, 153, 0, 0.15)',
  hunkViewerLineRemovedBg: 'rgba(220, 50, 47, 0.15)',
  hunkViewerLineNumberRemovedBg: 'rgba(220, 50, 47, 0.15)',
  hunkViewerLineContextBg: '#fdf6e3',
  hunkViewerLineNumberContextBg: '#fdf6e3',
  hunkViewerLineHunkBg: 'rgba(38, 139, 210, 0.15)',
  hunkViewerLineNumberHunkBg: 'rgba(38, 139, 210, 0.15)',
  hunkViewerAddCommentBg: '#6c71c4',

  // File Explorer
  fileExplorerBg: '#fdf6e3',
  fileExplorerSelectedFileBg: 'rgba(38, 139, 210, 0.25)',
  fileExplorerlineConnectorBg: '#eee8d5',
}

export const Themes = {
  light: {
    name: 'light',
    colors: lightColors,
    spacing,
    typography,
  },
  dark: {
    name: 'dark',
    colors: darkColors,
    spacing,
    typography,
  },
  dracula: {
    name: 'dracula',
    colors: draculaColors,
    spacing,
    typography,
  },
  solarizedDark: {
    name: 'solarizedDark',
    colors: solarizedDarkColors,
    spacing,
    typography,
  },
  solarizedLight: {
    name: 'solarizedLight',
    colors: solarizedLightColors,
    spacing,
    typography,
  },
}
