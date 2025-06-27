import type { SpacingTokens, TypographyTokens } from './types'

export const spacing: SpacingTokens = {
  xxs: '0.125rem', // 2px
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
}

export const typography: TypographyTokens = {
  regularFontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  regularFontSize: 14,
  codeFontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
  codeFontSize: 12,
  codeLineHeight: 1.5,
}
