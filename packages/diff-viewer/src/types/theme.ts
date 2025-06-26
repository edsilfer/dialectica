export interface ColorTokens {
  // Common Tokens_______________________________________
  /** The background color of all borders */
  borderBg: string
  /** The primary text color */
  textPrimary: string
  /** The background color of the tooltip */
  tooltipBg: string
  /** The text color of the tooltip */
  tooltipText: string

  // File Diff Viewer Tokens_____________________________
  /** The background color of the file diff header */
  fileViewerHeaderBg: string
  /** The background color of the added square */
  addedSquareBg: string
  /** The background color of the deleted square */
  deletedSquareBg: string
  /** The background color of the neutral square */
  neutralSquareBg: string

  // Hunk Diff Viewer Tokens_____________________________
  /** The background color of the hunk viewer (code block) */
  hunkViewerBg: string
  /** The background color of added lines */
  lineAddedBg: string
  /** The background color of removed lines */
  lineRemovedBg: string
  /** The background color of context lines */
  lineContextBg: string
  /** The background color of the hunk line */
  lineHunkBg: string
  /** The background color of the add comment button */
  addCommentBg: string
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
  /** The font family of the code text */
  codeFontFamily: string
  /** The font size of the code text */
  codeFontSize: number
  /** The line height of the code text */
  codeLineHeight: number
}

export interface ThemeTokens {
  /** The colors of the theme */
  colors: ColorTokens
  /** The spacing of the theme */
  spacing: SpacingTokens
  /** The typography of the theme */
  typography: TypographyTokens
}
