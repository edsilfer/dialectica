export interface ColorTokens {
  // Common Tokens_______________________________________
  /** The base background color of the theme */
  backgroundPrimary: string
  /** The accent color of the theme */
  accent: string
  /** The hover color of the accent color */
  hover: string
  /** The hover color of the container background */
  hoverContainer: string
  /** The background color for any elevated elements (modals, popovers, etc.) */
  backgroundContainer: string

  /** The primary text color */
  textPrimary: string
  /** The placeholder text color */
  textPrimaryPlaceholder: string
  /** The placeholder text color for container elements */
  textContainerPlaceholder: string

  /** The background color of all borders */
  border: string

  // File Diff Viewer Tokens_____________________________
  /** The background color of the file diff header */
  fileViewerHeaderBg: string
  /** The background color of the added square */
  fileViewerAddedSquareBg: string
  /** The background color of the deleted square */
  fileViewerDeletedSquareBg: string
  /** The background color of the modified square */
  fileViewerModifiedSquareBg: string
  /** The background color of the neutral square */
  fileViwerNeutralSquareBg: string

  // Hunk Diff Viewer Tokens_____________________________
  /** The background color of the hunk viewer (code block) */
  hunkViewerBg: string
  /** The background color of added lines */
  hunkViewerLineAddedBg: string
  /** The background color of the line number of added lines */
  hunkViewerLineNumberAddedBg: string
  /** The background color of removed lines */
  hunkViewerLineRemovedBg: string
  /** The background color of the line number of removed lines */
  hunkViewerLineNumberRemovedBg: string
  /** The background color of context lines */
  hunkViewerLineContextBg: string
  /** The background color of the line number of context lines */
  hunkViewerLineNumberContextBg: string
  /** The background color of the hunk line */
  hunkViewerLineHunkBg: string
  /** The background color of the line number of hunk lines */
  hunkViewerLineNumberHunkBg: string
  /** The background color of empty lines (null lines in split view) */
  hunkViewerLineEmptyBg: string
  /** The background color of the line number of empty lines */
  hunkViewerLineNumberEmptyBg: string
  /** The background color of the add comment button */
  hunkViewerAddCommentBg: string

  // File Explorer Tokens_____________________________
  /** The background color of the file explorer */
  fileExplorerBg: string
  /** The background color of the selected file */
  fileExplorerSelectedFileBg: string
  /** The background color of the line connector */
  fileExplorerlineConnectorBg: string
}
export interface SpacingTokens {
  /** The smallest spacing */
  xxs: string
  /** The extra small spacing */
  xs: string
  /** The small spacing */
  sm: string
  /** The medium spacing */
  md: string
  /** The large spacing */
  lg: string
  /** The extra extra large spacing */
  xl: string
}

export interface TypographyTokens {
  /** The font family of the regular text */
  regularFontFamily: string
  /** The font size of the regular text */
  regularFontSize: number
  /** The font size of the regular text */
  regularFontSizeSM: number
  /** The font family of the code text */
  codeFontFamily: string
  /** The font size of the code text */
  codeFontSize: number
  /** The line height of the code text */
  codeLineHeight: number
}

export interface ThemeTokens {
  /** The flavor of the theme */
  flavor: 'light' | 'dark'
  /** The name of the theme */
  name: string
  /** The colors of the theme */
  colors: ColorTokens
  /** The spacing of the theme */
  spacing: SpacingTokens
  /** The typography of the theme */
  typography: TypographyTokens
}
