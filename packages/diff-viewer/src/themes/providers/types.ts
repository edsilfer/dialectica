import React from 'react'
import { ThemeTokens } from '..'

export interface ThemeProps {
  /** The children of the theme provider */
  children: React.ReactNode
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
}
